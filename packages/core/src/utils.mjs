import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export function toSafeString(value) {
  if (value == null) return "";
  return String(value);
}

export function toBoolean(value, fallback = false) {
  if (typeof value === "boolean") return value;
  const normalized = toSafeString(value).trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return fallback;
}

export function stripHtml(value) {
  return toSafeString(value).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export function escapeHtml(value) {
  return toSafeString(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function sanitizeHttpUrl(value) {
  const parsed = new URL(toSafeString(value));
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error(`unsupported url protocol: ${parsed.protocol}`);
  }
  return parsed.toString();
}

export function parseHostList(value, fallback = []) {
  const list = toSafeString(value)
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  return list.length > 0 ? list : fallback;
}

export function assertTrustedUrl(url, {
  label = "endpoint",
  allowedHosts = [],
  allowUnsafe = false
} = {}) {
  const parsed = new URL(toSafeString(url));
  if (allowUnsafe) return parsed.toString();
  if (parsed.protocol !== "https:") {
    throw new Error(`${label} must use https`);
  }
  if (allowedHosts.length > 0 && !allowedHosts.includes(parsed.hostname.toLowerCase())) {
    throw new Error(`${label} host is not allowlisted: ${parsed.hostname}`);
  }
  return parsed.toString();
}

export function env(name, fallback = "") {
  return typeof process.env[name] === "string" && process.env[name].length > 0
    ? process.env[name]
    : fallback;
}

export function redactSecret(value, visible = 4) {
  const text = toSafeString(value);
  if (!text) return "";
  if (text.length <= visible * 2) return "[redacted]";
  return `${text.slice(0, visible)}…${text.slice(-visible)}`;
}

export function redactAuthResult(result) {
  if (!result || typeof result !== "object") return result;
  const token = toSafeString(result.token);
  return {
    ...result,
    ...(token
      ? {
          token: "[redacted]",
          token_present: true
        }
      : {})
  };
}

export async function loadJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

export async function saveJson(filePath, payload) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}
