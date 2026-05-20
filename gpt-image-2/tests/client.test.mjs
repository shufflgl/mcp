import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { createServer } from "node:http";
import test from "node:test";
import { OpenAICompatibleClient } from "../dist/gateway/openaiCompatibleClient.js";

test("OpenAI-compatible client reads image b64_json responses", async () => {
  const server = createServer((request, response) => {
    let body = "";
    request.on("data", (chunk) => { body += chunk; });
    request.on("end", () => {
      assert.equal(request.url, "/v1/images/generations");
      const parsed = JSON.parse(body);
      assert.equal(parsed.model, "test-image-model");
      assert.equal(parsed.output_format, "png");
      response.setHeader("Content-Type", "application/json");
      response.end(JSON.stringify({
        data: [
          {
            b64_json: Buffer.from("fake-image").toString("base64"),
            revised_prompt: "revised"
          }
        ]
      }));
    });
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const client = new OpenAICompatibleClient({
    apiKey: "test",
    baseUrl: `http://127.0.0.1:${address.port}/v1`,
    timeoutMs: 10_000
  });

  const images = await client.createImages({
    model: "test-image-model",
    prompt: "test",
    n: 1,
    outputFormat: "png",
    quality: "high"
  });

  assert.equal(images.length, 1);
  assert.equal(images[0].b64Json, Buffer.from("fake-image").toString("base64"));
  assert.equal(images[0].revisedPrompt, "revised");

  await new Promise((resolve) => server.close(resolve));
});
