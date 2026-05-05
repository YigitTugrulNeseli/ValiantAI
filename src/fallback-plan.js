const DEFAULT_QUESTION = "What should I do next?";

export function createFallbackDecisionPlan(input, playbooks = []) {
  const question = input.question || DEFAULT_QUESTION;
  const location = input.profile?.location || inferLocation(question) || "unknown";
  const budget = input.profile?.budget || inferBudget(question) || "limited";
  const cvSignals = extractCvSignals(input.cvText || "");
  const isGermany = /germany|almanya|deutschland|berlin|hamburg|munich/i.test(`${question} ${location}`);
  const searchBoards = isGermany
    ? ["Indeed", "StepStone", "LinkedIn", "Kleinanzeigen Jobs", "Bundesagentur fuer Arbeit"]
    : ["LinkedIn", "Indeed", "local job boards", "company career pages"];

  const targets = buildTargets(isGermany, cvSignals);
  const skills = buildSkillGap(cvSignals, isGermany);

  return {
    summary: `Start with fast income targets, tighten the CV around availability and proof, then run a seven-day application sprint for: ${question}`,
    decisionMode: "job_search",
    confidence: playbooks.length ? 0.72 : 0.61,
    profile: {
      location,
      budget,
      constraints: normalizeList(input.constraints, ["limited budget", "needs short feedback loop"]),
      assets: cvSignals.assets,
      risks: ["too broad job target", "generic CV", "low application volume"]
    },
    skillGap: skills,
    recommendedTargets: targets,
    sevenDayPlan: buildSevenDayPlan(searchBoards, targets, skills),
    applications: targets.map((target, index) => ({
      target: target.title,
      whereToSearch: searchBoards[index % searchBoards.length],
      messageAngle: `Lead with availability, location, and the strongest proof for ${target.title.toLowerCase()}.`,
      nextStep: `Find 10 listings using: ${target.searchKeywords.slice(0, 3).join(", ")}`
    })),
    scripts: {
      cvHeadline: buildCvHeadline(cvSignals, isGermany),
      coverLetterOpening: "I am available for a fast start and I am looking for a role where reliability, learning speed, and clear communication matter.",
      outreachMessage: "Hi, I saw your open role and I can start quickly. I am reliable, available in the area, and happy to share my CV today. Is the position still open?"
    },
    learningPlan: skills.slice(0, 3).map((skill) => ({
      skill: skill.skill,
      resourceType: "free practice plus job-listing examples",
      dailyTime: "45 minutes",
      outcome: skill.firstPractice
    })),
    guardrails: [
      "Verify work authorization, contract terms, and tax obligations with official local sources.",
      "Do not pay recruiters or agencies upfront.",
      "Track every application so the next decision is based on reply rate, not mood."
    ],
    nextCheckIn: {
      when: "after 7 days or 30 applications, whichever comes first",
      successCriteria: ["30 targeted applications sent", "5 follow-ups completed", "at least 2 interviews or callbacks"]
    }
  };
}

function inferLocation(text) {
  if (/almanya|germany|deutschland/i.test(text)) {
    return "Germany";
  }

  return "";
}

function inferBudget(text) {
  if (/param az|az para|low budget|no money|broke/i.test(text)) {
    return "limited";
  }

  return "";
}

function extractCvSignals(cvText) {
  const text = cvText.toLowerCase();
  const assets = [];

  if (/node|javascript|backend|api/.test(text)) {
    assets.push("Node.js or API experience");
  }

  if (/sales|customer|support|service/.test(text)) {
    assets.push("customer-facing experience");
  }

  if (/warehouse|logistics|delivery|lager/.test(text)) {
    assets.push("operations or logistics experience");
  }

  if (/english|ingilizce|german|deutsch|turkish|turkce/.test(text)) {
    assets.push("multilingual communication");
  }

  if (!assets.length) {
    assets.push("adaptability", "availability", "willingness to learn");
  }

  return { assets };
}

