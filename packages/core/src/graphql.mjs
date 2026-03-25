import { assertTrustedUrl, env, parseHostList, toBoolean, toSafeString } from "./utils.mjs";

export function buildGraphqlHeaders({ token = "", operationName = "" } = {}) {
  const headers = {
    "content-type": "application/json"
  };
  if (operationName) headers["x-apollo-operation-name"] = operationName;
  if (token) {
    headers["x-access-token"] = token;
    headers.authorization = `Bearer ${token}`;
  }
  return headers;
}

function summarizeGraphqlErrors(errors) {
  return errors
    .map((item) => {
      const message = toSafeString(item?.message);
      const code = toSafeString(item?.extensions?.code);
      return code ? `${code} ${message}`.trim() : message;
    })
    .filter(Boolean)
    .join(" | ");
}

function resolveTrustedMattersEndpoint(endpoint, allowUnsafeEndpoint = false) {
  return assertTrustedUrl(endpoint, {
    label: "Matters endpoint",
    allowedHosts: parseHostList(env("MATTERS_ALLOWED_HOSTS", ""), ["server.matters.town"]),
    allowUnsafe: allowUnsafeEndpoint || toBoolean(env("MATTERS_ALLOW_UNSAFE_ENDPOINT", ""), false)
  });
}

export async function callGraphql({
  endpoint,
  query,
  variables = {},
  token = "",
  operationName = "MattersOperation",
  allowUnsafeEndpoint = false
}) {
  const safeEndpoint = resolveTrustedMattersEndpoint(endpoint, allowUnsafeEndpoint);
  const response = await fetch(safeEndpoint, {
    method: "POST",
    headers: buildGraphqlHeaders({ token, operationName }),
    body: JSON.stringify({ query, variables })
  });

  if (!response.ok) {
    throw new Error(`graphql request failed: ${response.status} ${response.statusText}`);
  }

  const payload = await response.json();
  if (Array.isArray(payload.errors) && payload.errors.length > 0) {
    throw new Error(`graphql returned errors: ${summarizeGraphqlErrors(payload.errors)}`);
  }

  return payload.data || {};
}

export function createRateLimitAwareExecutor({ retries = 4, delayMs = 65000 } = {}) {
  return async function execute(task, label = "graphql-operation") {
    let lastError = null;
    for (let attempt = 1; attempt <= retries; attempt += 1) {
      try {
        return await task(attempt);
      } catch (error) {
        lastError = error;
        const message = toSafeString(error?.message);
        const retryable = message.includes("ACTION_LIMIT_EXCEEDED") || message.includes("rate exceeded");
        if (!retryable || attempt >= retries) throw error;
        console.log(`${label} rate limited on attempt ${attempt}, wait ${delayMs}ms`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
    throw lastError;
  };
}
