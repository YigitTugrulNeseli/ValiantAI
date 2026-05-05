import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

export function loadEnv(filePath = ".env") {
  const fullPath = resolve(filePath);

  if (!existsSync(fullPath)) {
    return;
  }

  const lines = readFileSync(fullPath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separator = trimmed.indexOf("=");

    if (separator === -1) {
      continue;
    }

    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim().replace(/^["']|["']$/g, "");

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

export function getConfig() {
  return {
    port: Number(process.env.PORT || 3000),
    host: process.env.HOST || "127.0.0.1",
    openaiApiKey: process.env.OPENAI_API_KEY || "",
    openaiModel: process.env.OPENAI_MODEL || "gpt-5.4-mini",
    aiMode: process.env.AI_MODE || "auto"
  };
}