function buildTargets(isGermany, cvSignals) {
  const base = [
    {
      title: isGermany ? "Logistics or warehouse associate" : "Operations associate",
      whyFit: "Fast hiring cycles and clear entry requirements make this suitable when cash pressure is high.",
      searchKeywords: isGermany
        ? ["lagerhelfer", "logistik mitarbeiter", "warehouse assistant", "kommissionierer"]
        : ["warehouse assistant", "operations associate", "logistics assistant"],
      priority: "high",
      minRequirements: ["reliability", "physical readiness", "basic communication"]
    },
    {
      title: "Customer support or service role",
      whyFit: "Language ability and reliability can matter more than formal credentials.",
      searchKeywords: isGermany
        ? ["customer support english german", "kundenservice englisch", "service mitarbeiter"]
        : ["customer support", "service representative", "support agent"],
      priority: "high",
      minRequirements: ["clear communication", "basic computer use", "shift availability"]
    },
    {
      title: "Junior admin or data assistant",
      whyFit: "Good bridge role if the CV has computer skills or backend/API interest.",
      searchKeywords: isGermany
        ? ["junior admin assistant", "data entry deutsch englisch", "office assistant"]
        : ["junior admin assistant", "data entry", "office assistant"],
      priority: cvSignals.assets.some((asset) => /node|api|computer/i.test(asset)) ? "high" : "medium",
      minRequirements: ["spreadsheet basics", "email writing", "attention to detail"]
    }
  ];

  return base;
}

function buildSkillGap(cvSignals, isGermany) {
  return [
    {
      skill: isGermany ? "German job-search phrases" : "local job-search keywords",
      currentLevel: "unknown",
      targetLevel: "basic",
      reason: "Search results and recruiter replies improve when the CV and search terms match local language.",
      firstPractice: "Write 10 role keywords and 5 short application sentences."
    },
    {
      skill: "Targeted CV positioning",
      currentLevel: cvSignals.assets.length > 2 ? "basic" : "unknown",
      targetLevel: "intermediate",
      reason: "A generic CV makes low-friction jobs harder to win.",
      firstPractice: "Create one CV headline and three bullet points for the first target role."
    },
    {
      skill: "Application pipeline tracking",
      currentLevel: "unknown",
      targetLevel: "basic",
      reason: "The first week needs measurable volume and fast follow-up.",
      firstPractice: "Make a tracker with company, role, link, date, status, and follow-up date."
    }
  ];
}

function buildSevenDayPlan(searchBoards, targets, skills) {
  return [
    {
      day: 1,
      focus: "Pick targets and rewrite the top of the CV",
      actions: [
        `Choose the top 2 targets: ${targets.slice(0, 2).map((target) => target.title).join(" and ")}`,
        "Write a one-line CV headline for each target",
        "Create a simple application tracker"
      ],
      output: "Two target-specific CV versions and a tracker"
    },
    {
      day: 2,
      focus: "Build the first application list",
      actions: [
        `Search ${searchBoards.slice(0, 3).join(", ")}`,
        "Save 25 relevant listings",
        "Remove roles that require credentials you do not have"
      ],
      output: "25 filtered job leads"
    },
    {
      day: 3,
      focus: "Send the first batch",
      actions: [
        "Apply to 10 roles with the matching CV version",
        "Customize the first two lines only",
        "Record every application in the tracker"
      ],
      output: "10 applications sent"
    },
    {
      day: 4,
      focus: "Practice the highest gap skill",
      actions: [
        `Practice: ${skills[0]?.firstPractice || "role-specific interview answers"}`,
        "Prepare answers for availability, experience, and salary expectation",
        "Send 5 more applications"
      ],
      output: "Interview script plus 5 more applications"
    },
    {
      day: 5,
      focus: "Follow up and widen the channel",
      actions: [
        "Follow up on day-3 applications",
        "Call or email 5 employers directly",
        "Post a short availability message in one local job group"
      ],
      output: "10 follow-up touches"
    },
    {
      day: 6,
      focus: "Second batch and CV repair",
      actions: [
        "Review which roles replied or viewed the CV",
        "Improve the weakest CV bullet",
        "Apply to 10 more roles"
      ],
      output: "Improved CV and 10 additional applications"
    },
    {
      day: 7,
      focus: "Decide based on signal",
      actions: [
        "Count applications, replies, interviews, and rejections",
        "Double down on the target with the best reply rate",
        "Plan the next 7-day sprint"
      ],
      output: "Next target decision backed by metrics"
    }
  ];
}

function normalizeList(value, fallback) {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  if (typeof value === "string" && value.trim()) {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return fallback;
}

function buildCvHeadline(cvSignals, isGermany) {
  const asset = cvSignals.assets[0] || "reliable candidate";
  const location = isGermany ? "Germany-based" : "locally available";

  return `${location} ${asset} seeking fast-start operations or support role`;
}
