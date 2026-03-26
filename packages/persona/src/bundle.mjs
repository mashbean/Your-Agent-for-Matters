import { readFile } from "node:fs/promises";
import path from "node:path";
import { CIVIC_CONSTITUTION } from "./constitution.mjs";

export async function loadPersonaBundle(bundlePath) {
  return JSON.parse(await readFile(bundlePath, "utf8"));
}

function formatGovernanceSection(governance = {}) {
  const affectedPeople = Array.isArray(governance.affected_people) ? governance.affected_people : [];
  const humanOnly = Array.isArray(governance.human_only_boundaries) ? governance.human_only_boundaries : [];
  return [
    `service_scope: ${governance.service_scope || ""}`,
    `affected_people: ${affectedPeople.join("; ")}`,
    `human_only_boundaries: ${humanOnly.join("; ")}`,
    `correction_path: ${governance.correction_path || ""}`,
    `shutdown_path: ${governance.shutdown_path || ""}`
  ].join("\n");
}

export async function buildRuntimePromptContext({ bundlePath, governance = null }) {
  const bundle = await loadPersonaBundle(bundlePath);
  const bundleDir = path.dirname(bundlePath);
  const effectiveGovernance = governance || bundle.governance_defaults || {};
  const sections = [{ file: "constitution", content: CIVIC_CONSTITUTION.rules.join("\n") }];
  if (Object.keys(effectiveGovernance).length > 0) {
    sections.push({ file: "governance", content: formatGovernanceSection(effectiveGovernance) });
  }
  for (const relative of bundle.load_order || []) {
    const content = await readFile(path.join(bundleDir, relative), "utf8");
    sections.push({ file: relative, content });
  }
  return {
    bundle,
    governance: effectiveGovernance,
    sections,
    prompt_context: sections
      .map((item) => `## ${item.file}\n${item.content.trim()}`)
      .join("\n\n")
  };
}
