import path from "node:path";
import { loadJson, saveJson, putMomentComment, walletLoginWithWallet } from "../../packages/core/src/index.mjs";

const endpoint = process.env.MATTERS_GRAPHQL_ENDPOINT || "https://server.matters.town/graphql";

function parseArgs(argv) {
  const flags = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      flags[key] = "true";
      continue;
    }
    flags[key] = next;
    index += 1;
  }
  return flags;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function resolveWaitMs(message, actionLimitMs, defaultMs) {
  if (message.includes("ACTION_LIMIT_EXCEEDED") || message.includes("rate exceeded")) {
    return actionLimitMs;
  }
  return defaultMs;
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  const outDir = path.resolve(flags.out || "./tmp/agent-stress-test-run");
  const statePath = path.join(outDir, "stress-progress.json");
  const resultPath = path.join(outDir, "stress-results.json");
  const actionLimitMs = Number(flags["action-limit-ms"] || 120000);
  const defaultRetryMs = Number(flags["default-retry-ms"] || 30000);
  const interCommentDelayMs = Number(flags["comment-delay-ms"] || 20000);

  const results = await loadJson(resultPath);
  let progress = { next_index: 0, posted: [] };
  try {
    progress = await loadJson(statePath);
  } catch {}

  const accounts = Object.fromEntries(await Promise.all(
    Object.entries(results.accounts).map(async ([key, value]) => [
      key,
      await walletLoginWithWallet({ endpoint, walletPath: value.wallet_path })
    ])
  ));

  for (let index = progress.next_index; index < results.conversation.comments.length; index += 1) {
    const item = results.conversation.comments[index];
    const actor = accounts[item.speaker];
    const content = `<p>${escapeHtml(item.content)}</p>`;
    let attempt = 0;

    while (true) {
      attempt += 1;
      try {
        const comment = await putMomentComment({
          endpoint,
          token: actor.token,
          momentId: results.moment.id,
          content
        });
        progress.posted.push({
          index: index + 1,
          speaker: item.speaker,
          comment_id: comment.id,
          content: item.content
        });
        progress.next_index = index + 1;
        await saveJson(statePath, progress);
        console.log(`posted ${index + 1}/${results.conversation.comments.length} by ${item.speaker}`);
        if (index < results.conversation.comments.length - 1) {
          await sleep(interCommentDelayMs);
        }
        break;
      } catch (error) {
        const message = String(error?.message || error);
        const waitMs = resolveWaitMs(message, actionLimitMs, defaultRetryMs);
        console.error(`comment ${index + 1} failed attempt ${attempt}: ${message}`);
        console.error(`wait ${waitMs}ms before retry`);
        await sleep(waitMs);
      }
    }
  }

  console.log("all queued comments posted");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
