import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import { CIVIC_CONSTITUTION } from "./constitution.mjs";

function buildGovernanceDefaults({ displayName }) {
  return {
    service_scope: `${displayName} 服務的在地社群、工作流或公共議題範圍。`,
    affected_people: ["直接使用者", "受內容或互動影響的人"],
    human_only_boundaries: [
      "未經授權不得代表人類做不可逆承諾",
      "涉及高風險判斷時必須保留人工決策"
    ],
    correction_path: "當事人或 operator 可提出異議、要求修正、暫停或覆寫。",
    shutdown_path: "保留 kill switch、token 撤銷與停用 lane 的真實退場路徑。"
  };
}

function buildBundle({ slug, displayName, handle, seriesName, personaSummary }) {
  return {
    persona_version: `${slug}@v1`,
    persona_name: displayName,
    persona_summary: personaSummary,
    constitution_refs: [CIVIC_CONSTITUTION.source],
    governance_defaults: buildGovernanceDefaults({ displayName }),
    load_order: [
      "profile.md",
      "voice.md",
      "rhetoric.md",
      "posting-playbook.md",
      "engagement-playbook.md",
      "modern-mapping.md",
      "public-profile.md",
      "account-kit.md"
    ],
    account_defaults: {
      handle,
      display_name: displayName,
      bio_short: `${displayName}。以固定人格與穩定語氣在 Matters 持續寫作。`
    },
    series_defaults: {
      name: seriesName,
      target_posts: 7,
      default_tags: [displayName, "Matters Bot"]
    }
  };
}

export async function scaffoldBot({ outputDir, slug, displayName, handle, seriesName, personaSummary }) {
  await mkdir(outputDir, { recursive: true });
  await mkdir(path.join(outputDir, "canonical-samples"), { recursive: true });
  await mkdir(path.join(outputDir, "assets/generated"), { recursive: true });

  const bundle = buildBundle({ slug, displayName, handle, seriesName, personaSummary });
  const files = {
    "persona-bundle.json": JSON.stringify(bundle, null, 2) + "\n",
    "profile.md": `# Profile\n\n${displayName} 的核心人格。\n\n## Local Scope\n\n- 服務範圍：請明確填寫實際服務的地方、社群、工作流或議題。\n- 受影響者：請列出直接使用者與會被此 bot 影響的人。\n- 人工保留：請寫清楚哪些判斷或承諾不能由 bot 直接代做。\n`,
    "voice.md": "# Voice\n\n- 用台灣繁體中文\n- 維持可辨識的一致聲口\n",
    "rhetoric.md": "# Rhetoric\n\n- 先定義名詞，再提出判斷\n- 避免空泛口號\n",
    "posting-playbook.md": "# Posting Playbook\n\n- 文章先有明確主張再發\n",
    "engagement-playbook.md": "# Engagement Playbook\n\n- 先回應對方論點，再補一個有用角度\n",
    "modern-mapping.md": "# Modern Mapping\n\n- 現代議題推論要保留歷史連續性與推測感\n",
    "public-profile.md": `# Public Profile\n\n${displayName}\n`,
    "account-kit.md": `# Account Kit\n\n- handle @${handle}\n\n## Correction / Shutdown\n\n- correction path: 誰可以要求修正、如何提出異議、怎麼覆寫\n- shutdown path: 如何停用、撤權、關閉 lane、回收 token\n`,
    "launch-moments.json": JSON.stringify({ moments: [] }, null, 2) + "\n",
    "canonical-samples/day-01.md": `# ${seriesName} 1\n\n在這裡放第一篇金標文。\n`
  };

  for (const [relative, content] of Object.entries(files)) {
    await writeFile(path.join(outputDir, relative), content, "utf8");
  }

  return {
    output_dir: outputDir,
    files: Object.keys(files),
    bundle
  };
}
