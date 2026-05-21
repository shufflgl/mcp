export type AspectRatio = "1:1" | "16:9" | "9:16" | "4:3" | "3:4" | "3:2" | "2:3" | "auto";

export type OutputFormat = "png" | "jpeg" | "webp";

export type RewriteMode = "auto" | "llm" | "template" | "off";

export type RequestMode = "single" | "parallel";

export type DirectorMode =
  | "auto"
  | "general"
  | "ip_character_poster"
  | "poster_editorial"
  | "product_ad"
  | "portrait"
  | "character_design"
  | "architecture_interior"
  | "landscape_travel"
  | "food_editorial"
  | "infographic"
  | "social_media_card"
  | "logo_brand_mark";

export type QualityMode = "fast" | "standard" | "official_like";

export interface GatewayConfig {
  apiKey: string;
  baseUrl: string;
  organization?: string;
  project?: string;
  timeoutMs: number;
}

export interface ImagePipelineOptions {
  prompt: string;
  style?: string;
  aspectRatio?: AspectRatio;
  size?: string;
  sampleCount: number;
  maxImages: number;
  quality: string;
  outputFormat: OutputFormat;
  imageModel: string;
  textModel: string;
  visionModel: string;
  rewriteMode: RewriteMode;
  rerank: boolean;
  refine: boolean;
  requestMode: RequestMode;
  saveImages: boolean;
  outputDir: string;
  directorMode?: DirectorMode;
  qualityMode?: QualityMode;
  seed?: number;
  negativePrompt?: string;
  userContext?: string;
}

export interface PromptIntent {
  scene?: string;
  subject?: string;
  style?: string;
  lighting?: string;
  atmosphere?: string;
  compositionHints?: string;
  renderingType?: string;
}

export interface PromptPipelineResult {
  originalPrompt: string;
  intent: PromptIntent;
  director: {
    mode: Exclude<DirectorMode, "auto">;
    label: string;
    description: string;
    scoringFocus: string[];
    failureRisks: string[];
  };
  expandedPrompt: string;
  finalPrompt: string;
  appliedStyle: string;
  aestheticPrior: string;
  sceneEnhancement: string;
  identityGuidance: string;
  compositionRules: string;
  rewriteSource: "llm" | "template" | "off";
  warnings: string[];
}

export interface GeneratedImage {
  index: number;
  b64Json?: string;
  url?: string;
  mimeType: string;
  revisedPrompt?: string;
  savedPath?: string;
}

export interface ImageScore {
  index: number;
  composition: number;
  lighting: number;
  anatomy: number;
  realism: number;
  aesthetic: number;
  coherence: number;
  finalScore: number;
  domainScores?: Record<string, number>;
  rationale?: string;
  warning?: string;
}

export interface GenerateImageResult {
  bestImage: GeneratedImage;
  allImages: GeneratedImage[];
  scores: ImageScore[];
  prompt: PromptPipelineResult;
  refinementPrompt?: string;
  gateway: {
    baseUrl: string;
    imageModel: string;
    textModel: string;
    visionModel: string;
  };
}

export interface ImageGapAnalysisOptions {
  referenceImagePath?: string;
  referenceImageUrl?: string;
  candidateImagePath?: string;
  candidateImageUrl?: string;
  originalPrompt?: string;
  directorMode?: DirectorMode;
  visionModel: string;
}

export interface ImageGapAnalysisResult {
  directorMode: Exclude<DirectorMode, "auto">;
  referenceStrengths: string[];
  candidateStrengths: string[];
  candidateWeaknesses: string[];
  missingElements: string[];
  dimensionScores: Record<string, number>;
  overallSimilarity: number;
  overallGap: number;
  promptDeltas: string[];
  negativePromptAdditions: string[];
  nextPrompt: string;
  rerankRubricAdjustments: string[];
  rationale: string;
}
