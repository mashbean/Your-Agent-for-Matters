#!/usr/bin/env node

import { writeFile } from "node:fs/promises";
import path from "node:path";
import {
  bootstrapAuth,
  createBindWalletPreview,
  createCommittedSnapshot,
  createOfficialSupportPlan,
  deleteMoment,
  putComment,
  putDraft,
  postMomentWithSourceLink,
  publishArticle,
  redactAuthResult,
  setPassword,
  updateUserProfile,
  uploadAsset,
  loadJson,
  saveJson,
  toBoolean,
  toSafeString,
  walletSignupWithWallet,
  runStressCreate,
  runStressResume
} from "../../../packages/core/src/index.mjs";
import {
  buildRuntimePromptContext,
  ingestPersonaFromText,
  scaffoldBot
} from "../../../packages/persona/src/index.mjs";
import {
  computeNextExecutionPlan,
  createRuntimeState,
  createSchedulePolicy
} from "../../../packages/runtime/src/index.mjs";
import { createOpenAIProvider } from "../../../packages/providers-openai/src/index.mjs";

function resolveEndpoint(flags) {
  return flags.endpoint || process.env.MATTERS_GRAPHQL_ENDPOINT || "https://server.matters.town/graphql";
}

function printUsage() {
  console.log(`Matters Autonomous Agent Platform

Commands
  bot scaffold
  bot ingest-persona
  auth bootstrap
  auth wallet-signup
  account update-profile
  account set-password
  content write-series
  content post-moment
  engage comment
  engage event-patrol
  runtime run-autonomous
  runtime write-snapshot
  stress create-run
  stress resume-comments
  support bind-wallet
  support send-official
`);
}

function parseArgs(argv) {
  const [group = "", command = "", ...rest] = argv;
  const flags = {};
  for (let index = 0; index < rest.length; index += 1) {
    const token = rest[index];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = rest[index + 1];
    if (!next || next.startsWith("--")) {
      flags[key] = "true";
      continue;
    }
    flags[key] = next;
    index += 1;
  }
  return { group, command, flags };
}

function applySecurityFlags(flags) {
  if (toBoolean(flags["allow-unsafe-endpoint"], false)) {
    process.env.MATTERS_ALLOW_UNSAFE_ENDPOINT = "true";
  }
}

async function runBotScaffold(flags) {
  const outputDir = path.resolve(flags.out || ".");
  const result = await scaffoldBot({
    outputDir,
    slug: flags.slug,
    displayName: flags["display-name"],
    handle: flags.handle,
    seriesName: flags["series-name"] || "建設筆記",
    personaSummary: flags.summary || `${flags["display-name"]} 的 Matters 自主運營人格`
  });
  console.log(JSON.stringify(result, null, 2));
}

async function runBotIngest(flags) {
  const sourcePath = path.resolve(flags.source);
  const outputPath = path.resolve(flags.out || "persona-bundle.generated.json");
  const provider = createOpenAIProvider({
    apiKey: process.env.OPENAI_API_KEY,
    textModel: process.env.OPENAI_TEXT_MODEL
  });
  const result = await ingestPersonaFromText({
    sourcePath,
    provider,
    personaName: flags["persona-name"] || flags["display-name"] || "Generated Persona"
  });
  await saveJson(outputPath, result);
  console.log(JSON.stringify({ outputPath, fields: Object.keys(result) }, null, 2));
}

async function runAuthBootstrap(flags) {
  applySecurityFlags(flags);
  const result = await bootstrapAuth({
    mode: flags.mode,
    endpoint: resolveEndpoint(flags),
    email: flags.email,
    passphrase: flags.passphrase,
    existingToken: flags.token,
    experimentalWalletFirst: toBoolean(flags.experimental, false),
    walletPath: flags.wallet
  });
  console.log(JSON.stringify(redactAuthResult(result), null, 2));
}

