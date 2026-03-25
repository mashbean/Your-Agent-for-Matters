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

export function env(name, fallback = "") {
  return typeof process.env[name] === "string" && process.env[name].length > 0
    ? process.env[name]
    : fallback;
}

export async function loadJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

export async function saveJson(filePath, payload) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}
