import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { callGraphql } from "./graphql.mjs";
import { env, toSafeString } from "./utils.mjs";

async function signMessageWithEthers({ walletPath, signingMessage }) {
  const { Wallet } = await import("ethers");
  const wallet = await loadWalletSecret(walletPath);
  const signer = new Wallet(wallet.privateKeyHex);
  const signature = await signer.signMessage(signingMessage);
  return {
    signature: normalizeEthereumSignature(signature),
    derivedAddress: signer.address
  };
}

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

export function normalizeEthereumSignature(signature) {
  const normalized = toSafeString(signature).startsWith("0x")
    ? toSafeString(signature).slice(2)
    : toSafeString(signature);
  if (normalized.length !== 130) {
    throw new Error("wallet signer returned unexpected signature length");
  }

  const recoveryByte = normalized.slice(-2).toLowerCase();
  const body = normalized.slice(0, -2);

  if (recoveryByte === "1b") return `0x${body}00`;
  if (recoveryByte === "1c") return `0x${body}01`;
  if (recoveryByte === "00" || recoveryByte === "01") return `0x${normalized}`;

  throw new Error(`wallet signer returned unsupported recovery byte ${recoveryByte}`);
}

export async function signMessageWithPython({
  walletPath,
  signingMessage,
  pythonPath = env("MATTERS_WALLET_PYTHON", "python3"),
  pythonDepsPath = env("MATTERS_WALLET_ETH_ACCOUNT_PYTHONPATH", "")
}) {
  const pythonSource = `
import json
import sys
from pathlib import Path

wallet_path = Path(sys.argv[1])
python_deps = sys.argv[2]
if python_deps:
    sys.path.insert(0, python_deps)

from eth_account import Account
from eth_account.messages import encode_defunct

wallet = json.loads(wallet_path.read_text())
private_key = wallet["private_key_hex"]
message_text = sys.stdin.read()
signed = Account.sign_message(encode_defunct(text=message_text), private_key=private_key)

print(json.dumps({
    "address": Account.from_key(private_key).address,
    "signature": signed.signature.hex(),
}))
`.trim();

  const subprocess = spawnSync(
    pythonPath,
    ["-c", pythonSource, walletPath, pythonDepsPath],
    {
      input: signingMessage,
      encoding: "utf8",
      env: process.env
    }
  );

  if (subprocess.status !== 0) {
    return signMessageWithEthers({ walletPath, signingMessage });
  }

  const payload = JSON.parse(toSafeString(subprocess.stdout));
  const signature = toSafeString(payload.signature);
  const derivedAddress = toSafeString(payload.address);

  if (!signature || !derivedAddress) {
    throw new Error("wallet signer returned no signature or address");
  }

  return {
    signature: normalizeEthereumSignature(signature),
    derivedAddress
  };
}

export async function generateSigningMessage({ endpoint, address, purpose = "connect" }) {
  const data = await callGraphql({
    endpoint,
    operationName: "GenerateSigningMessage",
    query: `
      mutation GenerateSigningMessage($input: GenerateSigningMessageInput!) {
        generateSigningMessage(input: $input) {
          nonce
          signingMessage
          expiredAt
        }
      }
    `,
    variables: {
      input: {
        address,
        purpose
      }
    }
  });
  const result = data.generateSigningMessage;
  if (!result?.nonce || !result?.signingMessage) {
    throw new Error("generateSigningMessage returned no nonce or signingMessage");
  }
  return result;
}

