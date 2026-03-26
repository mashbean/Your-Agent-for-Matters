import test from "node:test";
import assert from "node:assert/strict";
import {
  assertTrustedUrl,
  buildSourceLinkCommentHtml,
  createCommittedSnapshot,
  normalizeEthereumSignature,
  redactAuthResult,
  buildConversationPrompt,
  buildConversationSchema,
  resolveRetryWaitMs,
  resolveStressRunPaths
} from "../packages/core/src/index.mjs";

test("source link comment html renders anchor", () => {
  const html = buildSourceLinkCommentHtml({
    articleTitle: "測試文章",
    articleUrl: "https://matters.town/a/example"
  });
  assert.match(html, /href="https:\/\/matters.town\/a\/example"/);
  assert.match(html, /測試文章/);
});

test("source link comment html escapes title", () => {
  const html = buildSourceLinkCommentHtml({
    articleTitle: "\" onclick=\"alert(1)",
    articleUrl: "https://matters.town/a/example"
  });
  assert.match(html, /href="https:\/\/matters.town\/a\/example"/);
  assert.match(html, /&quot; onclick=&quot;alert\(1\)/);
});

test("trusted url blocks unallowlisted host", () => {
  assert.throws(
    () => assertTrustedUrl("https://evil.example/graphql", {
      label: "Matters endpoint",
      allowedHosts: ["server.matters.town"]
    }),
    /not allowlisted/
  );
});

test("auth redaction hides token", () => {
  const output = redactAuthResult({ mode: "existing_token", token: "abcdefgh12345678" });
  assert.equal(output.token, "[redacted]");
  assert.equal(output.token_present, true);
  assert.equal("token_preview" in output, false);
});

test("normalize ethereum signature converts v byte", () => {
  const body = "a".repeat(128);
  assert.equal(normalizeEthereumSignature(`0x${body}1b`), `0x${body}00`);
  assert.equal(normalizeEthereumSignature(`0x${body}1c`), `0x${body}01`);
});

test("committed snapshot includes raw report section", () => {
  const markdown = createCommittedSnapshot({
    title: "Snapshot",
    report: { status: "ok", generated_at: "2026-03-25T10:00:00Z" }
  });
  assert.match(markdown, /## Raw Report/);
  assert.match(markdown, /"status": "ok"/);
});

test("stress run paths resolve expected files", () => {
  const paths = resolveStressRunPaths("./tmp/example-run");
  assert.match(paths.root, /tmp\/example-run$/);
  assert.match(paths.resultPath, /stress-results\.json$/);
  assert.match(paths.progressPath, /stress-progress\.json$/);
});

test("retry wait prefers action limit for rate limit errors", () => {
  assert.equal(resolveRetryWaitMs("ACTION_LIMIT_EXCEEDED slow down", 120000, 30000), 120000);
  assert.equal(resolveRetryWaitMs("other error", 120000, 30000), 30000);
});

test("conversation schema reflects account keys and count", () => {
  const schema = buildConversationSchema(["a", "b", "c"], 5);
  assert.equal(schema.properties.comments.minItems, 5);
  assert.deepEqual(schema.properties.comments.items.properties.speaker.enum, ["a", "b", "c"]);
});

test("conversation prompt includes topic and first speakers", () => {
  const prompt = buildConversationPrompt({
    conversation: { topic: "公共討論", comment_count: 6, moment_max_chars: 120 },
    accounts: [
      { key: "santaizi", display_name: "三太子" },
      { key: "wukong", display_name: "孫悟空" },
      { key: "baoyu", display_name: "賈寶玉" }
    ]
  });
  assert.match(prompt, /主題：公共討論/);
  assert.match(prompt, /第一則與第二則留言必須分別由 santaizi 與 wukong 發出/);
  assert.match(prompt, /先寫一則由 baoyu 發出的短動態/);
});
