import { createFallbackDecisionPlan } from "./fallback-plan.js";
import { createOpenAIDecisionPlan } from "./openai-client.js";
import { retrievePlaybooks } from "./retrieval.js";

export async function createDecisionPlan(input, config) {
  const playbooks = retrievePlaybooks(input);
  const shouldUseOpenAI = config.aiMode !== "mock" && Boolean(config.openaiApiKey);

  if (!shouldUseOpenAI) {
    return {
      source: "fallback",
      playbooks: playbooks.map(({ id, title, score }) => ({ id, title, score })),
      plan: createFallbackDecisionPlan(input, playbooks)
    };
  }

  try {
    return {
      source: "openai",
      playbooks: playbooks.map(({ id, title, score }) => ({ id, title, score })),
      plan: await createOpenAIDecisionPlan({ input, playbooks, config })
    };
  } catch (error) {
    if (config.aiMode === "strict") {
      throw error;
    }

    return {
      source: "fallback_after_openai_error",
      error: error.message,
      playbooks: playbooks.map(({ id, title, score }) => ({ id, title, score })),
      plan: createFallbackDecisionPlan(input, playbooks)
    };
  }
}
