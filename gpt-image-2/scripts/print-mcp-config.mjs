#!/usr/bin/env node

import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, "..");
const serverPath = path.join(projectRoot, "dist", "index.js");
const serverName = process.env.MCP_SERVER_NAME || "gpt-img-gen";

const config = {
  mcpServers: {
    [serverName]: {
      command: "node",
      args: [serverPath],
      env: {
        OPENAI_API_KEY: "<YOUR_API_KEY>",
        OPENAI_BASE_URL: "<OPENAI_COMPATIBLE_BASE_URL>",
        IMAGE_MODEL: "<IMAGE_MODEL_ID>",
        TEXT_MODEL: "<TEXT_MODEL_ID>",
        VISION_MODEL: "<VISION_MODEL_ID>",
        IMAGE_QUALITY: "high",
        IMAGE_OUTPUT_FORMAT: "png",
        OPENAI_TIMEOUT_MS: "300000"
      }
    }
  }
};

console.log(JSON.stringify(config, null, 2));
