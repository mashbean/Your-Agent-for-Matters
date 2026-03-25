import path from "node:path";
import { readFile } from "node:fs/promises";
import { assertTrustedUrl, env, parseHostList, toBoolean, toSafeString } from "./utils.mjs";

function inferMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  if (ext === ".gif") return "image/gif";
  return "application/octet-stream";
}

export async function uploadAsset({
  endpoint,
  token,
  filePath,
  assetType,
  entityType,
  entityId,
  allowUnsafeEndpoint = false
}) {
  const safeEndpoint = assertTrustedUrl(endpoint, {
    label: "Matters endpoint",
    allowedHosts: parseHostList(env("MATTERS_ALLOWED_HOSTS", ""), ["server.matters.town"]),
    allowUnsafe: allowUnsafeEndpoint || toBoolean(env("MATTERS_ALLOW_UNSAFE_ENDPOINT", ""), false)
  });
  const fileBuffer = await readFile(filePath);
  const fileName = path.basename(filePath);
  const mimeType = inferMimeType(filePath);
  const operations = {
    query: `
      mutation SingleFileUpload($input: SingleFileUploadInput!) {
        singleFileUpload(input: $input) {
          id
          type
          path
          uploadURL
        }
      }
    `,
    variables: {
      input: {
        type: assetType,
        file: null,
        entityType,
        entityId
      }
    }
  };

  const form = new FormData();
  form.set("operations", JSON.stringify(operations));
  form.set("map", JSON.stringify({ "0": ["variables.input.file"] }));
  form.set("0", new Blob([fileBuffer], { type: mimeType }), fileName);

  const response = await fetch(safeEndpoint, {
    method: "POST",
    headers: {
      "x-access-token": token,
      authorization: `Bearer ${token}`,
      "x-apollo-operation-name": "SingleFileUpload",
      "apollo-require-preflight": "true"
    },
    body: form
  });
  if (!response.ok) {
    const body = toSafeString(await response.text()).replace(/\s+/g, " ").trim().slice(0, 240);
    throw new Error(`singleFileUpload failed: ${response.status} ${response.statusText}${body ? ` ${body}` : ""}`);
  }
  const payload = await response.json();
  if (Array.isArray(payload.errors) && payload.errors.length > 0) {
    throw new Error(
      `singleFileUpload returned errors: ${payload.errors.map((item) => toSafeString(item?.message)).filter(Boolean).join(" | ")}`
    );
  }
  return payload.data.singleFileUpload;
}