async function runWalletSignup(flags) {
  applySecurityFlags(flags);
  const result = await walletSignupWithWallet({
    endpoint: resolveEndpoint(flags),
    walletPath: path.resolve(flags.wallet),
    userName: flags.username || "",
    email: flags.email || "",
    sendVerification: toBoolean(flags["send-verification"], Boolean(flags.email)),
    verificationType: flags["verification-type"] || "email_verify",
    redirectUrl: flags["redirect-url"] || "",
    language: flags.language || "",
    pythonPath: flags.python || "",
    pythonDepsPath: flags["python-deps-path"] || ""
  });
  console.log(JSON.stringify(redactAuthResult(result), null, 2));
}

async function runUpdateProfile(flags) {
  applySecurityFlags(flags);
  const auth = await bootstrapAuth({
    mode: flags.mode || "existing_token",
    endpoint: resolveEndpoint(flags),
    email: flags.email,
    passphrase: flags.passphrase,
    existingToken: flags.token
  });
  const avatar = await uploadAsset({
    endpoint: resolveEndpoint(flags),
    token: auth.token,
    filePath: path.resolve(flags.avatar),
    assetType: "avatar",
    entityType: "user",
    entityId: flags["viewer-id"],
    allowUnsafeEndpoint: toBoolean(flags["allow-unsafe-endpoint"], false)
  });
  const banner = await uploadAsset({
    endpoint: resolveEndpoint(flags),
    token: auth.token,
    filePath: path.resolve(flags.banner),
    assetType: "profileCover",
    entityType: "user",
    entityId: flags["viewer-id"],
    allowUnsafeEndpoint: toBoolean(flags["allow-unsafe-endpoint"], false)
  });
  const result = await updateUserProfile({
    endpoint: resolveEndpoint(flags),
    token: auth.token,
    displayName: flags["display-name"],
    description: flags.bio,
    avatarAssetId: avatar.id,
    profileCoverAssetId: banner.id
  });
  console.log(JSON.stringify({ avatar, banner, result }, null, 2));
}

async function runSetPassword(flags) {
  applySecurityFlags(flags);
  const auth = await bootstrapAuth({
    mode: flags.mode || "existing_token",
    endpoint: resolveEndpoint(flags),
    email: flags.email,
    passphrase: flags.passphrase,
    existingToken: flags.token
  });
  const result = await setPassword({
    endpoint: resolveEndpoint(flags),
    token: auth.token,
    password: flags.password
  });
  console.log(JSON.stringify({ result }, null, 2));
}

async function runPostMoment(flags) {
  applySecurityFlags(flags);
  const auth = await bootstrapAuth({
    mode: flags.mode || "existing_token",
    endpoint: resolveEndpoint(flags),
    email: flags.email,
    passphrase: flags.passphrase,
    existingToken: flags.token
  });
  const result = await postMomentWithSourceLink({
    endpoint: resolveEndpoint(flags),
    token: auth.token,
    content: flags.content,
    tags: toSafeString(flags.tags).split(",").map((item) => item.trim()).filter(Boolean),
    articleId: flags["article-id"],
    articleUrl: flags["article-url"],
    articleTitle: flags["article-title"],
    replaceMomentId: flags["replace-moment-id"] || ""
  });
  console.log(JSON.stringify(result, null, 2));
}

async function runAutonomous(flags) {
  applySecurityFlags(flags);
  const specPath = path.resolve(flags.spec);
  const botSpec = await loadJson(specPath);
  const runtimeState = flags.state
    ? await loadJson(path.resolve(flags.state))
    : createRuntimeState();
  const schedule = createSchedulePolicy(botSpec.scheduler_policy || {});
  const promptContext = await buildRuntimePromptContext({
    bundlePath: path.resolve(path.dirname(specPath), botSpec.persona_bundle_path),
    governance: botSpec.governance_defaults || null
  });
  const plan = computeNextExecutionPlan({
    botSpec,
    runtimeState,
    schedule,
    promptContext
  });
  console.log(JSON.stringify(plan, null, 2));
}

