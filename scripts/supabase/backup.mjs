#!/usr/bin/env node
/**
 * Genera backup SQL del esquema + datos (requiere Supabase CLI vinculado).
 * Uso: npm run db:backup
 *
 * Primera vez:
 *   1. brew install supabase/tap/supabase
 *   2. supabase login
 *   3. supabase link --project-ref $(cat supabase/.project-ref)
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import {
  getProjectRef,
  loadEnv,
  ensureBackupsDir,
  BACKUPS_DIR,
  timestamp,
  ROOT,
} from "./_lib.mjs";

function hasCli() {
  const r = spawnSync("supabase", ["--version"], { encoding: "utf8" });
  return r.status === 0;
}

function isLinked() {
  return fs.existsSync(path.join(ROOT, "supabase/.temp/project-ref"));
}

ensureBackupsDir();
const outFile = path.join(BACKUPS_DIR, `bondia-${timestamp()}.sql`);

if (!hasCli()) {
  console.error(
    "Supabase CLI no encontrado.\n" +
      "  Instalar: https://supabase.com/docs/guides/cli/getting-started\n" +
      "  macOS: brew install supabase/tap/supabase"
  );
  process.exit(1);
}

const env = loadEnv();
const ref = getProjectRef(env);

const dumpArgs = isLinked()
  ? ["db", "dump", "--linked", "-f", outFile]
  : ref
    ? ["db", "dump", "--project-ref", ref, "-f", outFile]
    : ["db", "dump", "-f", outFile];

console.log(`Backup → ${outFile}`);
const result = spawnSync("supabase", dumpArgs, {
  cwd: ROOT,
  stdio: "inherit",
  env: { ...process.env, ...env },
});

if (result.status !== 0) {
  console.error("\nSi falla el enlace, ejecuta una vez:");
  console.error("  supabase login");
  console.error(`  supabase link --project-ref ${ref ?? "<ref>"}`);
  console.error("\nAlternativa: Dashboard → Database → Backups (planes con PITR).");
  process.exit(result.status ?? 1);
}

const stat = fs.statSync(outFile);
console.log(`\n✓ Backup listo (${(stat.size / 1024).toFixed(1)} KB)`);
console.log(`  ${outFile}`);
console.log("  (no commitear — supabase/backups/ está en .gitignore)");
