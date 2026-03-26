import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { scaffoldBot, buildRuntimePromptContext } from "../packages/persona/src/index.mjs";

test("scaffold bot creates persona bundle", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "matters-persona-"));
  const outputDir = path.join(tempDir, "starter");
  await scaffoldBot({
    outputDir,
    slug: "starter",
    displayName: "Starter",
    handle: "starter",
    seriesName: "Series",
    personaSummary: "summary"
  });
  const bundle = JSON.parse(await readFile(path.join(outputDir, "persona-bundle.json"), "utf8"));
  assert.equal(bundle.persona_name, "Starter");
  assert.equal(bundle.governance_defaults.service_scope.includes("Starter"), true);
  assert.ok(Array.isArray(bundle.governance_defaults.affected_people));
  assert.ok(Array.isArray(bundle.governance_defaults.human_only_boundaries));
});

test("runtime prompt context puts constitution first", async () => {
  const bundlePath = path.resolve("examples/starter-bot/persona-bundle.json");
  const context = await buildRuntimePromptContext({ bundlePath });
  assert.equal(context.sections[0].file, "constitution");
});