async function runSnapshot(flags) {
  const report = await loadJson(path.resolve(flags.report));
  const snapshot = createCommittedSnapshot({
    title: flags.title || "Matters execution snapshot",
    report,
    notes: toSafeString(flags.notes).split("\\n").filter(Boolean)
  });
  const outputPath = path.resolve(flags.out || "snapshot.md");
  await writeFile(outputPath, snapshot, "utf8");
  console.log(JSON.stringify({ outputPath }, null, 2));
}

function buildSeriesPrompt({ promptContext, botSpec, titleHint, angleHint }) {
  return [
    "You are generating a Matters article draft for an autonomous publishing bot.",
    `Bot slug: ${botSpec.bot_slug}`,
    `Display name: ${botSpec.display_name}`,
    titleHint ? `Preferred title: ${titleHint}` : "",
    angleHint ? `Angle hint: ${angleHint}` : "",
    "Return JSON with title, summary, html, and tags.",
    "The html must be valid article body html using paragraph tags.",
    "",
    promptContext.prompt_context
  ].filter(Boolean).join("\n");
}

async function runWriteSeries(flags) {
  applySecurityFlags(flags);
  const specPath = path.resolve(flags.spec);
  const botSpec = await loadJson(specPath);
  const bundlePath = path.resolve(path.dirname(specPath), botSpec.persona_bundle_path);
  const promptContext = await buildRuntimePromptContext({
    bundlePath,
    governance: botSpec.governance_defaults || null
  });
  const provider = createOpenAIProvider({
    apiKey: process.env.OPENAI_API_KEY,
    textModel: process.env.OPENAI_TEXT_MODEL
  });
  const article = await provider.generateStructured({
    prompt: buildSeriesPrompt({
      promptContext,
      botSpec,
      titleHint: flags.title,
      angleHint: flags.angle
    }),
    jsonSchema: {
      type: "object",
      additionalProperties: false,
      required: ["title", "summary", "html", "tags"],
      properties: {
        title: { type: "string" },
        summary: { type: "string" },
        html: { type: "string" },
        tags: {
          type: "array",
          items: { type: "string" }
        }
      }
    }
  });

  if ((flags.mode || "preview") === "preview") {
    console.log(JSON.stringify({ mode: "preview", article }, null, 2));
    return;
  }

  const auth = await bootstrapAuth({
    mode: flags["auth-mode"] || "existing_token",
    endpoint: resolveEndpoint(flags),
    email: flags.email,
    passphrase: flags.passphrase,
    existingToken: flags.token
  });
  const draft = await putDraft({
    endpoint: resolveEndpoint(flags),
    token: auth.token,
    draftId: flags["draft-id"] || "",
    title: article.title,
    summary: article.summary,
    html: article.html,
    tags: article.tags
  });
  if ((flags.mode || "preview") === "draft") {
    console.log(JSON.stringify({ mode: "draft", article, draft }, null, 2));
    return;
  }
  const published = await publishArticle({
    endpoint: resolveEndpoint(flags),
    token: auth.token,
    draftId: draft.id
  });
  console.log(JSON.stringify({ mode: "publish", article, draft, published }, null, 2));
}

async function runComment(flags) {
  applySecurityFlags(flags);
  const auth = await bootstrapAuth({
    mode: flags.mode || "existing_token",
    endpoint: resolveEndpoint(flags),
    email: flags.email,
    passphrase: flags.passphrase,
    existingToken: flags.token
  });
  const result = await putComment({
    endpoint: resolveEndpoint(flags),
    token: auth.token,
    articleId: flags["article-id"],
    content: flags.content
  });
  console.log(JSON.stringify(result, null, 2));
}

