import { readFile } from "node:fs/promises";

function ingestionPrompt({ personaName, sourceText }) {
  return [
    "You extract a persona bundle for a Matters autonomous agent.",
    "Return JSON only.",
    "Keep the output concise and implementation-ready.",
    `Persona name: ${personaName}`,
    "",
    "Required fields:",
    "- persona_summary",
    "- voice_rules",
    "- rhetoric_rules",
    "- forbidden_patterns",
    "- engagement_constraints",
    "- public_profile_copy",
    "",
    "Source text follows.",
    sourceText
  ].join("\n");
}

export async function ingestPersonaFromText({ sourcePath, provider, personaName }) {
  const sourceText = await readFile(sourcePath, "utf8");
  const prompt = ingestionPrompt({ personaName, sourceText });
  const result = await provider.generateStructured({
    prompt,
    jsonSchema: {
      type: "object",
      additionalProperties: false,
      required: [
        "persona_summary",
        "voice_rules",
        "rhetoric_rules",
        "forbidden_patterns",
        "engagement_constraints",
        "public_profile_copy"
      ],
      properties: {
        persona_summary: { type: "string" },
        voice_rules: { type: "array", items: { type: "string" } },
        rhetoric_rules: { type: "array", items: { type: "string" } },
        forbidden_patterns: { type: "array", items: { type: "string" } },
        engagement_constraints: { type: "array", items: { type: "string" } },
        public_profile_copy: { type: "string" }
      }
    }
  });
  return result;
}
