# Installation

This guide installs `gpt-img-gen` as a local stdio MCP server.

## Requirements

- Node.js 20 or newer
- An OpenAI-compatible API gateway
- A gateway API key
- Image, text, and vision model IDs supported by your gateway

## One-Line Local Setup

```bash
git clone https://github.com/shufflgl/mcp.git && cd mcp/gpt-image-2 && npm ci && npm run build && npm run --silent mcp:config
```

The last command prints an MCP JSON block with the absolute path to this server. Paste that JSON into your MCP client configuration and replace the placeholder environment values.

## Existing Checkout Setup

If you already cloned the repository:

```bash
cd /path/to/mcp/gpt-image-2 && npm ci && npm run build && npm run --silent mcp:config
```

## Generated MCP JSON

`npm run --silent mcp:config` prints JSON in this shape:

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

Use the same JSON shape for Codex, Claude Desktop, Claude Code, Cursor, Cline/Roo, Continue, or any other stdio MCP client. The exact config file location depends on the client.

## Environment Variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `OPENAI_API_KEY` | Yes | API key for your OpenAI-compatible gateway. |
| `OPENAI_BASE_URL` | Yes | Base URL for the gateway, usually ending in `/v1`. |
| `IMAGE_MODEL` | Yes | Image generation model ID. |
| `TEXT_MODEL` | Recommended | Text model used for prompt rewriting. |
| `VISION_MODEL` | Recommended | Vision model used for reranking and gap analysis. |
| `IMAGE_QUALITY` | No | Gateway quality value. Default: `high`. |
| `IMAGE_OUTPUT_FORMAT` | No | `png`, `jpeg`, or `webp`. Default: `png`. |
| `IMAGE_OUTPUT_DIR` | No | Local output directory. Default: `outputs`. |
| `OPENAI_TIMEOUT_MS` | No | Request timeout. Default: `300000`. |
| `OPENAI_ORGANIZATION` | No | Optional OpenAI organization header. |
| `OPENAI_PROJECT` | No | Optional OpenAI project header. |

## Manual Setup

```bash
npm ci
npm run build
```

Then configure your MCP client with:

```json
{
  "mcpServers": {
    "gpt-img-gen": {
      "command": "node",
      "args": ["/absolute/path/to/dist/index.js"],
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

## Verify Locally

Run the offline test suite:

```bash
npm test
```

After configuring your MCP client, list available tools. You should see:

```json
[
  "generate_image",
  "rewrite_image_prompt",
  "list_image_styles",
  "list_director_modes",
  "analyze_image_gap",
  "generate_image_with_reference"
]
```

## Troubleshooting

- If the client cannot start the MCP server, confirm that `npm run build` created `dist/index.js`.
- If generation fails with authentication errors, check `OPENAI_API_KEY` and `OPENAI_BASE_URL`.
- If prompt rewrite, rerank, or reference analysis fails, confirm that the gateway supports `/v1/chat/completions` with image inputs for the selected vision model.
- If output paths are hard to find, set `IMAGE_OUTPUT_DIR` to an absolute directory in the MCP JSON.