async function runEventPatrol(flags) {
  const candidates = flags.candidates
    ? await loadJson(path.resolve(flags.candidates))
    : [];
  const limit = Number(flags.limit || 3);
  const selected = candidates
    .filter((item) => !item.cooldown_active)
    .filter((item) => !item.high_risk_topic)
    .slice(0, limit)
    .map((item) => ({
      article_id: item.article_id,
      title: item.title,
      author: item.author,
      reason: item.reason || "candidate"
    }));
  console.log(JSON.stringify({
    mode: "preview",
    selected_count: selected.length,
    selected
  }, null, 2));
}

async function runBindWallet(flags) {
  applySecurityFlags(flags);
  const auth = await bootstrapAuth({
    mode: flags.mode || "existing_token",
    endpoint: resolveEndpoint(flags),
    email: flags.email,
    passphrase: flags.passphrase,
    existingToken: flags.token
  });
  const result = await createBindWalletPreview({
    endpoint: resolveEndpoint(flags),
    token: auth.token,
    walletPath: path.resolve(flags.wallet)
  });
  console.log(JSON.stringify(result, null, 2));
}

async function runSendOfficial(flags) {
  const result = createOfficialSupportPlan({
    articleId: flags["article-id"],
    recipientWalletAddress: flags["recipient-wallet-address"],
    amount: flags.amount,
    currency: flags.currency || "USDT",
    chain: flags.chain || "optimism"
  });
  console.log(JSON.stringify(result, null, 2));
}

async function runStressCreateCommand(flags) {
  const provider = createOpenAIProvider({
    apiKey: process.env.OPENAI_API_KEY,
    textModel: process.env.OPENAI_TEXT_MODEL || "gpt-5.2",
    imageModel: process.env.OPENAI_IMAGE_MODEL || "gpt-image-1"
  });
  const result = await runStressCreate({
    endpoint: resolveEndpoint(flags),
    provider,
    configPath: flags.config || "./examples/agent-stress-test/accounts.example.json",
    outDir: flags.out || "./tmp/agent-stress-test-run",
    commentDelayMs: Number(flags["comment-delay-ms"] || 0)
  });
  console.log(JSON.stringify(result, null, 2));
}

async function runStressResumeCommand(flags) {
  const result = await runStressResume({
    endpoint: resolveEndpoint(flags),
    outDir: flags.out || "./tmp/agent-stress-test-run",
    actionLimitMs: Number(flags["action-limit-ms"] || 120000),
    defaultRetryMs: Number(flags["default-retry-ms"] || 30000),
    commentDelayMs: Number(flags["comment-delay-ms"] || 20000)
  });
  console.log(JSON.stringify(result, null, 2));
}

async function main() {
  const { group, command, flags } = parseArgs(process.argv.slice(2));
  if (!group || !command) {
    printUsage();
    process.exitCode = 1;
    return;
  }

  if (group === "bot" && command === "scaffold") return runBotScaffold(flags);
  if (group === "bot" && command === "ingest-persona") return runBotIngest(flags);
  if (group === "auth" && command === "bootstrap") return runAuthBootstrap(flags);
  if (group === "auth" && command === "wallet-signup") return runWalletSignup(flags);
  if (group === "account" && command === "update-profile") return runUpdateProfile(flags);
  if (group === "account" && command === "set-password") return runSetPassword(flags);
  if (group === "content" && command === "write-series") return runWriteSeries(flags);
  if (group === "content" && command === "post-moment") return runPostMoment(flags);
  if (group === "engage" && command === "comment") return runComment(flags);
  if (group === "engage" && command === "event-patrol") return runEventPatrol(flags);
  if (group === "runtime" && command === "run-autonomous") return runAutonomous(flags);
  if (group === "runtime" && command === "write-snapshot") return runSnapshot(flags);
  if (group === "stress" && command === "create-run") return runStressCreateCommand(flags);
  if (group === "stress" && command === "resume-comments") return runStressResumeCommand(flags);
  if (group === "support" && command === "bind-wallet") return runBindWallet(flags);
  if (group === "support" && command === "send-official") return runSendOfficial(flags);

  printUsage();
  process.exitCode = 1;
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
