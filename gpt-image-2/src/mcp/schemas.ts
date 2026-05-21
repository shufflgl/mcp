import { z } from "zod";
import {
  defaultImageModel,
  defaultOutputDir,
  defaultOutputFormat,
  defaultQuality,
  defaultTextModel,
  defaultVisionModel,
  env
} from "../config.js";
import type { ImagePipelineOptions } from "../types.js";

const DirectorModeSchema = z.enum([
  "auto",
  "general",
  "ip_character_poster",
  "poster_editorial",
  "product_ad",
  "portrait",
  "character_design",
  "architecture_interior",
  "landscape_travel",
  "food_editorial",
  "infographic",
  "social_media_card",
  "logo_brand_mark"
]);

export const GenerateImageSchema = z.object({
  prompt: z.string().min(1).describe("User's image request."),
  style: z.string().optional().default("cinematic").describe("Style preset name or custom style text."),
  aspect_ratio: z.enum(["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3", "auto"]).optional().default("1:1"),
  size: z.string().optional().describe("Gateway image size, for example 1024x1024, 1536x1536, 1792x1024, or auto if supported."),
  sample_count: z.number().int().min(1).max(10).optional().default(2).describe("Requested number of initial candidates before rerank. The effective count is capped by max_images."),
  max_images: z.number().int().min(1).max(10).optional().default(3).describe("Total image-generation budget for one tool call, including refinement images. Raise this only when cost and latency are acceptable."),
  quality: z.string().optional().default(defaultQuality()).describe("Gateway quality value, commonly auto, low, medium, or high."),
  output_format: z.enum(["png", "jpeg", "webp"]).optional().default(defaultOutputFormat()),
  image_model: z.string().optional().default(defaultImageModel()),
  text_model: z.string().optional().default(defaultTextModel()),
  vision_model: z.string().optional().default(defaultVisionModel()),
  rewrite_mode: z.enum(["auto", "llm", "template", "off"]).optional().default("auto"),
  rerank: z.boolean().optional().default(true),
  refine: z.boolean().optional().default(false),
  request_mode: z.enum(["single", "parallel"]).optional().default("single"),
  save_images: z.boolean().optional().default(true),
  output_dir: z.string().optional().default(defaultOutputDir()),
  director_mode: DirectorModeSchema.optional().default("auto").describe("Scene-specific image director mode. Use auto to route by prompt."),
  quality_mode: z.enum(["fast", "standard", "official_like"]).optional().default("standard").describe("Quality strategy hint for clients and future pipeline defaults."),
  seed: z.number().int().optional(),
  negative_prompt: z.string().optional(),
  user_context: z.string().optional(),
  return_image_data: z.boolean().optional().default(false).describe("Return the best base64 image as MCP image content. Large outputs are possible."),
  api_key: z.string().optional().describe("Optional per-call gateway API key. Environment OPENAI_API_KEY is preferred."),
  base_url: z.string().optional().default(env("OPENAI_BASE_URL")).describe("OpenAI-compatible API base URL."),
  timeout_ms: z.number().int().min(1000).optional()
});

export const RewritePromptSchema = z.object({
  prompt: z.string().min(1),
  style: z.string().optional().default("cinematic"),
  aspect_ratio: z.enum(["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3", "auto"]).optional().default("1:1"),
  rewrite_mode: z.enum(["auto", "llm", "template", "off"]).optional().default("template"),
  director_mode: DirectorModeSchema.optional().default("auto"),
  text_model: z.string().optional().default(defaultTextModel()),
  user_context: z.string().optional(),
  negative_prompt: z.string().optional(),
  api_key: z.string().optional(),
  base_url: z.string().optional().default(env("OPENAI_BASE_URL")),
  timeout_ms: z.number().int().min(1000).optional()
});

