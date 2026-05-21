# Development Guide

This guide is for maintainers and contributors working on `gpt-img-gen`.

## Local Setup

```bash
npm ci
npm run build
npm test
```

Tests are offline and must not call a real OpenAI-compatible gateway.

## Run From Source

Build the server:

```bash
npm run build
```

Print a local MCP JSON config:

```bash
npm run --silent mcp:config
```

The generated config points to the local `dist/index.js`.

## Package Locally

Create a private npm tarball without publishing to npm:

```bash
npm run pack:local
```

This runs `prepack`, rebuilds `dist`, and creates:

```text
gpt-img-gen-0.1.1.tgz
```

The package is marked with `private: true`, so accidental `npm publish` is blocked. Use GitHub Releases for distribution unless a separate registry strategy is explicitly added.

## Package Contents

The package `files` list should include:

- `dist`
- `docs`
- `scripts`
- `README.md`
- `.env.example`

It must not include:

- `.env`
- `node_modules`
- `outputs`
- generated images
- local tarballs

## Smoke Test Installed Package

Install the tarball into a temporary prefix:

```bash
npm install -g --prefix /tmp/gpt-img-gen-install ./gpt-img-gen-0.1.1.tgz
```

Then list MCP tools through the installed binary:

```bash
node --input-type=module -e 'import { Client } from "@modelcontextprotocol/sdk/client/index.js"; import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js"; const transport = new StdioClientTransport({ command: "/tmp/gpt-img-gen-install/bin/gpt-img-gen", args: [], env: { ...process.env } }); const client = new Client({ name: "package-smoke-test", version: "0.0.0" }); await client.connect(transport); const tools = await client.listTools(); console.log(JSON.stringify(tools.tools.map((tool) => tool.name))); await client.close();'
```

Expected tools:

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

## Release Convention

This repository may contain multiple MCP packages. Use package-scoped release tags:

```text
<package-name>-v<version>
```

For this package:

```text
Tag:   gpt-img-gen-v0.1.1
Title: gpt-img-gen v0.1.1
Asset: gpt-img-gen-0.1.1.tgz
```

Do not use repository-wide tags such as `v0.1.0` for package releases.

## Verification Before Commit

Run:

```bash
npm test
git diff --check
```

For MCP registration changes, also run a tool-list smoke test from `dist/index.js`.

Before committing, scan staged changes for:

- API keys
- private gateway URLs
- private model IDs
- local absolute paths
- generated images
- tarballs

Public examples must use placeholders such as `<YOUR_API_KEY>`, `<OPENAI_COMPATIBLE_BASE_URL>`, `<IMAGE_MODEL_ID>`, `<TEXT_MODEL_ID>`, and `<VISION_MODEL_ID>`.
