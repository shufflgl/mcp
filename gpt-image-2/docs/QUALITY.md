# Quality Workflow

This server cannot guarantee the exact same result as a closed first-party image product. It improves practical quality by adding a repeatable prompt, sampling, reranking, and reference-analysis pipeline around an OpenAI-compatible image API.

## Quality Modes

`quality_mode` controls pipeline behavior before individual override flags are applied.

| Mode | Behavior | Use case |
| --- | --- | --- |
| `fast` | One sample, no rerank, no refinement. | Drafts and cost-sensitive tests. |
| `standard` | Uses the caller's explicit sampling, rerank, and refinement settings. | Balanced day-to-day generation. |
| `official_like` | At least three requested samples, parallel requests, rerank enabled, refinement enabled when image budget remains. | Higher-quality attempts where latency and cost are acceptable. |

`max_images` caps the total number of generated images in one tool call, including refinement. The default is `3`. Raise it only when cost and latency are acceptable.

Recommended high-quality baseline:

```json
{
  "director_mode": "auto",
  "quality_mode": "official_like",
  "sample_count": 3,
  "max_images": 3,
  "request_mode": "parallel",
  "rerank": true,
  "refine": true
}
```

## Prompt Rewrite Strategy

Use `rewrite_mode` deliberately:

- `off`: best when the user prompt is already detailed and layout-sensitive.
- `template`: deterministic local enhancement with no model call.
- `llm`: strongest expansion for short or vague prompts.
- `auto`: uses LLM rewriting when a gateway key is available, otherwise falls back to templates.

For exact layout, typography, poster, infographic, or brand work, start with `rewrite_mode: "off"` if the prompt already contains all required structure.

## Director Modes

Director modes add scene-specific quality targets, failure risks, negative prompts, and rerank rubrics. Use `director_mode: "auto"` first. Override only when auto-routing picks the wrong scene.

Examples:

- `ip_character_poster`: named game/anime characters, collectible posters, silhouette narrative composites, and IP likeness preservation.
- `poster_editorial`: layout hierarchy, visual density, editorial composition, title-safe whitespace.
- `product_ad`: product silhouette, materials, reflections, background discipline.
- `portrait`: face structure, skin detail, expression, lens realism.
- `architecture_interior`: spatial coherence, material detail, furniture scale, light direction.
- `infographic`: readable hierarchy, semantic grouping, icon consistency.

## Reference-Guided Iteration

Use `analyze_image_gap` when you already have a strong target image from another system, a client reference, or a previous best candidate.

Workflow:

1. Generate several candidates with `generate_image`.
2. Pick the best candidate path from the response.
3. Compare it against the reference with `analyze_image_gap`.
4. Add `promptDeltas` and `negativePromptAdditions` to the next generation.
5. Repeat only when the gap analysis identifies concrete issues.

For a single-call loop, use `generate_image_with_reference`:

```json
{
  "prompt": "A premium product advertising image for a ceramic smart speaker, studio lighting, clean luxury composition",
  "reference_image_path": "/path/to/reference.png",
  "quality_mode": "official_like",
  "director_mode": "product_ad",
  "retry": true,
  "retry_min_gap": 25
}
```

## Cost and Latency

High-quality settings increase cost because they use more image calls and optional vision calls. Use this progression:

1. `rewrite_image_prompt` to inspect prompt quality.
2. `generate_image` with `quality_mode: "fast"` for quick direction checks.
3. `generate_image` with `quality_mode: "official_like"` for candidate selection.
4. `analyze_image_gap` or `generate_image_with_reference` only when a reference target exists.

## Practical Limits

- Reranking can choose the best candidate from the generated set, but it cannot recover details that no candidate contains.
- Reference gap analysis improves the next prompt, but it is not pixel-level image editing.
- Exact text rendering, strict poster typography, and dense infographic layouts may still need a separate layout or compositing stage.
