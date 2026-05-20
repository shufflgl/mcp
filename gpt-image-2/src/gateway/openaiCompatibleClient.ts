import type { GatewayConfig, GeneratedImage, OutputFormat } from "../types.js";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string | Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }>;
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  json?: boolean;
}

export interface ImageGenerationRequest {
  model: string;
  prompt: string;
  n: number;
  size?: string;
  quality?: string;
  outputFormat: OutputFormat;
  seed?: number;
}

export class OpenAICompatibleClient {
  constructor(private readonly config: GatewayConfig) {}

  get baseUrl(): string {
    return this.config.baseUrl;
  }

  async createChatCompletion(request: ChatCompletionRequest): Promise<string> {
    const body: Record<string, unknown> = {
      model: request.model,
      messages: request.messages
    };

    if (request.temperature !== undefined && !usesFixedTemperature(request.model)) {
      body.temperature = request.temperature;
    }

    if (request.json) {
      body.response_format = { type: "json_object" };
    }

    const response = await this.postJson("/chat/completions", body);
    const content = response?.choices?.[0]?.message?.content;
    if (typeof content === "string") {
      return content.trim();
    }
    if (Array.isArray(content)) {
      return content
        .map((part: unknown) => {
          if (typeof part === "object" && part && "text" in part) {
            return String((part as { text: unknown }).text);
          }
          return "";
        })
        .join("")
        .trim();
    }
    throw new Error("Chat completion response did not include choices[0].message.content");
  }

  async createImages(request: ImageGenerationRequest): Promise<GeneratedImage[]> {
    const body: Record<string, unknown> = {
      model: request.model,
      prompt: request.prompt,
      n: request.n,
      output_format: request.outputFormat
    };

    if (request.size) body.size = request.size;
    if (request.quality) body.quality = request.quality;
    if (request.seed !== undefined) body.seed = request.seed;

    let response: any;
    try {
      response = await this.postJson("/images/generations", body);
    } catch (error) {
      if (!hasOptionalImageParams(body)) {
        throw error;
      }
      response = await this.postJson("/images/generations", {
        model: request.model,
        prompt: request.prompt,
        n: request.n
      });
    }
    const data = response?.data;
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error("Image response did not include a non-empty data array");
    }

    return data.map((item: unknown, index: number) => {
      const record = item && typeof item === "object" ? item as Record<string, unknown> : {};
      const urlField = stringField(record, "url");
      const b64Json = stringField(record, "b64_json") ?? stringField(record, "base64") ?? parseDataUrl(urlField);
      const url = parseDataUrl(urlField) ? undefined : urlField;
      return {
        index,
        b64Json,
        url,
        mimeType: mimeTypeForFormat(request.outputFormat),
        revisedPrompt: stringField(record, "revised_prompt")
      };
    });
  }

  private async postJson(path: string, body: Record<string, unknown>): Promise<any> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);
    const headers: Record<string, string> = {
      "Authorization": `Bearer ${this.config.apiKey}`,
      "Content-Type": "application/json"
    };
    if (this.config.organization) headers["OpenAI-Organization"] = this.config.organization;
    if (this.config.project) headers["OpenAI-Project"] = this.config.project;

    try {
      const response = await fetch(`${this.config.baseUrl}${path}`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        signal: controller.signal
      });

      const text = await response.text();
      const parsed = parseJson(text);
      if (!response.ok) {
        const message = extractErrorMessage(parsed) ?? text.slice(0, 500) ?? response.statusText;
        throw new Error(`Gateway ${response.status} ${response.statusText}: ${message}`);
      }
      return parsed;
    } finally {
      clearTimeout(timeout);
    }
  }
}

export function mimeTypeForFormat(format: OutputFormat): string {
  return format === "jpeg" ? "image/jpeg" : `image/${format}`;
}

function stringField(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function parseDataUrl(url?: string): string | undefined {
  if (!url?.startsWith("data:image/")) {
    return undefined;
  }
  const comma = url.indexOf(",");
  return comma === -1 ? undefined : url.slice(comma + 1);
}

function parseJson(text: string): any {
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

function extractErrorMessage(parsed: unknown): string | undefined {
  if (!parsed || typeof parsed !== "object") return undefined;
  const record = parsed as Record<string, unknown>;
  const error = record.error;
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return undefined;
}

function usesFixedTemperature(model: string): boolean {
  return /(^|\/)gpt-5(\.|-|$)/i.test(model);
}

function hasOptionalImageParams(body: Record<string, unknown>): boolean {
  return "size" in body || "quality" in body || "output_format" in body || "seed" in body;
}
