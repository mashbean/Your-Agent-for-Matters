import { mkdir, writeFile } from "node:fs/promises";
import { Wallet } from "ethers";
import path from "node:path";
import {
  loadJson,
  saveJson,
  uploadAsset,
  updateUserProfile,
  putMoment,
  putMomentComment,
  walletSignupWithWallet,
  walletLoginWithWallet
} from "../../packages/core/src/index.mjs";
import { createOpenAIProvider } from "../../packages/providers-openai/src/index.mjs";

const endpoint = process.env.MATTERS_GRAPHQL_ENDPOINT || "https://server.matters.town/graphql";
const provider = createOpenAIProvider({
  apiKey: process.env.OPENAI_API_KEY,
  textModel: process.env.OPENAI_TEXT_MODEL || "gpt-5.2",
  imageModel: process.env.OPENAI_IMAGE_MODEL || "gpt-image-1"
});

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

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildConversationPrompt(config) {
  const accounts = config.accounts.map((account) => `- ${account.key}：${account.display_name}`).join("\n");
  const firstSpeaker = config.accounts[0]?.key || "speaker_a";
  const secondSpeaker = config.accounts[1]?.key || "speaker_b";
  const poster = config.accounts[config.accounts.length - 1]?.key || firstSpeaker;
  return [
    "你在替 Matters 平台做一個明確揭露的 AI agent 壓力測試。",
    "所有帳號都知道彼此是 AI 測試帳號，但對話內容要自然、有性格、不要官腔。",
    `角色列表：\n${accounts}`,
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

function buildConversationSchema(accountKeys, commentCount) {
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

async function generateImageFile({ prompt, outputPath, size }) {
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

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  const configPath = path.resolve(flags.config || "./examples/agent-stress-test/accounts.example.json");
  const outDir = path.resolve(flags.out || "./tmp/agent-stress-test-run");
  const commentDelayMs = Number(flags["comment-delay-ms"] || 0);
  const config = await loadJson(configPath);

  await mkdir(outDir, { recursive: true });
  await mkdir(path.join(outDir, "wallets"), { recursive: true });
  await mkdir(path.join(outDir, "assets"), { recursive: true });

  const accountStates = {};
  for (const account of config.accounts) {
    const walletPath = path.join(outDir, "wallets", `${account.key}.json`);
    const wallet = Wallet.createRandom();
    await writeFile(walletPath, JSON.stringify({
      address: wallet.address,
      private_key_hex: wallet.privateKey,
      created_at: new Date().toISOString(),
      network_family: "evm",
      intended_network: "optimism"
    }, null, 2));
    const signup = await walletSignupWithWallet({
      endpoint,
      walletPath,
      userName: account.handle
    });
    const auth = await walletLoginWithWallet({ endpoint, walletPath });

    const avatarPath = path.join(outDir, "assets", `${account.key}-avatar.png`);
    const bannerPath = path.join(outDir, "assets", `${account.key}-banner.png`);
    await generateImageFile({ prompt: account.avatar_prompt, outputPath: avatarPath, size: "1024x1024" });
    await generateImageFile({ prompt: account.banner_prompt, outputPath: bannerPath, size: "1536x1024" });

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
    posted.push({
      index: index + 1,
      speaker: item.speaker,
      comment_id: comment.id,
      content: item.content
    });
    if (commentDelayMs > 0 && index < conversation.comments.length - 1) {
      await sleep(commentDelayMs);
    }
  }

  const report = {
    endpoint,
    config_path: configPath,
    out_dir: outDir,
    moment,
    conversation,
    posted,
    accounts: Object.fromEntries(
      Object.entries(accountStates).map(([key, value]) => [key, {
        display_name: value.display_name,
        handle: value.handle,
        user: value.auth.user,
        wallet_path: value.wallet_path,
        bio: value.bio,
        avatar_path: value.avatar_path,
        banner_path: value.banner_path
      }])
    )
  };

  await saveJson(path.join(outDir, "stress-results.json"), report);
  console.log(JSON.stringify({
    out_dir: outDir,
    moment,
    comment_count: posted.length,
    accounts: Object.fromEntries(Object.entries(accountStates).map(([key, value]) => [key, {
      display_name: value.display_name,
      handle: value.handle
    }]))
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
