import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { readGatewayConfig } from "../config.js";
import { OpenAICompatibleClient } from "../gateway/openaiCompatibleClient.js";
import { generateImagePipeline } from "../generation/imageService.js";
import { buildPromptPipeline } from "../prompt/pipeline.js";
import { listDirectorProfiles } from "../director/modes.js";
import { listStylePresets } from "../styles/presets.js";
import { GenerateImageSchema, RewritePromptSchema, toPipelineOptions, toRewriteOptions } from "./schemas.js";
import type { GenerateImageResult } from "../types.js";

export function createServer(): McpServer {
  const server = new McpServer({
    name: "gpt-image-quality-mcp",
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
