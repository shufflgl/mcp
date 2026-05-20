import { mkdir } from "node:fs/promises";
import path from "node:path";
import type { GatewayConfig, OutputFormat } from "./types.js";

const DEFAULT_TIMEOUT_MS = 300_000;

export function env(name: string, fallback = ""): string {
  const value = process.env[name];
  return value == null || value.trim() === "" ? fallback : value.trim();
}

export function readGatewayConfig(overrides?: {
  apiKey?: string;
  baseUrl?: string;
  timeoutMs?: number;
}): GatewayConfig {
  const apiKey = overrides?.apiKey ?? env("OPENAI_API_KEY");
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY. Set it in the environment or pass api_key to the MCP tool.");
  }

  return {
    apiKey,
    baseUrl: normalizeBaseUrl(overrides?.baseUrl ?? env("OPENAI_BASE_URL")),
    organization: env("OPENAI_ORGANIZATION") || undefined,
    project: env("OPENAI_PROJECT") || undefined,
    timeoutMs: overrides?.timeoutMs ?? Number(env("OPENAI_TIMEOUT_MS", String(DEFAULT_TIMEOUT_MS)))
  };
}

export function normalizeBaseUrl(baseUrl: string): string {
  const trimmed = baseUrl.trim().replace(/\/+$/, "");
  if (!trimmed) {
    throw new Error("Missing OPENAI_BASE_URL. Set it in the environment or pass base_url to the MCP tool.");
  }
  return trimmed.endsWith("/v1") ? trimmed : `${trimmed}/v1`;
}

export function defaultImageModel(): string {
  return env("IMAGE_MODEL", "image-generation-model");
}

export function defaultTextModel(): string {
  return env("TEXT_MODEL", "text-generation-model");
}

export function defaultVisionModel(): string {
  return env("VISION_MODEL", defaultTextModel());
}

export function defaultQuality(): string {
  return env("IMAGE_QUALITY", "high");
}

export function defaultOutputFormat(): OutputFormat {
  const value = env("IMAGE_OUTPUT_FORMAT", "png").toLowerCase();
  if (value === "jpeg" || value === "webp" || value === "png") {
    return value;
  }
  return "png";
}

export function defaultOutputDir(): string {
  return env("IMAGE_OUTPUT_DIR", "outputs");
}

export async function ensureOutputDir(outputDir: string): Promise<string> {
  const resolved = path.resolve(outputDir);
  await mkdir(resolved, { recursive: true });
  return resolved;
}
