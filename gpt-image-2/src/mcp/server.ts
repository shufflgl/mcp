import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { readGatewayConfig } from "../config.js";
import { OpenAICompatibleClient } from "../gateway/openaiCompatibleClient.js";
import { generateImagePipeline } from "../generation/imageService.js";
import { buildPromptPipeline } from "../prompt/pipeline.js";
import { listDirectorProfiles } from "../director/modes.js";
import { listStylePresets } from "../styles/presets.js";
import { analyzeImageGap } from "../vision/gapAnalyzer.js";
import {
  AnalyzeImageGapSchema,
  GenerateImageSchema,
  GenerateImageWithReferenceSchema,
  RewritePromptSchema,
  toPipelineOptions,
  toRewriteOptions
} from "./schemas.js";
import type { GeneratedImage, GenerateImageResult, ImageGapAnalysisResult } from "../types.js";

export function createServer(): McpServer {
  const server = new McpServer({
    name: "gpt-img-gen",
    version: "0.1.0"
  });

  server.registerTool(
    "generate_image",
    {
      title: "Generate high-quality image",
      description: "Runs prompt expansion, aesthetic prior injection, multi-sampling, optional vision rerank, and optional refinement through an OpenAI-compatible image API gateway.",
      inputSchema: shape(GenerateImageSchema)
    },
    async (input) => {
      const parsed = GenerateImageSchema.parse(input);
      const result = await generateImagePipeline(toPipelineOptions(parsed), {
        apiKey: parsed.api_key,
        baseUrl: parsed.base_url,
        timeoutMs: parsed.timeout_ms
      });
      return resultToMcpContent(result, parsed.return_image_data);
    }
  );

  server.registerTool(
    "rewrite_image_prompt",
    {
      title: "Rewrite image prompt",
      description: "Runs the prompt intelligence layer without generating an image. Useful for previewing final prompts and style presets.",
      inputSchema: shape(RewritePromptSchema)
    },
    async (input) => {
      const parsed = RewritePromptSchema.parse(input);
      const options = toRewriteOptions(parsed);
      const shouldUseClient = parsed.rewrite_mode === "llm" ||
        (parsed.rewrite_mode === "auto" && hasGatewayKey(parsed.api_key));
      const client = shouldUseClient
        ? new OpenAICompatibleClient(readGatewayConfig({
          apiKey: parsed.api_key,
          baseUrl: parsed.base_url,
          timeoutMs: parsed.timeout_ms
        }))
        : undefined;
      const result = await buildPromptPipeline(options, client);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    }
  );

  server.registerTool(
    "list_image_styles",
    {
      title: "List image style presets",
      description: "Returns the built-in image style presets available to generate_image and rewrite_image_prompt.",
      inputSchema: {}
    },
    async () => ({
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(listStylePresets(), null, 2)
        }
      ]
    })
  );

  server.registerTool(
    "list_director_modes",
    {
      title: "List image director modes",
      description: "Returns scene-specific image director modes, their failure risks, and scoring criteria.",
      inputSchema: {}
    },
    async () => ({
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(listDirectorProfiles().map((profile) => ({
            mode: profile.mode,
            label: profile.label,
            description: profile.description,
            qualityTargets: profile.qualityTargets,
            failureRisks: profile.failureRisks,
            scoringCriteria: profile.scoring.criteria
          })), null, 2)
        }
      ]
    })
  );

  server.registerTool(
    "analyze_image_gap",
    {
      title: "Analyze image gap",
      description: "Compares a reference target image with a generated candidate image and returns production-focused weaknesses, prompt deltas, negative prompts, and rerank adjustments.",
      inputSchema: shape(AnalyzeImageGapSchema)
    },
    async (input) => {
      const parsed = AnalyzeImageGapSchema.parse(input);
      const client = new OpenAICompatibleClient(readGatewayConfig({
        apiKey: parsed.api_key,
        baseUrl: parsed.base_url,
        timeoutMs: parsed.timeout_ms
      }));
      const result = await analyzeImageGap({
        referenceImagePath: parsed.reference_image_path,
        referenceImageUrl: parsed.reference_image_url,
        candidateImagePath: parsed.candidate_image_path,
        candidateImageUrl: parsed.candidate_image_url,
        originalPrompt: parsed.original_prompt,
        directorMode: parsed.director_mode,
        visionModel: parsed.vision_model
      }, client);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    }
  );

  server.registerTool(
    "generate_image_with_reference",
    {
      title: "Generate image with reference analysis",
      description: "Generates an image, compares it against a reference target, and optionally performs one retry using the gap analysis prompt deltas.",
      inputSchema: shape(GenerateImageWithReferenceSchema)
    },
    async (input) => {
      const parsed = GenerateImageWithReferenceSchema.parse(input);
      const gatewayOverrides = {
        apiKey: parsed.api_key,
        baseUrl: parsed.base_url,
        timeoutMs: parsed.timeout_ms
      };
      const firstResult = await generateImagePipeline(toPipelineOptions({ ...parsed, save_images: true }), gatewayOverrides);
      const client = new OpenAICompatibleClient(readGatewayConfig(gatewayOverrides));
      const gapAnalysis = await analyzeImageGap({
        referenceImagePath: parsed.reference_image_path,
        referenceImageUrl: parsed.reference_image_url,
        ...imageReference("candidate", firstResult.bestImage),
        originalPrompt: parsed.prompt,
        directorMode: parsed.director_mode,
        visionModel: parsed.vision_model
      }, client);

      let retryResult: GenerateImageResult | undefined;
      if (parsed.retry && gapAnalysis.overallGap >= parsed.retry_min_gap) {
        retryResult = await generateImagePipeline(toPipelineOptions({
          ...parsed,
          prompt: composeRetryPrompt(parsed.prompt, gapAnalysis),
          negative_prompt: [parsed.negative_prompt, ...gapAnalysis.negativePromptAdditions].filter(Boolean).join(", "),
          sample_count: 1,
          max_images: 1,
          quality_mode: "standard",
          request_mode: "single",
          refine: false,
          save_images: true
        }), gatewayOverrides);
      }

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              first_result: summarizeGenerateResult(firstResult),
              gap_analysis: gapAnalysis,
              retry_result: retryResult ? summarizeGenerateResult(retryResult) : undefined,
              final_result: summarizeGenerateResult(retryResult ?? firstResult)
            }, null, 2)
          }
        ]
      };
    }
  );

  return server;
}

