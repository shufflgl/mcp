import { writeFile } from "node:fs/promises";
import path from "node:path";
import { ensureOutputDir } from "../config.js";
import type { GeneratedImage, OutputFormat } from "../types.js";

export async function saveGeneratedImages(
  images: GeneratedImage[],
  outputDir: string,
  format: OutputFormat
): Promise<GeneratedImage[]> {
  const resolvedOutputDir = await ensureOutputDir(outputDir);
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

  return Promise.all(images.map(async (image) => {
    if (!image.b64Json) {
      return image;
    }
    const fileName = `image-${timestamp}-${String(image.index + 1).padStart(2, "0")}.${format}`;
    const savedPath = path.join(resolvedOutputDir, fileName);
    await writeFile(savedPath, Buffer.from(image.b64Json, "base64"));
    return { ...image, savedPath };
  }));
}
