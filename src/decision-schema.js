export const decisionPlanSchema = {
  type: "object",
  properties: {
    summary: { type: "string" },
    decisionMode: {
      type: "string",
      enum: ["job_search", "career_change", "money", "learning", "general"]
    },
    confidence: { type: "number" },
    profile: {
      type: "object",
      properties: {
        location: { type: "string" },
        budget: { type: "string" },
        constraints: { type: "array", items: { type: "string" } },
        assets: { type: "array", items: { type: "string" } },
        risks: { type: "array", items: { type: "string" } }
      },
      required: ["location", "budget", "constraints", "assets", "risks"],
      additionalProperties: false
    },
    skillGap: {
      type: "array",
      items: {
        type: "object",
        properties: {
          skill: { type: "string" },
          currentLevel: {
            type: "string",
            enum: ["unknown", "basic", "intermediate", "strong"]
          },
          targetLevel: {
            type: "string",
            enum: ["basic", "intermediate", "strong"]
          },
          reason: { type: "string" },
          firstPractice: { type: "string" }
        },
        required: ["skill", "currentLevel", "targetLevel", "reason", "firstPractice"],
        additionalProperties: false
      }
    },
    recommendedTargets: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          whyFit: { type: "string" },
          searchKeywords: { type: "array", items: { type: "string" } },
          priority: { type: "string", enum: ["high", "medium", "low"] },
          minRequirements: { type: "array", items: { type: "string" } }
        },
        required: ["title", "whyFit", "searchKeywords", "priority", "minRequirements"],
        additionalProperties: false
      }
    },
    sevenDayPlan: {
      type: "array",
      items: {
        type: "object",
        properties: {
          day: { type: "integer" },
          focus: { type: "string" },
          actions: { type: "array", items: { type: "string" } },
          output: { type: "string" }
        },
        required: ["day", "focus", "actions", "output"],
        additionalProperties: false
      }
    },
    applications: {
      type: "array",
      items: {
        type: "object",
        properties: {
          target: { type: "string" },
          whereToSearch: { type: "string" },
          messageAngle: { type: "string" },
          nextStep: { type: "string" }
        },
        required: ["target", "whereToSearch", "messageAngle", "nextStep"],
        additionalProperties: false
      }
    },
    scripts: {
      type: "object",
      properties: {
        cvHeadline: { type: "string" },
        coverLetterOpening: { type: "string" },
        outreachMessage: { type: "string" }
      },
      required: ["cvHeadline", "coverLetterOpening", "outreachMessage"],
      additionalProperties: false
    },
    learningPlan: {
      type: "array",
      items: {
        type: "object",
        properties: {
          skill: { type: "string" },
          resourceType: { type: "string" },
          dailyTime: { type: "string" },
          outcome: { type: "string" }
        },
        required: ["skill", "resourceType", "dailyTime", "outcome"],
        additionalProperties: false
      }
    },
    guardrails: { type: "array", items: { type: "string" } },
    nextCheckIn: {
      type: "object",
      properties: {
        when: { type: "string" },
        successCriteria: { type: "array", items: { type: "string" } }
      },
      required: ["when", "successCriteria"],
      additionalProperties: false
    }
  },
  required: [
    "summary",
    "decisionMode",
    "confidence",
    "profile",
    "skillGap",
    "recommendedTargets",
    "sevenDayPlan",
    "applications",
    "scripts",
    "learningPlan",
    "guardrails",
    "nextCheckIn"
  ],
  additionalProperties: false
};
