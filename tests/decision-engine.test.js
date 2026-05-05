import assert from "node:assert/strict";
import test from "node:test";

import { createDecisionPlan } from "../src/decision-engine.js";
import { retrievePlaybooks } from "../src/retrieval.js";

const sampleInput = {
  question: "Param az, Almanya'dayim, nasil is bulurum?",
  profile: {
    location: "Germany",
    budget: "limited",
    languages: "Turkish, English, basic German",
    status: "available quickly"
  },
  constraints: "low budget, needs income quickly",
  cvText: "Node.js backend basics, customer support, English and Turkish"
};

test("retrieves relevant playbooks", () => {
  const playbooks = retrievePlaybooks(sampleInput);

  assert.ok(playbooks.length >= 1);
  assert.equal(playbooks[0].id, "germany-entry-job-search");
});

test("creates a fallback decision plan without an API key", async () => {
  const result = await createDecisionPlan(sampleInput, {
    aiMode: "mock",
    openaiApiKey: "",
    openaiModel: "gpt-5.4-mini"
  });

  assert.equal(result.source, "fallback");
  assert.equal(result.plan.decisionMode, "job_search");
  assert.equal(result.plan.sevenDayPlan.length, 7);
  assert.ok(result.plan.recommendedTargets.length >= 3);
  assert.ok(result.plan.scripts.cvHeadline.length > 10);
});
