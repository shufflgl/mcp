import type { OpenAICompatibleClient } from "../gateway/openaiCompatibleClient.js";
import type { ImagePipelineOptions, PromptIntent, PromptPipelineResult } from "../types.js";
import { compileDirectorGuidance, directorSummary, resolveDirectorProfile } from "../director/modes.js";
import { getStylePreset } from "../styles/presets.js";
import {
  AESTHETIC_PRIOR,
  COMPOSITION_RULES,
  INTENT_SYSTEM_PROMPT,
  REWRITE_SYSTEM_PROMPT
} from "./templates.js";

const SCENE_RULES: Array<{ pattern: RegExp; enhancement: string }> = [
  { pattern: /portrait|person|face|人物|人像|肖像|角色|character/i, enhancement: "natural skin texture, expressive eyes, flattering portrait lens, anatomically coherent hands and face" },
  { pattern: /landscape|mountain|forest|ocean|风景|山|森林|海|自然/i, enhancement: "atmospheric perspective, foreground-midground-background depth, natural weather and scale cues" },
  { pattern: /product|watch|shoe|bottle|phone|产品|商品|手表|鞋|瓶|手机/i, enhancement: "studio lighting, clean reflections, precise edges, commercial hero-object framing" },
  { pattern: /architecture|building|interior|建筑|室内|城市|楼/i, enhancement: "balanced geometry, disciplined wide-angle perspective, realistic materials, strong leading lines" },
  { pattern: /food|dish|coffee|dessert|食物|料理|咖啡|甜点/i, enhancement: "macro texture, appetizing highlights, editorial tabletop composition, fresh ingredient detail" },
  { pattern: /sci.?fi|cyberpunk|future|space|科幻|赛博朋克|未来|太空/i, enhancement: "emissive lighting, believable futuristic materials, environmental storytelling, grounded technology design" },
  { pattern: /realistic|photo|documentary|真实|写实|照片|摄影/i, enhancement: "photorealistic material behavior, natural imperfections, coherent shadows, documentary clarity" }
];

const CHARACTER_IDENTITY_ANCHORS: Array<{ pattern: RegExp; guidance: string }> = [
  {
    pattern: /nahida|纳西妲|草神|小草神/i,
    guidance: "Nahida identity anchor: small childlike Dendro Archon, petite youthful proportions, pale white hair with soft green accents, large green eyes, elf-like ears, white-and-green leaf-motif outfit, gentle sacred expression; never adultify her."
  },
  {
    pattern: /cyno|赛诺/i,
    guidance: "Cyno identity anchor: serious desert General Mahamatra presence, white hair, Anubis/jackal-inspired black headpiece with tall ears, purple-black-gold desert palette, polearm/spear silhouette, disciplined stern expression."
  },
  {
    pattern: /tighnari|提纳里/i,
    guidance: "Tighnari identity anchor: young forest ranger scholar, dark green-black hair, large fox-like ears, green botanical ranger palette, cape and leaf motifs, calm intelligent expression."
  },
  {
    pattern: /collei|柯莱/i,
    guidance: "Collei identity anchor: young trainee forest ranger, green hair, youthful gentle face, forest-ranger outfit, scarf and leaf motifs, modest energetic posture."
  },
  {
    pattern: /nefer|neferu|奈芙尔/i,
    guidance: "Nefer identity anchor: preserve the requested canonical character if recognized; avoid replacing her with a generic desert dancer, random priestess, or unrelated fantasy woman."
  }
];

const IP_CHARACTER_PATTERN = /genshin|原神|sumeru|须弥|nahida|纳西妲|cyno|赛诺|tighnari|提纳里|collei|柯莱|nefer|奈芙尔/i;

export async function buildPromptPipeline(
  options: ImagePipelineOptions,
  client?: OpenAICompatibleClient
): Promise<PromptPipelineResult> {
  const warnings: string[] = [];
  const style = getStylePreset(options.style);
  const director = resolveDirectorProfile(options.prompt, options.directorMode);
  const rewriteSource = options.rewriteMode === "off"
    ? "off"
    : options.rewriteMode === "template"
      ? "template"
      : client
        ? "llm"
        : "template";

  const intent = rewriteSource === "llm"
    ? await parseIntentWithFallback(options, client!, warnings)
    : inferIntent(options.prompt, options.style);

  const expandedPrompt = rewriteSource === "off"
    ? options.prompt.trim()
    : rewriteSource === "llm"
      ? await rewriteWithFallback(options, client!, style.prompt, warnings)
      : templateRewrite(options, style.prompt);

  const sceneEnhancement = buildSceneEnhancement(options.prompt, intent, style.sceneHints);
  const identityGuidance = buildIdentityGuidance(options.prompt);
  const negativeParts = [...director.negativePrompt, options.negativePrompt].filter(Boolean);
  const negative = negativeParts.length > 0 ? `Avoid: ${negativeParts.join(", ")}.` : "";
  const userContext = options.userContext ? `Context: ${options.userContext.trim()}.` : "";
  const finalPrompt = compactJoin([
    compileDirectorGuidance(director),
    expandedPrompt,
    style.prompt,
    AESTHETIC_PRIOR,
    sceneEnhancement,
    identityGuidance,
    COMPOSITION_RULES,
    negative,
    userContext
  ]);

  return {
    originalPrompt: options.prompt,
    intent,
    director: directorSummary(director),
    expandedPrompt,
    finalPrompt,
    appliedStyle: style.name,
    aestheticPrior: AESTHETIC_PRIOR,
    sceneEnhancement,
    identityGuidance,
    compositionRules: COMPOSITION_RULES,
    rewriteSource,
    warnings
  };
}

