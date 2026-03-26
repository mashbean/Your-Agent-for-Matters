import { createOpenAIProvider } from "../../packages/providers-openai/src/index.mjs";
import { parseCliFlags, runStressCreate } from "../../packages/core/src/index.mjs";

const endpoint = process.env.MATTERS_GRAPHQL_ENDPOINT || "https://server.matters.town/graphql";
const provider = createOpenAIProvider({
  apiKey: process.env.OPENAI_API_KEY,
  textModel: process.env.OPENAI_TEXT_MODEL || "gpt-5.2",
  imageModel: process.env.OPENAI_IMAGE_MODEL || "gpt-image-1"
});

async function main() {
  const flags = parseCliFlags(process.argv.slice(2));
  const result = await runStressCreate({
    endpoint,
    provider,
    configPath: flags.config || "./examples/agent-stress-test/accounts.example.json",
    outDir: flags.out || "./tmp/agent-stress-test-run",
    commentDelayMs: Number(flags["comment-delay-ms"] || 0)
  });
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
