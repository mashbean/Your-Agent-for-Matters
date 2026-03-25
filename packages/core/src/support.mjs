import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { callGraphql } from "./graphql.mjs";
import { toSafeString } from "./utils.mjs";

export async function loadWalletSecret(walletPath) {
  const payload = JSON.parse(await readFile(walletPath, "utf8"));
  const address = toSafeString(payload.address);
  const privateKeyHex = toSafeString(payload.private_key_hex);
  if (!address || !privateKeyHex) {
    throw new Error("wallet secret file must contain address and private_key_hex");
  }
  return {
    address,
    privateKeyHex,
    createdAt: toSafeString(payload.created_at),
    networkFamily: toSafeString(payload.network_family),
    intendedNetwork: toSafeString(payload.intended_network)
  };
}

export async function fetchViewerWalletState({ endpoint, token }) {
  const data = await callGraphql({
    endpoint,
    token,
    operationName: "ViewerWalletState",
    query: `
      query ViewerWalletState {
        viewer {
          id
          userName
          displayName
          info {
            ethAddress
            isWalletAuth
            cryptoWallet {
              id
              address
              hasNFTs
            }
          }
        }
      }
    `,
    variables: {}
  });
  return data.viewer;
}

export async function createBindWalletPreview({ endpoint, token, walletPath }) {
  const wallet = await loadWalletSecret(walletPath);
  const viewer = await fetchViewerWalletState({ endpoint, token });
  const currentAddress = toSafeString(viewer?.info?.ethAddress).toLowerCase();
  const alreadyBound = currentAddress && currentAddress === wallet.address.toLowerCase();
  return {
    run_id: `bind-wallet-${randomUUID()}`,
    status: alreadyBound ? "already_bound" : "preview_ready",
    wallet: {
      address: wallet.address,
      intended_network: wallet.intendedNetwork,
      network_family: wallet.networkFamily,
      created_at: wallet.createdAt
    },
    viewer: {
      id: viewer?.id || "",
      user_name: viewer?.userName || "",
      display_name: viewer?.displayName || "",
      eth_address: toSafeString(viewer?.info?.ethAddress),
      is_wallet_auth: Boolean(viewer?.info?.isWalletAuth),
      crypto_wallet_address: toSafeString(viewer?.info?.cryptoWallet?.address)
    },
    next_steps: alreadyBound
      ? ["wallet already linked on Matters"]
      : [
          "generate signing message with purpose connect",
          "sign message with local wallet private key",
          "submit AddWalletLogin mutation",
          "verify viewer wallet state reflects the linked address"
        ]
  };
}

export function createOfficialSupportPlan({
  articleId,
  recipientWalletAddress,
  amount,
  currency = "USDT",
  chain = "optimism"
}) {
  if (!articleId) throw new Error("articleId is required");
  if (!recipientWalletAddress) throw new Error("recipientWalletAddress is required");
  return {
    run_id: `support-${randomUUID()}`,
    status: "preview_ready",
    settlement_mode: "optimism_usdt_official_curate_payto",
    article_id: articleId,
    recipient_wallet_address: recipientWalletAddress,
    amount,
    currency,
    chain,
    phases: [
      "payTo init",
      "wallet approves and curates on Optimism",
      "payTo complete with transaction id and tx hash"
    ]
  };
}