export function buildIdentityGuidance(prompt: string): string {
  const anchors = CHARACTER_IDENTITY_ANCHORS
    .filter((anchor) => anchor.pattern.test(prompt))
    .map((anchor) => anchor.guidance);

  if (anchors.length === 0 && !IP_CHARACTER_PATTERN.test(prompt)) {
    return "";
  }

  return [
    "Named character fidelity policy: preserve canonical likeness, age impression, face proportions, hairstyle, costume color palette, signature accessories, role symbols, and setting-specific motifs for every named existing character; do not replace named characters with generic fantasy archetypes; if uncertain, reduce detail or use symbolic cameos rather than inventing unrelated designs.",
    anchors.length > 0 ? `Known identity anchors: ${anchors.join(" ")}` : undefined
  ].filter((part): part is string => Boolean(part)).join(" ");
}

export function inferIntent(prompt: string, style?: string): PromptIntent {
  return {
    scene: prompt.trim(),
    subject: prompt.trim(),
    style,
    renderingType: detectRenderingType(prompt)
  };
}

export function templateRewrite(options: ImagePipelineOptions, stylePrompt: string): string {
  const aspect = options.aspectRatio && options.aspectRatio !== "auto"
    ? `composed for a ${options.aspectRatio} frame`
    : "composed with balanced framing";

  return compactJoin([
    options.prompt.trim(),
    "visually rich and coherent",
    aspect,
    stylePrompt,
    "clear subject hierarchy",
    "refined lighting and atmosphere"
  ]);
}

export function buildSceneEnhancement(prompt: string, intent: PromptIntent, styleHints: string[] = []): string {
  const haystack = compactJoin([
    prompt,
    intent.scene,
    intent.subject,
    intent.style,
    intent.renderingType
  ]);
  const matched = SCENE_RULES
    .filter((rule) => rule.pattern.test(haystack))
    .map((rule) => rule.enhancement);

  return compactJoin([...matched, ...styleHints]);
}

async function parseIntentWithFallback(
  options: ImagePipelineOptions,
  client: OpenAICompatibleClient,
  warnings: string[]
): Promise<PromptIntent> {
  try {
    const content = await client.createChatCompletion({
      model: options.textModel,
      temperature: 0.1,
      json: true,
      messages: [
        { role: "system", content: INTENT_SYSTEM_PROMPT },
        { role: "user", content: options.prompt }
      ]
    });
    return parseJsonObject(content) as PromptIntent;
  } catch (error) {
    warnings.push(`Intent parsing fell back to template inference: ${formatError(error)}`);
    return inferIntent(options.prompt, options.style);
  }
}

async function rewriteWithFallback(
  options: ImagePipelineOptions,
  client: OpenAICompatibleClient,
  stylePrompt: string,
  warnings: string[]
): Promise<string> {
  try {
    return await client.createChatCompletion({
      model: options.textModel,
      temperature: 0.7,
      messages: [
        { role: "system", content: REWRITE_SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            `User request: ${options.prompt}`,
            `Style prior: ${stylePrompt}`,
            options.aspectRatio ? `Aspect ratio: ${options.aspectRatio}` : "",
            options.userContext ? `Context: ${options.userContext}` : ""
          ].filter(Boolean).join("\n")
        }
      ]
    });
  } catch (error) {
    warnings.push(`Prompt rewrite fell back to template rewrite: ${formatError(error)}`);
    return templateRewrite(options, stylePrompt);
  }
}

function detectRenderingType(prompt: string): string {
  if (/anime|illustration|插画|动漫|漫画/i.test(prompt)) return "illustration";
  if (/photo|photography|realistic|照片|摄影|写实/i.test(prompt)) return "photography";
  if (/3d|render|cgi|渲染/i.test(prompt)) return "3d render";
  return "unspecified";
}

export function compactJoin(parts: Array<string | undefined>): string {
  return parts
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join(", ")
    .replace(/\s+/g, " ")
    .replace(/,\s*,+/g, ",");
}

function parseJsonObject(content: string): Record<string, unknown> {
  const trimmed = content.trim();
  try {
    return JSON.parse(trimmed) as Record<string, unknown>;
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error(`Model did not return JSON: ${trimmed.slice(0, 120)}`);
    }
    return JSON.parse(match[0]) as Record<string, unknown>;
  }
}

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
