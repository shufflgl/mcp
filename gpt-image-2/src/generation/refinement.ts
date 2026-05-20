import type { OpenAICompatibleClient } from "../gateway/openaiCompatibleClient.js";
import type { ImagePipelineOptions, ImageScore, PromptPipelineResult } from "../types.js";
import { REFINEMENT_SYSTEM_PROMPT } from "../prompt/templates.js";

export async function buildRefinementPrompt(
  prompt: PromptPipelineResult,
  scores: ImageScore[],
  options: ImagePipelineOptions,
  client: OpenAICompatibleClient
): Promise<string> {
  const weakest = [...scores].sort((a, b) => a.finalScore - b.finalScore)[0];
  try {
    return await client.createChatCompletion({
      model: options.textModel,
      temperature: 0.3,
      messages: [
        { role: "system", content: REFINEMENT_SYSTEM_PROMPT },
        {
          role: "user",
          content: JSON.stringify({
            prompt: prompt.finalPrompt,
            weakestScore: weakest,
            allScores: scores
          })
        }
      ]
    });
  } catch {
    return fallbackRefinementPrompt(weakest);
  }
}

function fallbackRefinementPrompt(score: ImageScore): string {
  const weakAreas: string[] = [];
  if (score.anatomy < 80) weakAreas.push("improve anatomy and facial or hand structure");
  if (score.composition < 80) weakAreas.push("strengthen focal clarity and balanced framing");
  if (score.lighting < 80) weakAreas.push("make lighting more coherent and professional");
  if (score.coherence < 80) weakAreas.push("remove conflicting visual details");

  return weakAreas.length > 0
    ? `${weakAreas.join(", ")} while preserving the original subject, style, composition intent, and lighting direction`
    : "subtly improve visual polish, focal clarity, and material coherence while preserving the original image direction";
}
