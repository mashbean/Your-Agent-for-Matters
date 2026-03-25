import test from "node:test";
import assert from "node:assert/strict";
import {
  assertTrustedUrl,
  buildSourceLinkCommentHtml,
  createCommittedSnapshot,
  normalizeEthereumSignature,
  redactAuthResult
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
