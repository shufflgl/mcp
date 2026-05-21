import assert from "node:assert/strict";
import test from "node:test";
import { buildPromptPipeline } from "../dist/prompt/pipeline.js";
import { GenerateImageWithReferenceSchema, toPipelineOptions } from "../dist/mcp/schemas.js";
import { normalizeScore } from "../dist/vision/scorer.js";

test("template prompt pipeline enriches a short prompt", async () => {
  const result = await buildPromptPipeline({
    prompt: "东京雨夜赛博朋克",
    style: "cinematic",
    aspectRatio: "1:1",
    sampleCount: 4,
    quality: "high",
    outputFormat: "png",
    imageModel: "test-image-model",
    textModel: "test-text-model",
    visionModel: "test-text-model",
    rewriteMode: "template",
    rerank: true,
    refine: false,
    requestMode: "single",
    saveImages: false,
    outputDir: "outputs"
  });

  assert.equal(result.rewriteSource, "template");
  assert.match(result.finalPrompt, /cinematic composition/i);
  assert.match(result.finalPrompt, /emissive lighting/i);
  assert.match(result.finalPrompt, /balanced framing/i);
});

test("auto prompt pipeline can run without a gateway client", async () => {
  const result = await buildPromptPipeline({
    prompt: "luxury perfume bottle on black glass",
    style: "product",
    aspectRatio: "1:1",
    sampleCount: 1,
    quality: "high",
    outputFormat: "png",
    imageModel: "test-image-model",
    textModel: "test-text-model",
    visionModel: "test-text-model",
    rewriteMode: "auto",
    rerank: false,
    refine: false,
    requestMode: "single",
    saveImages: false,
    outputDir: "outputs"
  });

  assert.equal(result.rewriteSource, "template");
  assert.match(result.finalPrompt, /professional product photography/i);
});

test("auto director routes poster prompts to editorial poster mode", async () => {
  const result = await buildPromptPipeline({
    prompt: "生成一张高级城市文旅海报，北京冬季城市图鉴，左侧排版，右侧3D城市沙盘",
    style: "luxury",
    aspectRatio: "9:16",
    sampleCount: 1,
    quality: "high",
    outputFormat: "png",
    imageModel: "test-image-model",
    textModel: "test-text-model",
    visionModel: "test-text-model",
    rewriteMode: "off",
    rerank: false,
    refine: false,
    requestMode: "single",
    saveImages: false,
    outputDir: "outputs",
    directorMode: "auto"
  });

  assert.equal(result.director.mode, "poster_editorial");
  assert.match(result.finalPrompt, /finished print poster/i);
  assert.match(result.finalPrompt, /blank poster panel/i);
});

test("auto director routes named IP silhouette posters to character poster mode", async () => {
  const result = await buildPromptPipeline({
    prompt: "原神收藏版史诗叙事海报，巨大的草神纳西妲侧脸剪影，内部包含须弥、赛诺、提纳里、柯莱、奈芙尔，梦幻水彩插画",
    style: "anime",
    aspectRatio: "3:4",
    sampleCount: 1,
    maxImages: 3,
    quality: "high",
    outputFormat: "png",
    imageModel: "test-image-model",
    textModel: "test-text-model",
    visionModel: "test-text-model",
    rewriteMode: "off",
    rerank: false,
    refine: false,
    requestMode: "single",
    saveImages: false,
    outputDir: "outputs",
    directorMode: "auto"
  });

  assert.equal(result.director.mode, "ip_character_poster");
  assert.match(result.finalPrompt, /small childlike Dendro Archon/i);
  assert.match(result.finalPrompt, /Cyno identity anchor/i);
  assert.match(result.finalPrompt, /generic fantasy archetypes/i);
});

test("domain scores are preserved during score normalization", () => {
  const score = normalizeScore(0, {
    domainScores: {
      poster_layout: 93,
      typography_quality: "88"
    },
    composition: 91,
    lighting: 90,
    anatomy: 80,
    realism: 86,
    aesthetic: 94,
    coherence: 89,
    finalScore: 90,
    rationale: "Strong poster layout with minor typography issues."
  });

  assert.equal(score.domainScores.poster_layout, 93);
  assert.equal(score.domainScores.typography_quality, 88);
  assert.equal(score.finalScore, 90);
});

test("official-like quality mode uses bounded sampling and enables rerank refinement", () => {
  const options = toPipelineOptions({
    prompt: "高级产品广告",
    style: "product",
    aspect_ratio: "1:1",
    sample_count: 1,
    quality: "high",
    output_format: "png",
    image_model: "test-image-model",
    text_model: "test-text-model",
    vision_model: "test-text-model",
    rewrite_mode: "off",
    rerank: false,
    refine: false,
    request_mode: "single",
    save_images: true,
    output_dir: "outputs",
    director_mode: "auto",
    quality_mode: "official_like",
    return_image_data: false,
    base_url: "https://example.invalid/v1"
  });

  assert.equal(options.sampleCount, 3);
  assert.equal(options.maxImages, 3);
  assert.equal(options.rerank, true);
  assert.equal(options.refine, true);
  assert.equal(options.requestMode, "parallel");
});

test("generation schema defaults to conservative image budget", () => {
  const options = toPipelineOptions({
    prompt: "quick image",
    style: "cinematic",
    aspect_ratio: "1:1",
    quality: "high",
    output_format: "png",
    image_model: "test-image-model",
    text_model: "test-text-model",
    vision_model: "test-text-model",
    rewrite_mode: "off",
    rerank: true,
    refine: false,
    request_mode: "single",
    save_images: true,
    output_dir: "outputs",
    director_mode: "auto",
    quality_mode: "standard",
    return_image_data: false,
    base_url: "https://example.invalid/v1"
  });

  assert.equal(options.sampleCount, 2);
  assert.equal(options.maxImages, 3);
});

test("reference generation schema defaults to analyze-only retry behavior", () => {
  const parsed = GenerateImageWithReferenceSchema.parse({
    prompt: "reference-guided poster",
    reference_image_url: "data:image/png;base64,cmVm"
  });

  assert.equal(parsed.retry, false);
  assert.equal(parsed.retry_min_gap, 25);
  assert.equal(parsed.director_mode, "auto");
});
