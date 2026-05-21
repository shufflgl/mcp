# MCP Workspace

This repository contains Model Context Protocol servers, client configuration examples, and related local tooling.

## Projects

| Path | MCP server | Status | Purpose |
| --- | --- | --- | --- |
| [`gpt-image-2`](gpt-image-2/) | `gpt-img-gen` | Active | High-quality image generation through OpenAI-compatible API gateways. |
| [`_claude`](./_claude/) | Extension assets | Archived/local | Claude-related extension artifacts kept outside the active server package. |

## Quick Install: `gpt-img-gen`

Use this one-line setup when installing from GitHub:

```bash
git clone https://github.com/shufflgl/mcp.git && cd mcp/gpt-image-2 && npm ci && npm run build && npm run --silent mcp:config
```

The final command prints a ready-to-paste MCP JSON block. Add that block to any stdio-capable MCP client, then replace the placeholder environment values with your own gateway URL, API key, and model IDs.

For detailed setup, tool usage, and quality recommendations, start here:

- [`gpt-image-2/README.md`](gpt-image-2/README.md)
- [`gpt-image-2/docs/INSTALL.md`](gpt-image-2/docs/INSTALL.md)
- [`gpt-image-2/docs/TOOLS.md`](gpt-image-2/docs/TOOLS.md)
- [`gpt-image-2/docs/QUALITY.md`](gpt-image-2/docs/QUALITY.md)

## Repository Rules

Project rules for future agents and maintainers are in [`AGENTS.md`](AGENTS.md). The key constraints are:

- Repository documentation must be written in English.
- Never commit API keys, private gateway URLs, private model IDs, generated images, `dist`, `node_modules`, or local `.env` files.
- Keep MCP servers generic and stdio-compatible unless a separate transport is explicitly added.
