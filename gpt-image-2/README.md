# gpt-img-gen

`gpt-img-gen` is a generic stdio MCP server for high-quality image generation through OpenAI-compatible API gateways. It adds a production-oriented quality pipeline around `/v1/images/generations` and optional `/v1/chat/completions` calls.

The server is not tied to one MCP client. It can be used from Codex, Claude Desktop, Claude Code, Cursor, Cline/Roo, Continue, or any client that can launch a stdio MCP server.

## What It Does

- Expands or preserves user prompts with a configurable prompt pipeline.
- Routes requests through scene-specific image director modes.
- Injects aesthetic priors, composition rules, and negative prompts.
- Generates one or more candidates through an OpenAI-compatible image API.
- Optionally reranks candidates with a vision model.
- Optionally refines the prompt and regenerates.
- Saves generated images locally when requested.
- Compares generated candidates against reference images for iterative quality repair.

## One-Line Setup

```bash
git clone https://github.com/shufflgl/mcp.git && cd mcp/gpt-image-2 && npm ci && npm run build && npm run --silent mcp:config
```

`npm run --silent mcp:config` prints a ready-to-paste MCP JSON block with the correct absolute path to `dist/index.js`.

## MCP JSON

After building the package, add a block like this to your MCP client configuration:

```json
{
  "mcpServers": {
    "gpt-img-gen": {
      "command": "node",
      "args": ["/absolute/path/to/mcp/gpt-image-2/dist/index.js"],
      "env": {
        "OPENAI_API_KEY": "<YOUR_API_KEY>",
        "OPENAI_BASE_URL": "<OPENAI_COMPATIBLE_BASE_URL>",
        "IMAGE_MODEL": "<IMAGE_MODEL_ID>",
        "TEXT_MODEL": "<TEXT_MODEL_ID>",
        "VISION_MODEL": "<VISION_MODEL_ID>",
        "IMAGE_QUALITY": "high",
        "IMAGE_OUTPUT_FORMAT": "png",
        "OPENAI_TIMEOUT_MS": "300000"
      }
    }
  }
}
```

## Local npm Package

You can create a local npm tarball without publishing to the public npm registry:

```bash
npm run pack:local
```

This creates a file such as `gpt-img-gen-0.1.0.tgz`. Install it globally on any machine with:

```bash
npm install -g ./gpt-img-gen-0.1.0.tgz
```

Then configure MCP clients with:

```json
{
  "mcpServers": {
    "gpt-img-gen": {
      "command": "gpt-img-gen",
      "env": {
        "OPENAI_API_KEY": "<YOUR_API_KEY>",
        "OPENAI_BASE_URL": "<OPENAI_COMPATIBLE_BASE_URL>",
        "IMAGE_MODEL": "<IMAGE_MODEL_ID>",
        "TEXT_MODEL": "<TEXT_MODEL_ID>",
        "VISION_MODEL": "<VISION_MODEL_ID>"
      }
    }
  }
}
```

The package is marked with `private: true`, so `npm publish` is blocked by npm. Use `npm pack` or `npm run pack:local` for private distribution.

The gateway must support:

- `POST /v1/images/generations`
- `POST /v1/chat/completions` for prompt rewriting, vision reranking, and reference gap analysis

## Tools

| Tool | Purpose |
| --- | --- |
| `generate_image` | Runs the full image generation pipeline. |
| `rewrite_image_prompt` | Runs prompt analysis and rewriting without generating an image. |
| `list_image_styles` | Lists built-in style presets. |
| `list_director_modes` | Lists scene-specific director modes and scoring criteria. |
| `analyze_image_gap` | Compares a reference image with a candidate image and returns actionable gaps. |
| `generate_image_with_reference` | Generates an image, compares it with a reference, and can run one repair retry. |

See [`docs/TOOLS.md`](docs/TOOLS.md) for schemas and examples.

## Recommended Quality Settings

For fast drafts:

```json
{
  "quality_mode": "fast",
  "sample_count": 1,
  "rerank": false,
  "refine": false
}
```

For official-like quality attempts:

```json
{
  "director_mode": "auto",
  "quality_mode": "official_like",
  "sample_count": 4,
  "request_mode": "parallel",
  "rerank": true,
  "refine": true
}
```

If your prompt is already carefully written, set `rewrite_mode` to `off` to avoid unwanted layout drift. If the prompt is short, use `rewrite_mode: "auto"` or `rewrite_mode: "llm"`.

See [`docs/QUALITY.md`](docs/QUALITY.md) for quality workflow guidance.

## Local Development

```bash
npm ci
npm run build
npm test
```

Tests are offline and do not call a real gateway.

## Documentation

- [`docs/INSTALL.md`](docs/INSTALL.md): installation and MCP client configuration
- [`docs/TOOLS.md`](docs/TOOLS.md): tool reference and examples
- [`docs/QUALITY.md`](docs/QUALITY.md): quality modes and reference-guided workflows

## Security Notes

Do not commit API keys, private gateway URLs, private model IDs, `.env` files, generated images, `dist`, `node_modules`, or local output directories. Keep all public examples generic.
