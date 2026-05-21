# Tool Reference

`gpt-img-gen` exposes six MCP tools.

## `generate_image`

Runs the full image generation pipeline.

Example:

```json
{
  "prompt": "A premium winter city travel poster for Beijing, isometric miniature city diorama, elegant editorial layout, snow-covered landmarks, warm lights, cinematic soft sunlight",
  "style": "luxury",
  "aspect_ratio": "9:16",
  "size": "1536x2688",
  "sample_count": 4,
  "max_images": 3,
  "quality": "high",
  "output_format": "png",
  "director_mode": "auto",
  "quality_mode": "official_like",
  "rewrite_mode": "off",
  "rerank": true,
  "refine": true,
  "save_images": true
}
```

Common fields:

| Field | Purpose |
| --- | --- |
| `prompt` | User image request. |
| `style` | Built-in style preset or custom style text. |
| `aspect_ratio` | `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`, or `auto`. |
| `size` | Gateway image size, if supported. |
| `sample_count` | Requested number of initial candidates before reranking. Default: `2`. |
| `max_images` | Total image-generation budget for the tool call, including refinement images. Default: `3`. |
| `quality_mode` | `fast`, `standard`, or `official_like`. |
| `director_mode` | `auto` or a specific scene director mode. |
| `rewrite_mode` | `auto`, `llm`, `template`, or `off`. |
| `return_image_data` | Return best image as MCP image content. Default: `false`. |

The response includes metadata for the best image, all candidates, scores, the expanded prompt, the final prompt, the prompt pipeline trace, and gateway metadata. Base64 image data is omitted from the text metadata by default.

## `rewrite_image_prompt`

Runs prompt analysis and rewriting without generating an image.

Example:

```json
{
  "prompt": "A luxury perfume bottle on black glass with champagne highlights",
  "style": "product",
  "director_mode": "auto",
  "rewrite_mode": "template"
}
```

Use this tool to inspect the final prompt before spending image generation calls.

## `list_image_styles`

Lists built-in style presets:

```json
{}
```

Current presets include `cinematic`, `anime`, `luxury`, `product`, `portrait`, `architecture`, `landscape`, `food`, `scifi`, and `realistic`. A request can also pass custom style text.

## `list_director_modes`

Lists director modes, quality targets, failure risks, and scoring criteria:

```json
{}
```

Current modes:

- `general`
- `ip_character_poster`
- `poster_editorial`
- `product_ad`
- `portrait`
- `character_design`
- `architecture_interior`
- `landscape_travel`
- `food_editorial`
- `infographic`
- `social_media_card`
- `logo_brand_mark`

Use `director_mode: "auto"` unless you need to force a specific mode.

## `analyze_image_gap`

Compares a reference image with a generated candidate and returns structured feedback for the next generation.

Example with local files:

```json
{
  "reference_image_path": "/path/to/reference.png",
  "candidate_image_path": "/path/to/candidate.png",
  "original_prompt": "A premium winter city travel poster for Beijing",
  "director_mode": "auto"
}
```

Example with URLs:

```json
{
  "reference_image_url": "https://example.com/reference.png",
  "candidate_image_url": "https://example.com/candidate.png",
  "director_mode": "poster_editorial"
}
```

The response includes:

- `referenceStrengths`
- `candidateStrengths`
- `candidateWeaknesses`
- `missingElements`
- `dimensionScores`
- `overallSimilarity`
- `overallGap`
- `promptDeltas`
- `negativePromptAdditions`
- `nextPrompt`
- `rerankRubricAdjustments`
- `rationale`

## `generate_image_with_reference`

Generates an image, compares the best candidate with a reference image, and optionally runs one repair retry.

Example:

```json
{
  "prompt": "A premium winter city travel poster for Beijing, elegant editorial layout, isometric miniature city diorama",
  "reference_image_path": "/path/to/reference.png",
  "director_mode": "poster_editorial",
  "quality_mode": "official_like",
  "rewrite_mode": "off",
  "retry": true,
  "retry_min_gap": 25,
  "save_images": true
}
```

The response includes:

- `first_result`
- `gap_analysis`
- `retry_result`
- `final_result`

`retry` is disabled by default. Enable it when you want the server to spend one additional generation call if the measured gap is high enough.
