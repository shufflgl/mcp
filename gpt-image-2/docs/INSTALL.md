# Installation

This guide is for users who want to install and run `gpt-img-gen`.

## Requirements

- Node.js 20 or newer
- An OpenAI-compatible gateway that supports `/v1/images/generations`
- A gateway API key
- Image, text, and vision model IDs supported by your gateway

`/v1/chat/completions` is required for prompt rewriting, vision reranking, and reference-image gap analysis.

## Recommended: Install From GitHub Release

Download the release tarball:

```bash
curl -L -o gpt-img-gen-0.1.1.tgz https://github.com/shufflgl/mcp/releases/download/gpt-img-gen-v0.1.1/gpt-img-gen-0.1.1.tgz
```

Optional checksum verification:

```bash
shasum -a 256 gpt-img-gen-0.1.1.tgz
```

Compare the result with the SHA-256 digest shown on the GitHub Release asset.


Install globally:

```bash
npm install -g ./gpt-img-gen-0.1.1.tgz
```

Verify the command is available:

```bash
which gpt-img-gen
```

## MCP Configuration

Add this server to your MCP client:

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
        "VISION_MODEL": "<VISION_MODEL_ID>",
        "IMAGE_QUALITY": "high",
        "IMAGE_OUTPUT_FORMAT": "png",
        "OPENAI_TIMEOUT_MS": "300000"
      }
    }
  }
}
```

Replace every placeholder with values from your gateway.

## Source Checkout Alternative

If you prefer to run from source instead of installing the release package:

```bash
git clone https://github.com/shufflgl/mcp.git
cd mcp/gpt-image-2
npm ci
npm run build
npm run --silent mcp:config
```

Paste the printed JSON into your MCP client and replace the placeholder environment values.

## Environment Variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `OPENAI_API_KEY` | Yes | API key for your OpenAI-compatible gateway. |
| `OPENAI_BASE_URL` | Yes | Gateway base URL, usually ending in `/v1`. |
| `IMAGE_MODEL` | Yes | Image generation model ID. |
| `TEXT_MODEL` | Recommended | Text model for prompt rewriting. |
| `VISION_MODEL` | Recommended | Vision model for reranking and gap analysis. |
| `IMAGE_QUALITY` | No | Gateway quality value. Default: `high`. |
| `IMAGE_OUTPUT_FORMAT` | No | `png`, `jpeg`, or `webp`. Default: `png`. |
| `IMAGE_OUTPUT_DIR` | No | Local output directory. Default: `outputs`. |
| `OPENAI_TIMEOUT_MS` | No | Request timeout. Default: `300000`. |

## First Test Prompt

After your MCP client loads the server, ask it to use `gpt-img-gen` with:

```json
{
  "prompt": "A cinematic image of a small robot reading a map in a rainy neon alley",
  "quality_mode": "fast",
  "sample_count": 1,
  "rerank": false,
  "refine": false,
  "save_images": true
}
```

## Troubleshooting

- If the MCP client cannot start the server, run `which gpt-img-gen` and confirm the binary is on your shell path.
- If authentication fails, check `OPENAI_API_KEY` and `OPENAI_BASE_URL`.
- If prompt rewriting, reranking, or reference analysis fails, confirm that your gateway supports `/v1/chat/completions` with image inputs for the selected vision model.
- If output paths are hard to find, set `IMAGE_OUTPUT_DIR` to an absolute directory.
