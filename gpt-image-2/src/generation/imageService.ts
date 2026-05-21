import { readGatewayConfig } from "../config.js";
import { OpenAICompatibleClient } from "../gateway/openaiCompatibleClient.js";
import { buildPromptPipeline } from "../prompt/pipeline.js";
import { buildRefinementPrompt } from "./refinement.js";
import { saveGeneratedImages } from "./storage.js";
import { pickBestImage, scoreImages } from "../vision/scorer.js";
import type { GenerateImageResult, GeneratedImage, ImagePipelineOptions, ImageScore } from "../types.js";

export async function generateImagePipeline(
  options: ImagePipelineOptions,
  gatewayOverrides?: { apiKey?: string; baseUrl?: string; timeoutMs?: number }
): Promise<GenerateImageResult> {
  const gateway = readGatewayConfig(gatewayOverrides);
  const client = new OpenAICompatibleClient(gateway);
  const prompt = await buildPromptPipeline(
    options,
    options.rewriteMode === "template" || options.rewriteMode === "off" ? undefined : client
  );
  const initialSampleCount = boundedSampleCount(options.sampleCount, options.maxImages);
  if (initialSampleCount < options.sampleCount) {
    prompt.warnings.push(`Initial sample_count was capped from ${options.sampleCount} to ${initialSampleCount} by max_images=${options.maxImages}.`);
  }
  const generated = await generateSamples(client, prompt.finalPrompt, { ...options, sampleCount: initialSampleCount });
  const allImages = options.saveImages
    ? await saveGeneratedImages(generated, options.outputDir, options.outputFormat)
    : generated;

  const scores = options.rerank
    ? await scoreImages(allImages, prompt, options, client)
    : allImages.map((image) => defaultScore(image.index));

  let bestImage = pickBestImage(allImages, scores);
  let refinementPrompt: string | undefined;

  if (options.refine && scores.some((score) => score.finalScore < 82)) {
    const remainingBudget = Math.max(0, options.maxImages - allImages.length);
    if (remainingBudget > 0) {
      refinementPrompt = await buildRefinementPrompt(prompt, scores, options, client);
      const refinedPrompt = `${prompt.finalPrompt}, ${refinementPrompt}`;
      const refined = await generateSamples(client, refinedPrompt, { ...options, sampleCount: Math.min(1, remainingBudget), requestMode: "single" });
      const refinedImages = options.saveImages
        ? await saveGeneratedImages(refined.map((image) => ({ ...image, index: allImages.length + image.index })), options.outputDir, options.outputFormat)
        : refined.map((image) => ({ ...image, index: allImages.length + image.index }));
      const refinedScores = options.rerank
        ? await scoreImages(refinedImages, prompt, options, client)
        : refinedImages.map((image) => defaultScore(image.index));
      allImages.push(...refinedImages);
      scores.push(...refinedScores);
      bestImage = pickBestImage(allImages, scores);
    } else {
      prompt.warnings.push(`Refinement skipped because max_images=${options.maxImages} was already reached.`);
    }
  }

  return {
    bestImage,
    allImages,
    scores,
    prompt,
    refinementPrompt,
    gateway: {
      baseUrl: gateway.baseUrl,
      imageModel: options.imageModel,
      textModel: options.textModel,
      visionModel: options.visionModel
    }
  };
}

function boundedSampleCount(sampleCount: number, maxImages: number): number {
  return Math.max(1, Math.min(sampleCount, maxImages));
}

async function generateSamples(
  client: OpenAICompatibleClient,
  prompt: string,
  options: ImagePipelineOptions
): Promise<GeneratedImage[]> {
  if (options.requestMode === "parallel" && options.sampleCount > 1) {
    const batches = await Promise.all(
      Array.from({ length: options.sampleCount }, (_, index) =>
        client.createImages({
          model: options.imageModel,
          prompt,
          n: 1,
          size: options.size,
          quality: options.quality,
          outputFormat: options.outputFormat,
          seed: options.seed === undefined ? undefined : options.seed + index
        })
      )
    );
    return batches.flat().map((image, index) => ({ ...image, index }));
  }

  return client.createImages({
    model: options.imageModel,
    prompt,
    n: options.sampleCount,
    size: options.size,
    quality: options.quality,
    outputFormat: options.outputFormat,
    seed: options.seed
  });
}

function defaultScore(index: number): ImageScore {
  return {
    index,
    composition: 75,
    lighting: 75,
    anatomy: 75,
    realism: 75,
    aesthetic: 75,
    coherence: 75,
    finalScore: 75,
    warning: "Rerank disabled; all samples use neutral scores."
  };
}
