import { readFileSync } from "node:fs";

const playbooks = JSON.parse(readFileSync(new URL("../data/playbooks.json", import.meta.url), "utf8"));

export function listPlaybooks() {
  return playbooks.map(({ id, title, signals }) => ({ id, title, signals }));
}

export function retrievePlaybooks(input, limit = 3) {
  const haystack = [
    input.question,
    input.profile?.location,
    input.profile?.budget,
    input.profile?.languages,
    input.profile?.status,
    input.constraints,
    input.cvText
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return playbooks
    .map((playbook) => ({
      ...playbook,
      score: playbook.keywords.reduce((sum, keyword) => {
        return sum + (haystack.includes(keyword.toLowerCase()) ? 1 : 0);
      }, 0)
    }))
    .filter((playbook) => playbook.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
