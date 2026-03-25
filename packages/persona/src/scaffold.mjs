import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import { CIVIC_CONSTITUTION } from "./constitution.mjs";

function buildBundle({ slug, displayName, handle, seriesName, personaSummary }) {
  return {
    persona_version: `${slug}@v1`,
    persona_name: displayName,
    persona_summary: personaSummary,
    constitution_refs: [CIVIC_CONSTITUTION.source],
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
    "profile.md": `# Profile\n\n${displayName} 的核心人格。\n`,
    "voice.md": "# Voice\n\n- 用台灣繁體中文\n- 維持可辨識的一致聲口\n",
    "rhetoric.md": "# Rhetoric\n\n- 先定義名詞，再提出判斷\n- 避免空泛口號\n",
    "posting-playbook.md": "# Posting Playbook\n\n- 文章先有明確主張再發\n",
    "engagement-playbook.md": "# Engagement Playbook\n\n- 先回應對方論點，再補一個有用角度\n",
    "modern-mapping.md": "# Modern Mapping\n\n- 現代議題推論要保留歷史連續性與推測感\n",
    "public-profile.md": `# Public Profile\n\n${displayName}\n`,
    "account-kit.md": `# Account Kit\n\n- handle @${handle}\n`,
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
