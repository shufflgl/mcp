# gpt-img-gen

`gpt-img-gen` is a stdio MCP server for high-quality image generation through OpenAI-compatible API gateways.

It works with Codex, Claude Desktop, Claude Code, Cursor, Cline/Roo, Continue, and other clients that can run stdio MCP servers.

## Install

Install the release tarball:

```bash
curl -L -o gpt-img-gen-0.1.1.tgz https://github.com/shufflgl/mcp/releases/download/gpt-img-gen-v0.1.1/gpt-img-gen-0.1.1.tgz
npm install -g ./gpt-img-gen-0.1.1.tgz
```

Then add this MCP config to your client:

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

See [`docs/INSTALL.md`](docs/INSTALL.md) for source-based installation and troubleshooting.

## Features

- Prompt expansion or prompt preservation through `rewrite_mode`.
- Conservative image budgeting through `max_images` so high-quality runs do not unexpectedly create many candidates.
- Scene-specific director modes for posters, products, portraits, architecture, food, infographics, social cards, and logos.
- IP character poster mode for named game/anime characters where likeness and canonical identity anchors matter.
- Multi-sample generation with optional vision reranking.
- Optional refinement pass for higher-quality attempts.
- Reference-image gap analysis for comparing generated candidates against a target image.
- Local output saving and optional MCP image content return.

## Tools

| Tool | Purpose |
| --- | --- |
| `generate_image` | Generate images with the full quality pipeline. |
| `rewrite_image_prompt` | Preview the prompt pipeline without generating an image. |
| `list_image_styles` | List built-in style presets. |
| `list_director_modes` | List director modes and scoring rubrics. |
| `analyze_image_gap` | Compare a reference image and generated candidate. |
| `generate_image_with_reference` | Generate, compare with a reference, and optionally retry once. |

## Documentation

- [`docs/INSTALL.md`](docs/INSTALL.md): user installation guide
- [`docs/TOOLS.md`](docs/TOOLS.md): tool reference and request examples
- [`docs/QUALITY.md`](docs/QUALITY.md): quality modes and reference-guided workflow
- [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md): developer setup, packaging, release, and verification
