import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const MIGRATIONS_DIR = path.join(ROOT, "supabase/migrations");
const BACKUPS_DIR = path.join(ROOT, "supabase/backups");
const PROJECT_REF_FILE = path.join(ROOT, "supabase/.project-ref");

export { ROOT, MIGRATIONS_DIR, BACKUPS_DIR };

export function loadEnv() {
  const env = { ...process.env };
  const envPath = path.join(ROOT, ".env");
  if (!fs.existsSync(envPath)) return env;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const key = t.slice(0, i).trim();
    let val = t.slice(i + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!(key in env)) env[key] = val;
  }
  return env;
}

export function getProjectRef(env = loadEnv()) {
  return (
    env.SUPABASE_PROJECT_REF?.trim() ||
    (fs.existsSync(PROJECT_REF_FILE)
      ? fs.readFileSync(PROJECT_REF_FILE, "utf8").trim()
      : "") ||
    null
  );
}

export function getAccessToken(env = loadEnv()) {
  return env.SUPABASE_ACCESS_TOKEN?.trim() || null;
}

export function requireAuth() {
  const env = loadEnv();
  const token = getAccessToken(env);
  const ref = getProjectRef(env);
  if (!token) {
    console.error(
      "Falta SUPABASE_ACCESS_TOKEN en .env\n" +
        "  → https://supabase.com/dashboard/account/tokens (PAT, no la anon key)"
    );
    process.exit(1);
  }
  if (!ref) {
    console.error(
      "Falta SUPABASE_PROJECT_REF en .env o supabase/.project-ref"
    );
    process.exit(1);
  }
  return { token, ref, env };
}

export async function supabaseApi(
  ref,
  token,
  apiPath,
  { method = "GET", body } = {}
) {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${ref}${apiPath}`,
    {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: body != null ? JSON.stringify(body) : undefined,
    }
  );
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    const msg =
      typeof data === "object" && data?.message
        ? data.message
        : typeof data === "string"
          ? data
          : JSON.stringify(data);
    throw new Error(`Supabase API ${res.status}: ${msg}`);
  }
  return data;
}

export function listLocalMigrations() {
  if (!fs.existsSync(MIGRATIONS_DIR)) return [];
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .map((f) => ({
      file: f,
      name: f.replace(/\.sql$/, ""),
      path: path.join(MIGRATIONS_DIR, f),
    }));
}

const ARCHIVE_DIR = path.join(MIGRATIONS_DIR, "_archive");

/** Migraciones históricas (no participan en db:status ni db:apply). */
export function listArchivedMigrations() {
  const dir = path.join(ARCHIVE_DIR, "applied-manually");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();
}

export function migrationNameFromFile(filename) {
  return filename.replace(/\.sql$/, "");
}

export function ensureBackupsDir() {
  fs.mkdirSync(BACKUPS_DIR, { recursive: true });
}

export function timestamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}