export async function walletLogin({
  endpoint,
  ethAddress,
  signedMessage,
  signature,
  nonce,
  referralCode = "",
  language = ""
}) {
  const data = await callGraphql({
    endpoint,
    operationName: "WalletLogin",
    query: `
      mutation WalletLogin($input: WalletLoginInput!) {
        walletLogin(input: $input) {
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
        ethAddress,
        signedMessage,
        signature,
        nonce,
        ...(referralCode ? { referralCode } : {}),
        ...(language ? { language } : {})
      }
    }
  });
  const result = data.walletLogin;
  const token = toSafeString(result?.token);
  if (!token) throw new Error("walletLogin succeeded without token");
  return result;
}

export async function setUserName({ endpoint, token, userName }) {
  const data = await callGraphql({
    endpoint,
    token,
    operationName: "SetUserName",
    query: `
      mutation SetUserName($input: SetUserNameInput!) {
        setUserName(input: $input) {
          id
          userName
          displayName
        }
      }
    `,
    variables: {
      input: {
        userName
      }
    }
  });
  return data.setUserName;
}

export async function setEmail({ endpoint, token, email }) {
  const data = await callGraphql({
    endpoint,
    token,
    operationName: "SetEmail",
    query: `
      mutation SetEmail($input: SetEmailInput!) {
        setEmail(input: $input) {
          id
          userName
          displayName
          info {
            email
            emailVerified
          }
        }
      }
    `,
    variables: {
      input: {
        email
      }
    }
  });
  return data.setEmail;
}

export async function sendVerificationCode({
  endpoint,
  token = "",
  email,
  type = "email_verify",
  redirectUrl = "",
  language = ""
}) {
  const data = await callGraphql({
    endpoint,
    token,
    operationName: "SendVerificationCode",
    query: `
      mutation SendVerificationCode($input: SendVerificationCodeInput!) {
        sendVerificationCode(input: $input)
      }
    `,
    variables: {
      input: {
        email,
        type,
        ...(redirectUrl ? { redirectUrl } : {}),
        ...(language ? { language } : {})
      }
    }
  });
  return data.sendVerificationCode;
}

export async function setPassword({ endpoint, token, password }) {
  const data = await callGraphql({
    endpoint,
    token,
    operationName: "SetPassword",
    query: `
      mutation SetPassword($input: SetPasswordInput!) {
        setPassword(input: $input) {
          id
          userName
          displayName
        }
      }
    `,
    variables: {
      input: {
        password
      }
    }
  });
  return data.setPassword;
}

export async function walletLoginWithWallet({
  endpoint,
  walletPath,
  purpose = "connect",
  referralCode = "",
  language = "",
  pythonPath = "",
  pythonDepsPath = ""
}) {
  const wallet = await loadWalletSecret(walletPath);
  const signing = await generateSigningMessage({
    endpoint,
    address: wallet.address,
    purpose
  });
  const signed = await signMessageWithPython({
    walletPath,
    signingMessage: signing.signingMessage,
    ...(pythonPath ? { pythonPath } : {}),
    ...(pythonDepsPath ? { pythonDepsPath } : {})
  });

  if (signed.derivedAddress.toLowerCase() !== wallet.address.toLowerCase()) {
    throw new Error("wallet signer derived address does not match wallet secret address");
  }

  const auth = await walletLogin({
    endpoint,
    ethAddress: wallet.address,
    signedMessage: signing.signingMessage,
    signature: signed.signature,
    nonce: signing.nonce,
    referralCode,
    language
  });

  return {
    mode: "wallet_first_experimental",
    experimental: true,
    token: toSafeString(auth.token),
    auth_type: toSafeString(auth.type),
    user: auth.user || null,
    wallet: {
      address: wallet.address,
      created_at: wallet.createdAt,
      intended_network: wallet.intendedNetwork,
      network_family: wallet.networkFamily
    }
  };
}

export async function walletSignupWithWallet({
  endpoint,
  walletPath,
  userName = "",
  email = "",
  sendVerification = true,
  verificationType = "email_verify",
  redirectUrl = "",
  language = "",
  pythonPath = "",
  pythonDepsPath = ""
}) {
  const auth = await walletLoginWithWallet({
    endpoint,
    walletPath,
    language,
    pythonPath,
    pythonDepsPath
  });

  const usernameResult = userName
    ? await setUserName({
        endpoint,
        token: auth.token,
        userName
      })
    : null;

  const emailResult = email
    ? await setEmail({
        endpoint,
        token: auth.token,
        email
      })
    : null;

  const verificationResult = email && sendVerification
    ? await sendVerificationCode({
        endpoint,
        token: auth.token,
        email,
        type: verificationType,
        redirectUrl,
        language
      })
    : null;

  return {
    ...auth,
    user_name_result: usernameResult,
    email_result: emailResult,
    verification_result: verificationResult
  };
}
