import { parseCliFlags, runStressResume } from "../../packages/core/src/index.mjs";

const endpoint = process.env.MATTERS_GRAPHQL_ENDPOINT || "https://server.matters.town/graphql";

async function main() {
  const flags = parseCliFlags(process.argv.slice(2));
  const result = await runStressResume({
    endpoint,
    outDir: flags.out || "./tmp/agent-stress-test-run",
    actionLimitMs: Number(flags["action-limit-ms"] || 120000),
    defaultRetryMs: Number(flags["default-retry-ms"] || 30000),
    commentDelayMs: Number(flags["comment-delay-ms"] || 20000)
  });
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
