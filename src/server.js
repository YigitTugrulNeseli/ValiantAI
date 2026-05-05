import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

import { createDecisionPlan } from "./decision-engine.js";
import { getConfig, loadEnv } from "./env.js";
import { listPlaybooks } from "./retrieval.js";

loadEnv();

const config = getConfig();
const rootDir = fileURLToPath(new URL("..", import.meta.url));
const publicDir = join(rootDir, "public");

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml"
};

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url || "/", `http://${request.headers.host}`);

    if (request.method === "GET" && url.pathname === "/api/health") {
      return sendJson(response, 200, {
        ok: true,
        aiMode: config.openaiApiKey ? config.aiMode : "fallback",
        model: config.openaiModel,
        playbooks: listPlaybooks().length
      });
    }

    if (request.method === "GET" && url.pathname === "/api/playbooks") {
      return sendJson(response, 200, { playbooks: listPlaybooks() });
    }

    if (request.method === "POST" && url.pathname === "/api/decide") {
      const body = await readJson(request);
      const input = normalizeDecisionInput(body);
      const result = await createDecisionPlan(input, config);

      return sendJson(response, 200, result);
    }

    if (request.method === "GET") {
      return serveStatic(url.pathname, response);
    }

    return sendJson(response, 405, { error: "Method not allowed" });
  } catch (error) {
    return sendJson(response, 500, { error: error.message || "Unexpected server error" });
  }
});

server.listen(config.port, config.host, () => {
  console.log(`Valiant Decision Engine running at http://${config.host}:${config.port}`);
});

async function serveStatic(pathname, response) {
  const requestedPath = pathname === "/" ? "/index.html" : pathname;
  const safePath = normalize(requestedPath).replace(/^(\.\.[/\\])+/, "");
  const filePath = join(publicDir, safePath);

  if (!filePath.startsWith(publicDir)) {
    return sendJson(response, 403, { error: "Forbidden" });
  }

  try {
    const file = await readFile(filePath);
    response.writeHead(200, {
      "Content-Type": mimeTypes[extname(filePath)] || "application/octet-stream"
    });
    response.end(file);
  } catch {
    sendJson(response, 404, { error: "Not found" });
  }
}

function normalizeDecisionInput(body) {
  return {
    question: String(body.question || "").trim(),
    profile: {
      location: String(body.profile?.location || body.location || "").trim(),
      budget: String(body.profile?.budget || body.budget || "").trim(),
      languages: String(body.profile?.languages || body.languages || "").trim(),
      status: String(body.profile?.status || body.status || "").trim()
    },
    constraints: body.constraints || "",
    cvText: String(body.cvText || "").trim()
  };
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload, null, 2));
}

async function readJson(request) {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  const rawBody = Buffer.concat(chunks).toString("utf8");

  if (!rawBody) {
    return {};
  }

  return JSON.parse(rawBody);
}
