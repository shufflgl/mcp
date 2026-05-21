import type { DirectorMode } from "../types.js";

export interface DirectorProfile {
  mode: Exclude<DirectorMode, "auto">;
  label: string;
  description: string;
  triggers: RegExp[];
  hardConstraints: string[];
  qualityTargets: string[];
  failureRisks: string[];
  negativePrompt: string[];
  scoring: {
    criteria: Array<{
      key: string;
      label: string;
      weight: number;
      description: string;
    }>;
    hardPenalties: string[];
  };
}

export const DIRECTOR_PROFILES: Record<Exclude<DirectorMode, "auto">, DirectorProfile> = {
  general: {
    mode: "general",
    label: "General Image Director",
    description: "Balanced high-quality image generation for prompts that do not map to a specialized domain.",
    triggers: [],
    hardConstraints: [
      "Preserve the user's main subject and intent.",
      "Create a clear focal hierarchy with coherent composition.",
      "Use a consistent visual style, lighting direction, and material language."
    ],
    qualityTargets: [
      "high visual coherence",
      "strong subject clarity",
      "appropriate detail density",
      "professional lighting",
      "no accidental UI, collage, or screenshot artifacts"
    ],
    failureRisks: [
      "generic composition",
      "style drift",
      "unclear subject hierarchy",
      "inconsistent lighting"
    ],
    negativePrompt: [
      "low detail",
      "generic stock image",
      "messy composition",
      "accidental screenshot UI",
      "inconsistent style"
    ],
    scoring: {
      criteria: [
        { key: "subject_clarity", label: "Subject clarity", weight: 25, description: "The intended subject is immediately readable and well framed." },
        { key: "composition", label: "Composition", weight: 20, description: "The image has balanced framing, clear visual hierarchy, and useful negative space." },
        { key: "lighting", label: "Lighting", weight: 20, description: "Lighting is coherent, attractive, and supports the mood." },
        { key: "detail_quality", label: "Detail quality", weight: 15, description: "Details are rich where needed without becoming noisy." },
        { key: "style_coherence", label: "Style coherence", weight: 10, description: "Style, materials, and rendering language are consistent." },
        { key: "artifact_control", label: "Artifact control", weight: 10, description: "No major distortions, broken objects, or unwanted UI artifacts." }
      ],
      hardPenalties: [
        "Major subject mismatch: subtract 30.",
        "Wrong orientation or format: subtract 25.",
        "Unwanted screenshot, browser, or app UI artifact: subtract 20."
      ]
    }
  },
  ip_character_poster: {
    mode: "ip_character_poster",
    label: "IP Character Poster Director",
    description: "Collectible posters, fan-style key visuals, silhouette narrative composites, and named game/anime character scenes where character recognizability is critical.",
    triggers: [/genshin|原神|sumeru|须弥|nahida|纳西妲|cyno|赛诺|tighnari|提纳里|collei|柯莱|nefer|奈芙尔|collector poster|收藏版|史诗叙事海报|silhouette|剪影|double exposure|双重曝光/i],
    hardConstraints: [
      "Treat this as a premium character-IP poster: named characters must remain recognizable, not generic fantasy substitutes.",
      "Preserve canonical age impression, face proportion, hairstyle, silhouette, costume palette, accessories, and role-specific symbols for every named character.",
      "For silhouette or double-exposure layouts, integrate world scenes inside the hero outline as one coherent narrative composition, not a loose collage.",
      "If the model is uncertain about a secondary named character, keep that character as a conservative symbolic cameo rather than inventing an unrelated design."
    ],
    qualityTargets: [
      "recognizable named character likeness",
      "canonical age and proportion",
      "accurate costume and accessory anchors",
      "theme-bound worldbuilding details",
      "coherent silhouette narrative composition",
      "premium collectible poster restraint"
    ],
    failureRisks: [
      "named characters look generic or wrong",
      "childlike characters are adultified",
      "wrong costume palette or missing iconic accessories",
      "unrelated fantasy figures replacing requested characters",
      "messy collage instead of integrated narrative silhouette",
      "template fantasy background"
    ],
    negativePrompt: [
      "generic anime character",
      "wrong character identity",
      "adultified child character",
      "random fantasy substitute",
      "incorrect costume palette",
      "missing iconic accessories",
      "hard collage cutouts",
      "template fantasy background",
      "unrelated characters"
    ],
    scoring: {
      criteria: [
        { key: "character_likeness", label: "Character likeness", weight: 30, description: "Named characters are immediately recognizable from face, age impression, hair, costume, silhouette, and accessories." },
        { key: "canon_identity_anchors", label: "Canon identity anchors", weight: 20, description: "The image preserves the requested IP's core symbols, setting identity, and character-specific visual cues." },
        { key: "narrative_silhouette_composition", label: "Narrative silhouette composition", weight: 20, description: "Silhouette, double exposure, and interior story scenes read as one intentional poster composition rather than a collage." },
        { key: "theme_binding", label: "Theme binding", weight: 15, description: "Buildings, props, creatures, colors, and atmosphere strongly match the requested world and theme." },
        { key: "style_integration", label: "Style integration", weight: 10, description: "Watercolor, cinematic poster, paper texture, and fantasy mood are consistent and premium." },
        { key: "artifact_control", label: "Artifact control", weight: 5, description: "No unwanted UI, screenshot, random text, or malformed anatomy distracts from the poster." }
      ],
      hardPenalties: [
        "Primary named character is not recognizable: subtract 35.",
        "A childlike character is adultified or given the wrong age impression: subtract 30.",
        "A requested named character is replaced by a generic unrelated figure: subtract 25.",
        "Silhouette narrative becomes a messy collage: subtract 20.",
        "IP setting identity is missing or generic: subtract 20."
      ]
    }
  },
  poster_editorial: {
    mode: "poster_editorial",
    label: "Poster / Editorial Cover Director",
    description: "Designed for posters, covers, travel atlas pages, campaign key visuals, and print editorial compositions.",
    triggers: [/poster|cover|editorial|atlas|magazine|key visual|海报|封面|图鉴|画册|主视觉|文旅|排版|版式/i],
    hardConstraints: [
      "Treat the image as a finished print poster or editorial cover, not just an illustration.",
      "Establish a strong layout grid, headline area, subtitle area, supporting information, and visual hero area.",
      "If typography is requested, create visible typographic hierarchy with large readable headline-like forms.",
      "Preserve deliberate margins, paper texture, and premium print-design discipline."
    ],
    qualityTargets: [
      "clear poster layout hierarchy",
      "premium editorial typography area",
      "high information density with order",
      "print material texture",
      "finished cover-design feeling"
    ],
    failureRisks: [
      "blank layout panel",
      "unreadable chaotic typography",
      "generic illustration instead of poster",
      "sparse visual content",
      "web screenshot or UI-like artifact"
    ],
    negativePrompt: [
      "blank poster panel",
      "chaotic unreadable typography",
      "webpage screenshot",
      "phone screenshot",
      "flat low-detail poster",
      "random text blocks",
      "missing headline hierarchy"
    ],
    scoring: {
      criteria: [
        { key: "poster_layout", label: "Poster layout", weight: 25, description: "Grid, margins, headline area, and hero visual feel intentionally designed." },
        { key: "typography_quality", label: "Typography quality", weight: 20, description: "Important title-like text is visually clear, elegant, and integrated." },
        { key: "information_hierarchy", label: "Information hierarchy", weight: 15, description: "Subtitles, legends, labels, or decorative text blocks support the design without clutter." },
        { key: "hero_visual_strength", label: "Hero visual strength", weight: 15, description: "The main illustration or subject is rich, focused, and memorable." },
        { key: "print_material_lighting", label: "Print material and lighting", weight: 15, description: "Paper, ink, relief, lighting, and finish feel premium." },
        { key: "coherence", label: "Coherence", weight: 10, description: "The visual system feels unified and free from screenshot/collage artifacts." }
      ],
      hardPenalties: [
        "Missing obvious poster layout: subtract 25.",
        "Blank intended typography panel: subtract 20.",
        "Important headline unreadable or absent: subtract 20.",
        "Web/app screenshot artifact: subtract 25."
      ]
    }
  },
  product_ad: {
    mode: "product_ad",
    label: "Product Advertising Director",
    description: "Commercial hero product, ecommerce, luxury goods, packaging, and studio advertising images.",
    triggers: [/product|ecommerce|advertising|packshot|bottle|watch|shoe|cosmetic|perfume|产品|商品|电商|广告|香水|手表|包装|美妆|鞋/i],
    hardConstraints: [
      "Make the product the unmistakable hero subject.",
      "Preserve clean silhouette, accurate shape, and premium material behavior.",
      "Use commercial lighting with controlled reflections and a disciplined background."
    ],
    qualityTargets: [
      "clean product silhouette",
      "accurate material fidelity",
      "controlled reflections",
      "premium commercial lighting",
      "brand-safe composition"
    ],
    failureRisks: [
      "warped product shape",
      "messy reflections",
      "duplicate product artifacts",
      "dirty background",
      "illegible label"
    ],
    negativePrompt: [
      "warped bottle",
      "duplicate product",
      "messy reflection",
      "dirty studio",
      "cluttered background",
      "incorrect label placement",
      "cheap stock render"
    ],
    scoring: {
      criteria: [
        { key: "product_silhouette", label: "Product silhouette", weight: 25, description: "The product shape is clean, accurate, and commercially readable." },
        { key: "material_fidelity", label: "Material fidelity", weight: 20, description: "Glass, metal, plastic, fabric, liquid, or packaging materials look convincing." },
        { key: "commercial_lighting", label: "Commercial lighting", weight: 20, description: "Lighting is controlled, premium, and sells the object." },
        { key: "reflection_control", label: "Reflection control", weight: 15, description: "Reflections and highlights are attractive and not chaotic." },
        { key: "background_discipline", label: "Background discipline", weight: 10, description: "Background supports the product without clutter." },
        { key: "premium_feel", label: "Premium feel", weight: 10, description: "The image feels like a polished campaign or ecommerce hero shot." }
      ],
      hardPenalties: [
        "Product is not the clear hero: subtract 30.",
        "Product shape is badly warped: subtract 25.",
        "Multiple accidental duplicate products: subtract 20."
      ]
    }
  },
  portrait: {
    mode: "portrait",
    label: "Portrait Director",
    description: "Human portraits, professional headshots, fashion portraits, and cinematic character photography.",
    triggers: [/portrait|headshot|person|face|model|人像|肖像|写真|头像|人物|模特/i],
    hardConstraints: [
      "Prioritize face integrity, natural expression, eye focus, and anatomically plausible hands.",
      "Use flattering lens choice, coherent pose, and realistic skin texture.",
      "Keep wardrobe, background, and lighting consistent with the requested mood."
    ],
    qualityTargets: [
      "face integrity",
      "natural hands",
      "expressive eyes",
      "realistic skin texture",
      "flattering portrait lighting"
    ],
    failureRisks: [
      "extra fingers",
      "asymmetrical eyes",
      "plastic skin",
      "unnatural pose",
      "wardrobe artifacts"
    ],
    negativePrompt: [
      "extra fingers",
      "broken hands",
      "asymmetrical eyes",
      "plastic skin",
      "uncanny face",
      "distorted pose"
    ],
    scoring: {
      criteria: [
        { key: "face_integrity", label: "Face integrity", weight: 25, description: "Face structure, eyes, mouth, and expression are natural and appealing." },
        { key: "hand_anatomy", label: "Hand anatomy", weight: 20, description: "Hands and fingers are plausible when visible." },
        { key: "expression_pose", label: "Expression and pose", weight: 15, description: "Expression and pose feel intentional and natural." },
        { key: "skin_texture", label: "Skin texture", weight: 15, description: "Skin texture is refined but not plastic." },
        { key: "portrait_lighting", label: "Portrait lighting", weight: 15, description: "Lighting flatters the subject and supports the scene." },
        { key: "wardrobe_coherence", label: "Wardrobe coherence", weight: 10, description: "Wardrobe and background are consistent and artifact-free." }
      ],
      hardPenalties: [
        "Broken face or eyes: subtract 35.",
        "Bad hand anatomy in visible foreground: subtract 25.",
        "Uncanny plastic skin: subtract 15."
      ]
    }
  },
  character_design: {
    mode: "character_design",
    label: "Character Design Director",
    description: "Game, animation, IP, mascot, concept art, and character sheet generation.",
    triggers: [/character|mascot|concept art|game character|anime|角色|人设|设定|IP形象|吉祥物|动漫|游戏/i],
    hardConstraints: [
      "Create a distinctive character silhouette, coherent costume system, and readable personality.",
      "Prioritize consistency of face, clothing details, accessories, and pose language.",
      "For sheets, use organized turnarounds or panels with consistent proportions."
    ],
    qualityTargets: [
      "distinctive silhouette",
      "coherent costume design",
      "consistent identity",
      "clear personality",
      "production-ready concept detail"
    ],
    failureRisks: [
      "generic character",
      "inconsistent costume",
      "broken anatomy",
      "unreadable accessories",
      "messy character sheet"
    ],
    negativePrompt: [
      "generic character",
      "inconsistent costume",
      "messy sheet layout",
      "broken anatomy",
      "random accessories"
    ],
    scoring: {
      criteria: [
        { key: "silhouette", label: "Silhouette", weight: 20, description: "The character is recognizable from shape and pose." },
        { key: "identity_consistency", label: "Identity consistency", weight: 20, description: "Face, costume, accessories, and theme work together." },
        { key: "costume_detail", label: "Costume detail", weight: 20, description: "Costume and props are rich, intentional, and readable." },
        { key: "anatomy_pose", label: "Anatomy and pose", weight: 15, description: "Anatomy and pose are plausible for the style." },
        { key: "personality", label: "Personality", weight: 15, description: "The design communicates a clear role or personality." },
        { key: "production_clarity", label: "Production clarity", weight: 10, description: "Details are clear enough for downstream use." }
      ],
      hardPenalties: [
        "Character identity is generic or unclear: subtract 20.",
        "Major anatomy failure: subtract 25.",
        "Requested character sheet is disorganized: subtract 20."
      ]
    }
  },
  architecture_interior: {
    mode: "architecture_interior",
    label: "Architecture / Interior Director",
    description: "Architecture, interiors, real estate, hospitality, urban design, and spatial renderings.",
    triggers: [/architecture|interior|building|villa|hotel|room|lobby|建筑|室内|空间|别墅|酒店|客厅|展厅/i],
    hardConstraints: [
      "Prioritize correct perspective, believable scale, and coherent spatial depth.",
      "Use realistic materials, structural logic, and consistent light direction.",
      "Avoid impossible geometry, warped windows, floating stairs, or scale contradictions."
    ],
    qualityTargets: [
      "perspective correctness",
      "spatial depth",
      "material realism",
      "architectural identity",
      "scale cues"
    ],
    failureRisks: [
      "impossible perspective",
      "warped windows",
      "floating stairs",
      "wrong scale",
      "material inconsistency"
    ],
    negativePrompt: [
      "impossible geometry",
      "warped windows",
      "floating stairs",
      "incorrect perspective",
      "inconsistent scale"
    ],
    scoring: {
      criteria: [
        { key: "perspective", label: "Perspective", weight: 25, description: "Perspective and geometry are plausible and controlled." },
        { key: "spatial_depth", label: "Spatial depth", weight: 20, description: "The space has readable depth, circulation, and scale." },
        { key: "material_realism", label: "Material realism", weight: 20, description: "Materials look physically plausible and consistent." },
        { key: "lighting_direction", label: "Lighting direction", weight: 15, description: "Light sources and shadows are coherent." },
        { key: "architectural_identity", label: "Architectural identity", weight: 10, description: "The requested architecture or interior style is recognizable." },
        { key: "detail_control", label: "Detail control", weight: 10, description: "Details support the design without visual noise." }
      ],
      hardPenalties: [
        "Impossible perspective or geometry: subtract 30.",
        "Major scale contradiction: subtract 20.",
        "Material system is incoherent: subtract 15."
      ]
    }
  },
  landscape_travel: {
    mode: "landscape_travel",
    label: "Landscape / Travel Director",
    description: "Natural landscapes, cityscapes, travel photography, and destination imagery.",
    triggers: [/landscape|travel|cityscape|mountain|forest|ocean|destination|风景|旅行|城市景观|山|森林|海|目的地/i],
    hardConstraints: [
      "Create strong foreground, midground, and background layering.",
      "Use atmosphere, weather, scale cues, and destination-specific identity.",
      "Keep lighting natural and spatially coherent."
    ],
    qualityTargets: [
      "atmospheric depth",
      "destination identity",
      "natural light",
      "scale cues",
      "rich environment detail"
    ],
    failureRisks: [
      "generic postcard",
      "flat depth",
      "missing destination identity",
      "overprocessed color"
    ],
    negativePrompt: [
      "generic postcard",
      "flat landscape",
      "overprocessed HDR",
      "missing destination identity",
      "tourist stock photo"
    ],
    scoring: {
      criteria: [
        { key: "depth_layering", label: "Depth layering", weight: 25, description: "Foreground, midground, and background create strong spatial depth." },
        { key: "destination_identity", label: "Destination identity", weight: 20, description: "The place or travel concept is recognizable." },
        { key: "atmosphere", label: "Atmosphere", weight: 20, description: "Weather, air, light, and mood feel immersive." },
        { key: "composition", label: "Composition", weight: 15, description: "Framing leads the eye through the scene." },
        { key: "naturalism", label: "Naturalism", weight: 10, description: "Colors, materials, and lighting are believable for the style." },
        { key: "detail_density", label: "Detail density", weight: 10, description: "Environmental details are rich without clutter." }
      ],
      hardPenalties: [
        "Destination identity missing: subtract 20.",
        "Flat scene with no depth: subtract 20.",
        "Wrong season or weather: subtract 15."
      ]
    }
  },
  food_editorial: {
    mode: "food_editorial",
    label: "Food Editorial Director",
    description: "Food photography, drinks, restaurant imagery, cookbook editorial, and menu visuals.",
    triggers: [/food|dish|drink|coffee|dessert|restaurant|食物|美食|料理|饮品|咖啡|甜点|餐厅/i],
    hardConstraints: [
      "Make the food appetizing with accurate texture, freshness, and controlled highlights.",
      "Use editorial tabletop composition with intentional props and negative space.",
      "Avoid plastic-looking food, messy plating, or unappetizing color."
    ],
    qualityTargets: [
      "appetizing texture",
      "freshness",
      "editorial plating",
      "natural highlights",
      "tabletop composition"
    ],
    failureRisks: [
      "plastic food",
      "messy plating",
      "unappetizing color",
      "wrong texture",
      "dirty table"
    ],
    negativePrompt: [
      "plastic food",
      "messy plating",
      "dirty table",
      "unappetizing color",
      "melted wrong texture"
    ],
    scoring: {
      criteria: [
        { key: "appetite_appeal", label: "Appetite appeal", weight: 25, description: "Food looks fresh, desirable, and edible." },
        { key: "texture_accuracy", label: "Texture accuracy", weight: 20, description: "Food textures and ingredients are convincing." },
        { key: "plating_composition", label: "Plating and composition", weight: 20, description: "Plating and props are intentional and editorial." },
        { key: "lighting", label: "Lighting", weight: 15, description: "Light creates appetizing highlights and depth." },
        { key: "color_harmony", label: "Color harmony", weight: 10, description: "Colors feel fresh and balanced." },
        { key: "cleanliness", label: "Cleanliness", weight: 10, description: "Scene is clean and commercially usable." }
      ],
      hardPenalties: [
        "Food looks inedible or plastic: subtract 30.",
        "Messy dirty plating: subtract 20.",
        "Requested dish is unrecognizable: subtract 20."
      ]
    }
  },
  infographic: {
    mode: "infographic",
    label: "Infographic Director",
    description: "Information graphics, maps, explainers, diagrams, chart-like visuals, and visual reports.",
    triggers: [/infographic|diagram|chart|map|explainer|信息图|图解|图表|地图|流程|说明/i],
    hardConstraints: [
      "Prioritize clear structure, grid alignment, visual hierarchy, and icon consistency.",
      "Use simplified but polished visual elements; avoid dense illegible text.",
      "For exact text needs, leave clean text zones suitable for later overlay."
    ],
    qualityTargets: [
      "clear information hierarchy",
      "consistent icon system",
      "grid structure",
      "low clutter",
      "legible blocks"
    ],
    failureRisks: [
      "unreadable tiny text",
      "random pseudo charts",
      "cluttered layout",
      "inconsistent icons",
      "semantic confusion"
    ],
    negativePrompt: [
      "random pseudo chart",
      "cluttered diagram",
      "illegible tiny text",
      "inconsistent icons",
      "spreadsheet screenshot"
    ],
    scoring: {
      criteria: [
        { key: "layout_clarity", label: "Layout clarity", weight: 25, description: "Information is arranged in a readable grid or flow." },
        { key: "visual_hierarchy", label: "Visual hierarchy", weight: 20, description: "Important elements stand out in the right order." },
        { key: "icon_consistency", label: "Icon consistency", weight: 15, description: "Icons and symbols share a coherent style." },
        { key: "text_zone_quality", label: "Text zone quality", weight: 15, description: "Text areas are legible or suitable for later overlay." },
        { key: "semantic_clarity", label: "Semantic clarity", weight: 15, description: "The graphic appears to explain the requested topic." },
        { key: "low_clutter", label: "Low clutter", weight: 10, description: "The design avoids noise and random marks." }
      ],
      hardPenalties: [
        "Looks like a broken spreadsheet or web screenshot: subtract 25.",
        "No clear information structure: subtract 25.",
        "Random nonsensical charts dominate: subtract 20."
      ]
    }
  },
  social_media_card: {
    mode: "social_media_card",
    label: "Social Media Card Director",
    description: "Promotional cards, social posts, announcement graphics, and compact shareable visuals.",
    triggers: [/social|instagram|xiaohongshu|post|card|公众号|小红书|社媒|推文|卡片|封面图/i],
    hardConstraints: [
      "Create a compact, scroll-stopping visual with clear focal point and social-safe margins.",
      "Use concise text-like areas and graphic hierarchy suitable for mobile viewing.",
      "Avoid over-dense small details that will fail at thumbnail size."
    ],
    qualityTargets: [
      "thumbnail readability",
      "clear hook",
      "mobile-safe hierarchy",
      "brand-like polish",
      "clean composition"
    ],
    failureRisks: [
      "too much small text",
      "weak focal point",
      "busy mobile layout",
      "generic template look"
    ],
    negativePrompt: [
      "crowded tiny text",
      "weak focal point",
      "generic Canva template",
      "messy mobile layout",
      "browser screenshot"
    ],
    scoring: {
      criteria: [
        { key: "thumbnail_readability", label: "Thumbnail readability", weight: 25, description: "The card reads well at social feed size." },
        { key: "focal_hook", label: "Focal hook", weight: 20, description: "There is a strong visual or headline hook." },
        { key: "mobile_layout", label: "Mobile layout", weight: 20, description: "Margins, spacing, and hierarchy work for mobile display." },
        { key: "visual_polish", label: "Visual polish", weight: 15, description: "The card feels designed and brand-aware." },
        { key: "simplicity", label: "Simplicity", weight: 10, description: "It avoids excess clutter." },
        { key: "style_fit", label: "Style fit", weight: 10, description: "Style matches the requested platform or campaign." }
      ],
      hardPenalties: [
        "Unreadable at thumbnail scale: subtract 25.",
        "No focal hook: subtract 20.",
        "Looks like an accidental screenshot: subtract 20."
      ]
    }
  },
  logo_brand_mark: {
    mode: "logo_brand_mark",
    label: "Logo / Brand Mark Director",
    description: "Logos, marks, icons, badges, and brand identity symbols.",
    triggers: [/logo|brand mark|icon|badge|monogram|标志|品牌|图标|徽章|商标/i],
    hardConstraints: [
      "Prioritize simple recognizable shape language, scalability, and clean negative space.",
      "Avoid complex rendered scenes unless explicitly requested.",
      "For exact typography, prefer leaving clean text placement rather than pseudo lettering."
    ],
    qualityTargets: [
      "simple silhouette",
      "scalable mark",
      "balanced negative space",
      "distinctive identity",
      "clean edges"
    ],
    failureRisks: [
      "overly complex illustration",
      "pseudo text",
      "generic logo",
      "poor silhouette",
      "busy background"
    ],
    negativePrompt: [
      "busy background",
      "overly complex illustration",
      "pseudo letters",
      "generic clipart",
      "messy edges"
    ],
    scoring: {
      criteria: [
        { key: "silhouette", label: "Silhouette", weight: 25, description: "The mark is recognizable as a simple shape." },
        { key: "scalability", label: "Scalability", weight: 20, description: "It would still work at small sizes." },
        { key: "distinctiveness", label: "Distinctiveness", weight: 20, description: "The identity is memorable and not generic." },
        { key: "negative_space", label: "Negative space", weight: 15, description: "Spacing and shape relationships are clean." },
        { key: "edge_quality", label: "Edge quality", weight: 10, description: "Edges are crisp and controlled." },
        { key: "brand_fit", label: "Brand fit", weight: 10, description: "The mark fits the requested brand personality." }
      ],
      hardPenalties: [
        "Looks like a detailed illustration rather than a mark: subtract 25.",
        "Unreadable pseudo typography dominates: subtract 20.",
        "Generic clipart feel: subtract 20."
      ]
    }
  }
};

export function resolveDirectorProfile(prompt: string, requested: DirectorMode = "auto"): DirectorProfile {
  if (requested !== "auto") {
    return DIRECTOR_PROFILES[requested] ?? DIRECTOR_PROFILES.general;
  }

  for (const profile of Object.values(DIRECTOR_PROFILES)) {
    if (profile.mode !== "general" && profile.triggers.some((trigger) => trigger.test(prompt))) {
      return profile;
    }
  }

  return DIRECTOR_PROFILES.general;
}

export function listDirectorProfiles(): DirectorProfile[] {
  return Object.values(DIRECTOR_PROFILES);
}

export function compileDirectorGuidance(profile: DirectorProfile): string {
  return [
    `Director mode: ${profile.label}.`,
    `Hard constraints: ${profile.hardConstraints.join(" ")}`,
    `Quality targets: ${profile.qualityTargets.join(", ")}.`,
    `Common failure risks to avoid: ${profile.failureRisks.join(", ")}.`
  ].join(" ");
}

export function directorSummary(profile: DirectorProfile) {
  return {
    mode: profile.mode,
    label: profile.label,
    description: profile.description,
    scoringFocus: profile.scoring.criteria.map((criterion) => criterion.key),
    failureRisks: profile.failureRisks
  };
}