export const AnalyzeImageGapSchema = z.object({
  reference_image_path: z.string().optional().describe("Local filesystem path to the reference target image."),
  reference_image_url: z.string().optional().describe("Remote URL or data URL for the reference target image."),
  candidate_image_path: z.string().optional().describe("Local filesystem path to the generated candidate image."),
  candidate_image_url: z.string().optional().describe("Remote URL or data URL for the generated candidate image."),
  original_prompt: z.string().optional().describe("Original prompt used to create or describe the desired image."),
  director_mode: DirectorModeSchema.optional().default("auto"),
  vision_model: z.string().optional().default(defaultVisionModel()),
  api_key: z.string().optional().describe("Optional per-call gateway API key. Environment OPENAI_API_KEY is preferred."),
  base_url: z.string().optional().default(env("OPENAI_BASE_URL")),
  timeout_ms: z.number().int().min(1000).optional()
});

export const GenerateImageWithReferenceSchema = GenerateImageSchema.extend({
  reference_image_path: z.string().optional().describe("Local filesystem path to the reference target image."),
  reference_image_url: z.string().optional().describe("Remote URL or data URL for the reference target image."),
  retry: z.boolean().optional().default(false).describe("When true, run one additional generation using prompt deltas from the gap analysis."),
  retry_min_gap: z.number().min(0).max(100).optional().default(25).describe("Minimum overall gap score required before retry generation is triggered.")
});

export type GenerateImageInput = z.infer<typeof GenerateImageSchema>;
export type RewritePromptInput = z.infer<typeof RewritePromptSchema>;
export type AnalyzeImageGapInput = z.infer<typeof AnalyzeImageGapSchema>;
export type GenerateImageWithReferenceInput = z.infer<typeof GenerateImageWithReferenceSchema>;

export function toPipelineOptions(input: GenerateImageInput): ImagePipelineOptions {
  const quality = applyQualityMode(input);
  return {
    prompt: input.prompt,
    style: input.style,
    aspectRatio: input.aspect_ratio,
    size: input.size,
    sampleCount: quality.sampleCount,
    maxImages: input.max_images ?? 3,
    quality: input.quality,
    outputFormat: input.output_format,
    imageModel: input.image_model,
    textModel: input.text_model,
    visionModel: input.vision_model,
    rewriteMode: input.rewrite_mode,
    rerank: quality.rerank,
    refine: quality.refine,
    requestMode: quality.requestMode,
    saveImages: input.save_images,
    outputDir: input.output_dir,
    directorMode: input.director_mode,
    qualityMode: input.quality_mode,
    seed: input.seed,
    negativePrompt: input.negative_prompt,
    userContext: input.user_context
  };
}

export function toRewriteOptions(input: RewritePromptInput): ImagePipelineOptions {
  return {
    prompt: input.prompt,
    style: input.style,
    aspectRatio: input.aspect_ratio,
    sampleCount: 1,
    maxImages: 1,
    quality: defaultQuality(),
    outputFormat: defaultOutputFormat(),
    imageModel: defaultImageModel(),
    textModel: input.text_model,
    visionModel: defaultVisionModel(),
    rewriteMode: input.rewrite_mode,
    rerank: false,
    refine: false,
    requestMode: "single",
    saveImages: false,
    outputDir: defaultOutputDir(),
    directorMode: input.director_mode,
    qualityMode: "standard",
    negativePrompt: input.negative_prompt,
    userContext: input.user_context
  };
}

function applyQualityMode(input: GenerateImageInput): Pick<ImagePipelineOptions, "sampleCount" | "rerank" | "refine" | "requestMode"> {
  const requestedSampleCount = input.sample_count ?? 2;

  if (input.quality_mode === "fast") {
    return {
      sampleCount: 1,
      rerank: false,
      refine: false,
      requestMode: "single"
    };
  }

  if (input.quality_mode === "official_like") {
    const sampleCount = Math.max(requestedSampleCount, 3);
    return {
      sampleCount,
      rerank: true,
      refine: true,
      requestMode: sampleCount > 1 ? "parallel" : input.request_mode
    };
  }

  return {
    sampleCount: requestedSampleCount,
    rerank: input.rerank,
    refine: input.refine,
    requestMode: input.request_mode
  };
}