function shape(schema: z.AnyZodObject): z.ZodRawShape {
  return schema.shape;
}

function resultToMcpContent(result: GenerateImageResult, returnImageData: boolean) {
  const metadata = {
    best_image: stripImageData(result.bestImage),
    all_images: result.allImages.map(stripImageData),
    scores: result.scores,
    expanded_prompt: result.prompt.expandedPrompt,
    final_prompt: result.prompt.finalPrompt,
    prompt_pipeline: result.prompt,
    refinement_prompt: result.refinementPrompt,
    gateway: result.gateway
  };

  const content: Array<
    { type: "text"; text: string } |
    { type: "image"; data: string; mimeType: string }
  > = [
    {
      type: "text",
      text: JSON.stringify(metadata, null, 2)
    }
  ];

  if (returnImageData && result.bestImage.b64Json) {
    content.push({
      type: "image",
      data: result.bestImage.b64Json,
      mimeType: result.bestImage.mimeType
    });
  }

  return { content };
}

function stripImageData(image: GenerateImageResult["bestImage"]) {
  const { b64Json, ...rest } = image;
  return {
    ...rest,
    has_b64_json: Boolean(b64Json)
  };
}

function hasGatewayKey(apiKey?: string): boolean {
  return Boolean(apiKey?.trim() || process.env.OPENAI_API_KEY?.trim());
}

function summarizeGenerateResult(result: GenerateImageResult) {
  return {
    best_image: stripImageData(result.bestImage),
    all_images: result.allImages.map(stripImageData),
    scores: result.scores,
    expanded_prompt: result.prompt.expandedPrompt,
    final_prompt: result.prompt.finalPrompt,
    prompt_pipeline: result.prompt,
    refinement_prompt: result.refinementPrompt,
    gateway: result.gateway
  };
}

function imageReference(prefix: "reference" | "candidate", image: GeneratedImage) {
  if (image.savedPath) {
    return { [`${prefix}ImagePath`]: image.savedPath };
  }
  if (image.url) {
    return { [`${prefix}ImageUrl`]: image.url };
  }
  if (image.b64Json) {
    return { [`${prefix}ImageUrl`]: `data:${image.mimeType};base64,${image.b64Json}` };
  }
  throw new Error(`Generated ${prefix} image has no path, URL, or base64 data for analysis.`);
}

function composeRetryPrompt(originalPrompt: string, gapAnalysis: ImageGapAnalysisResult): string {
  return [
    originalPrompt,
    "Reference gap repair instructions:",
    gapAnalysis.nextPrompt,
    ...gapAnalysis.promptDeltas
  ].filter(Boolean).join("\n");
}
