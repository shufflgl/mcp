import type { OpenAICompatibleClient } from "../gateway/openaiCompatibleClient.js";
import type { GeneratedImage, ImagePipelineOptions, ImageScore, PromptPipelineResult } from "../types.js";
import { DIRECTOR_PROFILES } from "../director/modes.js";

export async function scoreImages(
  images: GeneratedImage[],
  prompt: PromptPipelineResult,
  options: ImagePipelineOptions,
  client: OpenAICompatibleClient
): Promise<ImageScore[]> {
  return Promise.all(images.map(async (image) => {
    try {
      return await scoreOneImage(image, prompt, options, client);
    } catch (error) {
      return heuristicScore(image.index, error);
    }
  }));
}

export function pickBestImage(images: GeneratedImage[], scores: ImageScore[]): GeneratedImage {
  const bestScore = scores.reduce((best, score) => score.finalScore > best.finalScore ? score : best, scores[0]);
  return images.find((image) => image.index === bestScore.index) ?? images[0];
}

async function scoreOneImage(
  image: GeneratedImage,
  prompt: PromptPipelineResult,
  options: ImagePipelineOptions,
  client: OpenAICompatibleClient
): Promise<ImageScore> {
  const imageUrl = image.b64Json
    ? `data:${image.mimeType};base64,${image.b64Json}`
    : image.url;

  if (!imageUrl) {
    return heuristicScore(image.index, new Error("Image has no b64_json or URL for vision scoring"));
  }

  const content = await client.createChatCompletion({
    model: options.visionModel,
    temperature: 0.1,
    json: true,
    messages: [
      { role: "system", content: buildScoringPrompt(prompt) },
      {
        role: "user",
        content: [
          { type: "text", text: `Generation prompt:\n${prompt.finalPrompt}` },
          { type: "image_url", image_url: { url: imageUrl } }
        ]
      }
    ]
  });

  const parsed = parseJsonObject(content);
  return normalizeScore(image.index, parsed);
}

export function normalizeScore(index: number, value: Record<string, unknown>): ImageScore {
  const domainScores = extractDomainScores(value);
  const composition = numberField(value, "composition", 75);
  const lighting = numberField(value, "lighting", 75);
  const anatomy = numberField(value, "anatomy", 75);
  const realism = numberField(value, "realism", 75);
  const aesthetic = numberField(value, "aesthetic", 75);
  const coherence = numberField(value, "coherence", 75);
  const weighted = Math.round(
    composition * 0.25 +
    lighting * 0.20 +
    anatomy * 0.15 +
    realism * 0.15 +
    aesthetic * 0.15 +
    coherence * 0.10
  );
  return {
    index,
    composition,
    lighting,
    anatomy,
    realism,
    aesthetic,
    coherence,
    finalScore: numberField(value, "finalScore", weighted),
    domainScores: Object.keys(domainScores).length > 0 ? domainScores : undefined,
    rationale: typeof value.rationale === "string" ? value.rationale : undefined
  };
}

function buildScoringPrompt(prompt: PromptPipelineResult): string {
  const profile = DIRECTOR_PROFILES[prompt.director.mode] ?? DIRECTOR_PROFILES.general;
  const criteria = profile.scoring.criteria
    .map((criterion) => `- ${criterion.key} (${criterion.weight}%): ${criterion.description}`)
    .join("\n");
  const penalties = profile.scoring.hardPenalties.map((penalty) => `- ${penalty}`).join("\n");

  return `You are a strict image art director and production reviewer.
Evaluate this generated image for the director mode: ${profile.label}.

Score every criterion from 0 to 100:
${criteria}

Apply these hard penalties when relevant:
${penalties}

Also provide legacy global scores from 0 to 100:
- composition
- lighting
- anatomy
- realism
- aesthetic
- coherence

Return compact JSON only:
{
  "domainScores": {
    ${profile.scoring.criteria.map((criterion) => `"${criterion.key}": 0-100`).join(",\n    ")}
  },
  "composition": 0-100,
  "lighting": 0-100,
  "anatomy": 0-100,
  "realism": 0-100,
  "aesthetic": 0-100,
  "coherence": 0-100,
  "finalScore": 0-100,
  "rationale": "one concise sentence explaining the selection-relevant strengths and weaknesses"
}`;
}

function extractDomainScores(value: Record<string, unknown>): Record<string, number> {
  const raw = value.domainScores;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }
  const result: Record<string, number> = {};
  for (const [key, score] of Object.entries(raw as Record<string, unknown>)) {
    result[key] = numberValue(score, 75);
  }
  return result;
}

function heuristicScore(index: number, error: unknown): ImageScore {
  const finalScore = Math.max(60, 72 - index);
  const warning = error instanceof Error ? error.message : String(error);
  return {
    index,
    composition: finalScore,
    lighting: finalScore,
    anatomy: finalScore,
    realism: finalScore,
    aesthetic: finalScore,
    coherence: finalScore,
    finalScore,
    warning: `Vision scoring unavailable; used deterministic fallback. ${warning}`
  };
}

function parseJsonObject(content: string): Record<string, unknown> {
  const trimmed = content.trim();
  try {
    return JSON.parse(trimmed) as Record<string, unknown>;
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error(`Vision model did not return JSON: ${trimmed.slice(0, 120)}`);
    }
    return JSON.parse(match[0]) as Record<string, unknown>;
  }
}

function numberField(value: Record<string, unknown>, key: string, fallback: number): number {
  return numberValue(value[key], fallback);
}

function numberValue(raw: unknown, fallback: number): number {
  const number = typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw) : NaN;
  if (!Number.isFinite(number)) return fallback;
  return Math.max(0, Math.min(100, Math.round(number)));
}
