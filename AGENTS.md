# Project Rules

These rules apply to the entire repository.

## Documentation

- Write repository documentation in English.
- Keep public examples generic. Use placeholders such as `<YOUR_API_KEY>`, `<OPENAI_COMPATIBLE_BASE_URL>`, `<IMAGE_MODEL_ID>`, `<TEXT_MODEL_ID>`, and `<VISION_MODEL_ID>`.
- Do not document private gateway URLs, private model names, private tokens, local-only absolute paths, or user-specific configuration values.
- Keep user-facing setup paths short: one-line local setup first, copyable MCP JSON second, details after that.

## MCP Compatibility

- Keep MCP servers generic. They should work with Codex, Claude Desktop, Claude Code, Cursor, Cline/Roo, Continue, and other clients that support stdio MCP.
- Do not add client-specific assumptions to server code. Client-specific setup belongs in documentation only.
- Preserve stdio as the default transport. If Streamable HTTP is added later, keep it additive and document the new transport separately.

## Security

- Never commit secrets or private infrastructure identifiers.
- Keep `.env`, `.env.local`, generated images, `outputs`, `dist`, and `node_modules` untracked.
- Before committing, scan staged changes for API keys, private gateway URLs, private model names, and local absolute paths.

## Verification

- For `gpt-image-2`, run `npm test` before committing behavior changes.
- For MCP tool registration changes, run a smoke test that lists tools from `dist/index.js`.
- Keep tests offline by default. Unit tests must not call a real OpenAI-compatible gateway.
