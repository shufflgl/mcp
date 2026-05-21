import assert from "node:assert/strict";
import test from "node:test";
import { analyzeImageGap } from "../dist/vision/gapAnalyzer.js";

test("image gap analyzer compares reference and candidate images", async () => {
  const calls = [];
  const client = {
    async createChatCompletion(request) {
      calls.push(request);
      return JSON.stringify({
        referenceStrengths: ["strong poster typography"],
        candidateStrengths: ["good winter lighting"],
        candidateWeaknesses: ["left panel hierarchy is weaker"],
        missingElements: ["postal stamp detail"],
        dimensionScores: {
          poster_layout: 82,
          typography_quality: 74
        },
        overallSimilarity: 76,
        overallGap: 24,
        promptDeltas: ["increase left-side title hierarchy"],
        negativePromptAdditions: ["blank left panel"],
        nextPrompt: "Strengthen the editorial poster information column.",
        rerankRubricAdjustments: ["weight typography_quality higher"],
        rationale: "The candidate has good lighting but lacks the reference's print-design hierarchy."
      });
    }
  };

  const result = await analyzeImageGap({
    referenceImageUrl: "data:image/png;base64,cmVm",
    candidateImageUrl: "data:image/png;base64,Y2FuZGlkYXRl",
    originalPrompt: "北京冬季城市图鉴海报",
    directorMode: "auto",
    visionModel: "test-vision-model"
  }, client);

  assert.equal(result.directorMode, "poster_editorial");
  assert.equal(result.dimensionScores.poster_layout, 82);
  assert.equal(result.overallGap, 24);
  assert.deepEqual(result.promptDeltas, ["increase left-side title hierarchy"]);

  const imageParts = calls[0].messages[1].content.filter((part) => part.type === "image_url");
  assert.equal(imageParts.length, 2);
});

test("image gap analyzer requires both images", async () => {
  await assert.rejects(
    () => analyzeImageGap({
      referenceImageUrl: "data:image/png;base64,cmVm",
      originalPrompt: "poster",
      directorMode: "poster_editorial",
      visionModel: "test-vision-model"
    }, { createChatCompletion: async () => "{}" }),
    /Missing candidate image/
  );
});
