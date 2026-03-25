import test from "node:test";
import assert from "node:assert/strict";
import { buildSourceLinkCommentHtml, createCommittedSnapshot } from "../packages/core/src/index.mjs";

test("source link comment html renders anchor", () => {
  const html = buildSourceLinkCommentHtml({
    articleTitle: "測試文章",
    articleUrl: "https://matters.town/a/example"
  });
  assert.match(html, /href="https:\/\/matters.town\/a\/example"/);
  assert.match(html, /測試文章/);
});

test("committed snapshot includes raw report section", () => {
  const markdown = createCommittedSnapshot({
    title: "Snapshot",
    report: { status: "ok", generated_at: "2026-03-25T10:00:00Z" }
  });
  assert.match(markdown, /## Raw Report/);
  assert.match(markdown, /"status": "ok"/);
});
