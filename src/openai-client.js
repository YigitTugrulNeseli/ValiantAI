import { decisionPlanSchema } from "./decision-schema.js";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";

export async function createOpenAIDecisionPlan({ input, playbooks, config }) {
  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.openaiApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: config.openaiModel,
      instructions: buildInstructions(),
      input: JSON.stringify({
        userInput: input,
        retrievedPlaybooks: playbooks
      }),
      text: {
        format: {
          type: "json_schema",
          name: "decision_plan",
          schema: decisionPlanSchema,
          strict: true
        }
      },
      max_output_tokens: 3500
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenAI request failed (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  const text = data.output_text || extractOutputText(data);

  if (!text) {
    throw new Error("OpenAI response did not include output_text.");
  }

  return JSON.parse(text);
}

function buildInstructions() {
  return [
    "You are Valiant AI, an action-first decision engine.",
    "Your job is not to chat. Your job is to convert messy user context into a concrete plan.",
    "Return practical, specific, low-friction actions. Avoid vague motivation.",
    "If the user is in a job-search scenario, prioritize employability, CV positioning, skill gaps, target jobs, and a seven-day action plan.",
    "Be honest about uncertainty. Do not invent facts about laws, visas, salaries, or benefits.",
    "If the request touches legal, medical, tax, immigration, or financial risk, include a guardrail telling the user to verify with a qualified local source.",
    "Use the same language as the user's question unless the user asks otherwise.",
    "Return only JSON matching the schema."
  ].join("\n");
}

function extractOutputText(data) {
  return data.output
    ?.flatMap((item) => item.content || [])
    .find((content) => content.type === "output_text" || content.type === "text")
    ?.text;
}
