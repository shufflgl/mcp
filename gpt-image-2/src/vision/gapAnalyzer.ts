import { readFile } from "node:fs/promises";
import path from "node:path";
import type { OpenAICompatibleClient } from "../gateway/openaiCompatibleClient.js";
import { DIRECTOR_PROFILES, resolveDirectorProfile } from "../director/modes.js";
import type { ImageGapAnalysisOptions, ImageGapAnalysisResult } from "../types.js";

export async function analyzeImageGap(
  options: ImageGapAnalysisOptions,
  client: OpenAICompatibleClient
): Promise<ImageGapAnalysisResult> {
  const referenceImageUrl = await resolveImageUrl(options.referenceImagePath, options.referenceImageUrl, "reference");
  const candidateImageUrl = await resolveImageUrl(options.candidateImagePath, options.candidateImageUrl, "candidate");
  const profile = resolveDirectorProfile(options.originalPrompt ?? "", options.directorMode);

  const content = await client.createChatCompletion({
    model: options.visionModel,
    json: true,
    messages: [
      { role: "system", content: buildGapAnalysisPrompt(profile.mode) },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: [
              `Original user prompt, if available:\n${options.originalPrompt ?? "(not provided)"}`,
              "Image A is the reference target. Image B is the generated candidate.",
              "Compare Image B against Image A. Focus on production-relevant visual differences, not superficial pixel matching."
            ].join("\n\n")
          },
          { type: "image_url", image_url: { url: referenceImageUrl } },
          { type: "image_url", image_url: { url: candidateImageUrl } }
        ]
      }
    ]
  });

  return normalizeGapAnalysis(profile.mode, parseJsonObject(content));
}

function buildGapAnalysisPrompt(mode: keyof typeof DIRECTOR_PROFILES): string {
  const profile = DIRECTOR_PROFILES[mode] ?? DIRECTOR_PROFILES.general;
  const criteria = profile.scoring.criteria
    .map((criterion) => `- ${criterion.key} (${criterion.weight}%): ${criterion.description}`)
    .join("\n");
  const risks = profile.failureRisks.map((risk) => `- ${risk}`).join("\n");

  return `You are a senior image generation art director.
Your job is to compare a generated candidate image against a reference target and produce actionable generation feedback.

Director mode: ${profile.label}
Director description: ${profile.description}

Use these domain criteria:
${criteria}

Watch for these common failure risks:
${risks}

Return compact JSON only:
{
  "referenceStrengths": ["what the reference does especially well"],
  "candidateStrengths": ["what the candidate already gets right"],
  "candidateWeaknesses": ["specific weaknesses of the candidate versus the reference"],
  "missingElements": ["important reference elements absent or too weak in the candidate"],
  "dimensionScores": {
    ${profile.scoring.criteria.map((criterion) => `"${criterion.key}": 0-100`).join(",\n    ")}
  },
  "overallSimilarity": 0-100,
  "overallGap": 0-100,
  "promptDeltas": ["short prompt clauses to add next time"],
  "negativePromptAdditions": ["failure modes to avoid next time"],
  "nextPrompt": "a concise improved prompt delta or full prompt addendum for the next generation",
  "rerankRubricAdjustments": ["scoring criteria that should be weighted higher next time"],
  "rationale": "one concise paragraph explaining the main gap"
}`;
}

async function resolveImageUrl(imagePath: string | undefined, imageUrl: string | undefined, label: string): Promise<string> {
  if (imageUrl?.trim()) {
    return imageUrl.trim();
  }
  if (!imagePath?.trim()) {
    throw new Error(`Missing ${label} image. Provide ${label}_image_path or ${label}_image_url.`);
  }

  const resolvedPath = path.resolve(imagePath);
  const data = await readFile(resolvedPath);
  return `data:${mimeTypeForPath(resolvedPath)};base64,${data.toString("base64")}`;
}

function mimeTypeForPath(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  if (ext === ".gif") return "image/gif";
  return "image/png";
}

function normalizeGapAnalysis(
  directorMode: ImageGapAnalysisResult["directorMode"],
  value: Record<string, unknown>
): ImageGapAnalysisResult {
  return {
    directorMode,
    referenceStrengths: stringArray(value.referenceStrengths),
    candidateStrengths: stringArray(value.candidateStrengths),
    candidateWeaknesses: stringArray(value.candidateWeaknesses),
    missingElements: stringArray(value.missingElements),
    dimensionScores: scoreRecord(value.dimensionScores),
    overallSimilarity: numberValue(value.overallSimilarity, 70),
    overallGap: numberValue(value.overallGap, 30),
    promptDeltas: stringArray(value.promptDeltas),
    negativePromptAdditions: stringArray(value.negativePromptAdditions),
    nextPrompt: typeof value.nextPrompt === "string" ? value.nextPrompt : "",
    rerankRubricAdjustments: stringArray(value.rerankRubricAdjustments),
    rationale: typeof value.rationale === "string" ? value.rationale : ""
  };
}

function scoreRecord(raw: unknown): Record<string, number> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }
  const result: Record<string, number> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    result[key] = numberValue(value, 70);
  }
  return result;
}

function stringArray(raw: unknown): string[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function numberValue(raw: unknown, fallback: number): number {
  const number = typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw) : NaN;
  if (!Number.isFinite(number)) return fallback;
  return Math.max(0, Math.min(100, Math.round(number)));
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
