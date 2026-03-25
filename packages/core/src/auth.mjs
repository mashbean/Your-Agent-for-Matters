import { callGraphql } from "./graphql.mjs";
import { env, toBoolean, toSafeString } from "./utils.mjs";

export async function loginWithEmailPassphrase({ endpoint, email, passphrase }) {
  const data = await callGraphql({
    endpoint,
    operationName: "EmailLogin",
    query: `
      mutation EmailLogin($input: EmailLoginInput!) {
        emailLogin(input: $input) {
          auth
          token
          type
          user {
            id
            userName
            displayName
          }
        }
      }
    `,
    variables: {
      input: {
        email,
        passwordOrCode: passphrase
      }
    }
  });
  const token = toSafeString(data?.emailLogin?.token);
  if (!token) throw new Error("emailLogin succeeded without token");
  return {
    mode: "email_passphrase",
    token,
    user: data.emailLogin.user || null,
    operator_follow_up: "使用臨時密碼登入後，應儘快在 Matters 介面完成正式密碼更新。"
  };
}

export async function bootstrapAuth({
  mode,
  endpoint,
  email = "",
  passphrase = "",
  existingToken = "",
  experimentalWalletFirst = false,
  walletPath = ""
}) {
  const resolvedMode = toSafeString(mode || env("MATTERS_AUTH_MODE", "existing_token"));
  if (resolvedMode === "existing_token") {
    const token = toSafeString(existingToken || env("MATTERS_GRAPHQL_TOKEN", ""));
    if (!token) throw new Error("existing_token mode requires token");
    return {
      mode: "existing_token",
      token,
      experimental: false
    };
  }
  if (resolvedMode === "email_passphrase") {
    const resolvedEndpoint = endpoint || env("MATTERS_GRAPHQL_ENDPOINT", "https://server.matters.town/graphql");
    return loginWithEmailPassphrase({
      endpoint: resolvedEndpoint,
      email: email || env("MATTERS_BOT_EMAIL", ""),
      passphrase: passphrase || env("MATTERS_BOT_PASSPHRASE", "")
    });
  }
  if (resolvedMode === "wallet_first_experimental") {
    if (!toBoolean(experimentalWalletFirst, false)) {
      throw new Error("wallet_first_experimental requires --experimental true");
    }
    return {
      mode: "wallet_first_experimental",
      token: "",
      experimental: true,
      wallet_path: walletPath,
      operator_follow_up: "此 lane 目前只定義 contract，不保證 Matters 端有穩定 create-account API。"
    };
  }
  throw new Error(`unsupported auth mode: ${resolvedMode}`);
}
