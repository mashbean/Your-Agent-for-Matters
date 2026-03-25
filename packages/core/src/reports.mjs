import { toSafeString } from "./utils.mjs";

export function createCommittedSnapshot({ title, report, notes = [] }) {
  const lines = [`# ${title}`, ""];
  if (report?.status) lines.push(`- status \`${report.status}\``);
  if (report?.generated_at) lines.push(`- generated_at \`${report.generated_at}\``);
  if (report?.moment_url) lines.push(`- moment_url \`${report.moment_url}\``);
  if (report?.article_url) lines.push(`- article_url \`${report.article_url}\``);

  if (Array.isArray(report?.posted) && report.posted.length > 0) {
    lines.push("", "## Posted", "");
    for (const item of report.posted) {
      lines.push(`- ${toSafeString(item.key) || "entry"}: ${toSafeString(item.moment_url || item.article_url || item.comment_id)}`);
    }
  }

  if (notes.length > 0) {
    lines.push("", "## Notes", "");
    for (const note of notes) lines.push(`- ${note}`);
  }

  lines.push("", "## Raw Report", "", "```json", JSON.stringify(report, null, 2), "```", "");
  return lines.join("\n");
}
