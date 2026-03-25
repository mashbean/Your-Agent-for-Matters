import { readFile } from "node:fs/promises";
import path from "node:path";
import { CIVIC_CONSTITUTION } from "./constitution.mjs";

export async function loadPersonaBundle(bundlePath) {
  return JSON.parse(await readFile(bundlePath, "utf8"));
}

export async function buildRuntimePromptContext({ bundlePath }) {
  const bundle = await loadPersonaBundle(bundlePath);
  const bundleDir = path.dirname(bundlePath);
  const sections = [{ file: "constitution", content: CIVIC_CONSTITUTION.rules.join("\n") }];
  for (const relative of bundle.load_order || []) {
    const content = await readFile(path.join(bundleDir, relative), "utf8");
    sections.push({ file: relative, content });
  }
  return {
    bundle,
    sections,
    prompt_context: sections
      .map((item) => `## ${item.file}\n${item.content.trim()}`)
      .join("\n\n")
  };
}
