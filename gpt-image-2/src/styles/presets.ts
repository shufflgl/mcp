export interface StylePreset {
  name: string;
  label: string;
  prompt: string;
  sceneHints: string[];
}

export const STYLE_PRESETS: Record<string, StylePreset> = {
  cinematic: {
    name: "cinematic",
    label: "Cinematic",
    prompt: "cinematic composition, dramatic but believable lighting, layered depth, premium color grading, filmic texture",
    sceneHints: ["camera lens language", "clear focal subject", "atmospheric depth"]
  },
  anime: {
    name: "anime",
    label: "Anime",
    prompt: "high-end anime illustration, expressive character design, clean linework, controlled color palette, cinematic scene staging",
    sceneHints: ["expressive eyes", "readable silhouette", "dynamic but uncluttered composition"]
  },
  luxury: {
    name: "luxury",
    label: "Luxury Editorial",
    prompt: "luxury editorial photography, refined materials, elegant negative space, polished highlights, premium studio direction",
    sceneHints: ["controlled reflections", "subtle contrast", "high-end art direction"]
  },
  product: {
    name: "product",
    label: "Product",
    prompt: "professional product photography, clean studio lighting, crisp edges, accurate materials, controlled reflections",
    sceneHints: ["hero object framing", "commercial clarity", "realistic surface texture"]
  },
  portrait: {
    name: "portrait",
    label: "Portrait",
    prompt: "cinematic portrait photography, natural skin texture, expressive eyes, flattering portrait lens, nuanced facial lighting",
    sceneHints: ["face clarity", "natural anatomy", "shallow depth of field"]
  },
  architecture: {
    name: "architecture",
    label: "Architecture",
    prompt: "architectural photography, balanced geometry, precise perspective, material realism, refined environmental context",
    sceneHints: ["symmetry where appropriate", "wide-angle discipline", "strong leading lines"]
  },
  landscape: {
    name: "landscape",
    label: "Landscape",
    prompt: "fine art landscape photography, atmospheric perspective, natural light gradients, spatial depth, rich environmental detail",
    sceneHints: ["foreground-midground-background layering", "weather atmosphere", "scale cues"]
  },
  food: {
    name: "food",
    label: "Food",
    prompt: "premium food photography, appetizing texture, natural highlights, careful plating, editorial tabletop composition",
    sceneHints: ["macro detail", "fresh ingredient texture", "soft directional light"]
  },
  scifi: {
    name: "scifi",
    label: "Sci-Fi",
    prompt: "cinematic science fiction art direction, emissive lighting, believable futuristic materials, atmospheric scale, coherent worldbuilding",
    sceneHints: ["emissive light sources", "environmental storytelling", "grounded technology design"]
  },
  realistic: {
    name: "realistic",
    label: "Realistic",
    prompt: "photorealistic rendering, realistic materials, natural lighting behavior, physically plausible details, documentary clarity",
    sceneHints: ["material accuracy", "natural imperfections", "coherent shadows"]
  }
};

export const DEFAULT_STYLE = "cinematic";

export function getStylePreset(style?: string): StylePreset {
  if (!style) {
    return STYLE_PRESETS[DEFAULT_STYLE];
  }
  const key = style.trim().toLowerCase();
  return STYLE_PRESETS[key] ?? {
    name: key || DEFAULT_STYLE,
    label: style,
    prompt: style,
    sceneHints: []
  };
}

export function listStylePresets(): StylePreset[] {
  return Object.values(STYLE_PRESETS);
}
