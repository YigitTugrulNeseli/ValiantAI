import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import test from "node:test";

const playwright = await importOptional("playwright");

test("visual smoke: workspace, project, dark mode, resize", {
  skip: playwright ? false : "Playwright is not installed"
}, async () => {
  const port = 3199;
  const server = spawn(process.execPath, ["src/server.js"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PORT: String(port)
    },
    stdio: ["ignore", "pipe", "pipe"]
  });
  let stderrText = "";
  server.stderr.on("data", (chunk) => {
    stderrText += chunk.toString();
  });

  try {
    await waitForServer(port, server, () => stderrText);

    const browser = await playwright.chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 920 } });

    page.on("pageerror", (error) => {
      throw error;
    });

    await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: "networkidle" });
    await assertVisible(page, ".flow-node");
    await page.click("#workspace-toggle");
    await assertVisible(page, ".workspace-project");
    await page.click("#theme-toggle");
    await page.dragAndDrop(".side-resize-handle", ".canvas-shell", {
      targetPosition: { x: 30, y: 30 }
    });
    await page.click(".workspace-project-button");
    await assertVisible(page, ".flow-node");

    const screenshot = await page.screenshot();
    assert.ok(screenshot.byteLength > 20_000);

    await browser.close();
  } finally {
    server.kill();
  }
});

async function importOptional(packageName) {
  try {
    return await import(packageName);
  } catch {
    return null;
  }
}

async function waitForServer(port, server, getStderr) {
  const deadline = Date.now() + 6_000;

  while (Date.now() < deadline) {
    if (server.exitCode !== null) {
      throw new Error(`Server exited early: ${getStderr()}`);
    }

    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/health`);

      if (response.ok) {
        return;
      }
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 120));
    }
  }

  throw new Error("Timed out waiting for visual smoke server");
}

async function assertVisible(page, selector) {
  const visible = await page.locator(selector).first().isVisible();
  assert.equal(visible, true, `${selector} should be visible`);
}
