import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { Wallet } from "ethers";
import {
  putMoment,
  putMomentComment,
  updateUserProfile
} from "./actions.mjs";
import { uploadAsset } from "./assets.mjs";
import { loadJson, saveJson, toSafeString } from "./utils.mjs";
import { walletLoginWithWallet, walletSignupWithWallet } from "./wallet-auth.mjs";

export function parseCliFlags(argv) {
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

export function escapeHtml(value) {
  return toSafeString(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function resolveStressRunPaths(outDir) {
  const root = path.resolve(outDir);
  return {
    root,
    walletsDir: path.join(root, "wallets"),
    assetsDir: path.join(root, "assets"),
    resultPath: path.join(root, "stress-results.json"),
    progressPath: path.join(root, "stress-progress.json")
  };
}

export function resolveRetryWaitMs(message, actionLimitMs, defaultRetryMs) {
  const text = toSafeString(message);
  if (text.includes("ACTION_LIMIT_EXCEEDED") || text.includes("rate exceeded")) {
    return actionLimitMs;
  }
  return defaultRetryMs;
}

export function buildConversationPrompt(config) {
  const accountList = config.accounts
    .map((account) => `- ${account.key}：${account.display_name}`)
    .join("\n");
  const firstSpeaker = config.accounts[0]?.key || "speaker_a";
  const secondSpeaker = config.accounts[1]?.key || "speaker_b";
  const poster = config.accounts[config.accounts.length - 1]?.key || firstSpeaker;
  return [
    "你在替 Matters 平台做一個明確揭露的 AI agent 壓力測試。",
    "所有帳號都知道彼此是 AI 測試帳號，但對話內容要自然、有性格、不要官腔。",
    `角色列表：\n${accountList}`,
    `主題：${config.conversation.topic}`,
    `先寫一則由 ${poster} 發出的短動態，${config.conversation.moment_max_chars} 字內。`,
    `再產出 ${config.conversation.comment_count} 則留言，形成多輪對話。`,
    `第一則與第二則留言必須分別由 ${firstSpeaker} 與 ${secondSpeaker} 發出，回應短動態。`,
    "全部使用繁體中文。",
    "不要冒充真人；可偶爾提到這是測試，但不要每則都提。",
    "每則留言 8~60 字，且對話要有推進，不是同義反覆。",
    "回傳 JSON，鍵為 moment, comments；comments 內每項必須有 speaker 與 content。"
  ].join("\n");
}

export function buildConversationSchema(accountKeys, commentCount) {
  return {
    type: "object",
    additionalProperties: false,
    required: ["moment", "comments"],
    properties: {
      moment: { type: "string" },
      comments: {
        type: "array",
        minItems: commentCount,
        maxItems: commentCount,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["speaker", "content"],
          properties: {
            speaker: { type: "string", enum: accountKeys },
            content: { type: "string" }
          }
        }
      }
    }
  };
}

export async function generateImageFile({ provider, prompt, outputPath, size }) {
  const image = await provider.generateImage({ prompt, size });
  if (!image) throw new Error("image generation returned empty payload");
  if (image.b64_json) {
    await writeFile(outputPath, Buffer.from(image.b64_json, "base64"));
    return outputPath;
  }
  if (image.url) {
    const response = await fetch(image.url);
    await writeFile(outputPath, Buffer.from(await response.arrayBuffer()));
    return outputPath;
  }
  throw new Error("image generation missing url and b64_json");
}

export async function runStressCreate({ endpoint, provider, configPath, outDir, commentDelayMs = 0 }) {
  const config = await loadJson(path.resolve(configPath));
  const paths = resolveStressRunPaths(outDir);
  await mkdir(paths.root, { recursive: true });
  await mkdir(paths.walletsDir, { recursive: true });
  await mkdir(paths.assetsDir, { recursive: true });

  const accountStates = {};
  for (const account of config.accounts) {
    const walletPath = path.join(paths.walletsDir, `${account.key}.json`);
    const wallet = Wallet.createRandom();
    await writeFile(walletPath, JSON.stringify({
      address: wallet.address,
      private_key_hex: wallet.privateKey,
      created_at: new Date().toISOString(),
      network_family: "evm",
      intended_network: "optimism"
    }, null, 2));

    const signup = await walletSignupWithWallet({ endpoint, walletPath, userName: account.handle });
    const auth = await walletLoginWithWallet({ endpoint, walletPath });

    const avatarPath = path.join(paths.assetsDir, `${account.key}-avatar.png`);
    const bannerPath = path.join(paths.assetsDir, `${account.key}-banner.png`);
    await generateImageFile({ provider, prompt: account.avatar_prompt, outputPath: avatarPath, size: "1024x1024" });
    await generateImageFile({ provider, prompt: account.banner_prompt, outputPath: bannerPath, size: "1536x1024" });

    const avatar = await uploadAsset({
      endpoint,
      token: auth.token,
      filePath: avatarPath,
      assetType: "avatar",
      entityType: "user",
      entityId: auth.user.id
    });
    const banner = await uploadAsset({
      endpoint,
      token: auth.token,
      filePath: bannerPath,
      assetType: "profileCover",
      entityType: "user",
      entityId: auth.user.id
    });
    const profile = await updateUserProfile({
      endpoint,
      token: auth.token,
      displayName: account.display_name,
      description: account.bio,
      avatarAssetId: avatar.id,
      profileCoverAssetId: banner.id
    });

    accountStates[account.key] = {
      ...account,
      wallet_path: walletPath,
      signup,
      auth,
      profile,
      avatar,
      banner,
      avatar_path: avatarPath,
      banner_path: bannerPath
    };
  }

  const poster = config.accounts[config.accounts.length - 1]?.key;
  const conversation = await provider.generateStructured({
    prompt: buildConversationPrompt(config),
    jsonSchema: buildConversationSchema(config.accounts.map((item) => item.key), config.conversation.comment_count)
  });

  const moment = await putMoment({
    endpoint,
    token: accountStates[poster].auth.token,
    content: String(conversation.moment).slice(0, config.conversation.moment_max_chars),
    tags: config.moment_tags || []
  });

  const posted = [];
  for (const [index, item] of conversation.comments.entries()) {
    const actor = accountStates[item.speaker];
    const comment = await putMomentComment({
      endpoint,
      token: actor.auth.token,
      momentId: moment.id,
      content: `<p>${escapeHtml(item.content)}</p>`
    });
    posted.push({ index: index + 1, speaker: item.speaker, comment_id: comment.id, content: item.content });
    if (commentDelayMs > 0 && index < conversation.comments.length - 1) {
      await sleep(commentDelayMs);
    }
  }

  const report = {
    endpoint,
    config_path: path.resolve(configPath),
    out_dir: paths.root,
    moment,
    conversation,
    posted,
    accounts: Object.fromEntries(Object.entries(accountStates).map(([key, value]) => [key, {
      display_name: value.display_name,
      handle: value.handle,
      user: value.auth.user,
      wallet_path: value.wallet_path,
      bio: value.bio,
      avatar_path: value.avatar_path,
      banner_path: value.banner_path
    }]))
  };

  await saveJson(paths.resultPath, report);
  return {
    out_dir: paths.root,
    moment,
    comment_count: posted.length,
    accounts: Object.fromEntries(Object.entries(accountStates).map(([key, value]) => [key, {
      display_name: value.display_name,
      handle: value.handle
    }]))
  };
}

export async function runStressResume({ endpoint, outDir, actionLimitMs = 120000, defaultRetryMs = 30000, commentDelayMs = 20000 }) {
  const paths = resolveStressRunPaths(outDir);
  const results = await loadJson(paths.resultPath);
  let progress = { next_index: 0, posted: [] };
  try {
    progress = await loadJson(paths.progressPath);
  } catch {}

  const accounts = Object.fromEntries(await Promise.all(
    Object.entries(results.accounts).map(async ([key, value]) => [key, await walletLoginWithWallet({ endpoint, walletPath: value.wallet_path })])
  ));

  for (let index = progress.next_index; index < results.conversation.comments.length; index += 1) {
    const item = results.conversation.comments[index];
    const actor = accounts[item.speaker];
    const content = `<p>${escapeHtml(item.content)}</p>`;
    let attempt = 0;
    while (true) {
      attempt += 1;
      try {
        const comment = await putMomentComment({ endpoint, token: actor.token, momentId: results.moment.id, content });
        progress.posted.push({ index: index + 1, speaker: item.speaker, comment_id: comment.id, content: item.content });
        progress.next_index = index + 1;
        await saveJson(paths.progressPath, progress);
        if (index < results.conversation.comments.length - 1) {
          await sleep(commentDelayMs);
        }
        break;
      } catch (error) {
        const waitMs = resolveRetryWaitMs(error?.message, actionLimitMs, defaultRetryMs);
        await sleep(waitMs);
      }
    }
  }

  return {
    out_dir: paths.root,
    moment_id: results.moment.id,
    posted_count: progress.posted.length,
    total_comments: results.conversation.comments.length,
    progress_path: paths.progressPath
  };
}
