#!/usr/bin/env node
/**
 * Aplica una migración local al proyecto remoto (Management API).
 * Uso: npm run db:apply -- 20260615120000_propiedades_superficies.sql
 *      npm run db:apply -- 20260615120000_propiedades_superficies.sql --dry-run
 */
import fs from "node:fs";
import path from "node:path";
import {
  requireAuth,
  supabaseApi,
  MIGRATIONS_DIR,
  migrationNameFromFile,
} from "./_lib.mjs";

const args = process.argv.slice(2).filter((a) => a !== "--");
const dryRun = args.includes("--dry-run");
const fileArg = args.find((a) => !a.startsWith("--"));

if (!fileArg) {
  console.error(
    "Uso: npm run db:apply -- <archivo.sql> [--dry-run]\n" +
      "Ejemplo: npm run db:apply -- 20260615120000_propiedades_superficies.sql"
  );
  process.exit(1);
}

const filename = fileArg.endsWith(".sql") ? fileArg : `${fileArg}.sql`;
const filePath = path.join(MIGRATIONS_DIR, filename);

if (!fs.existsSync(filePath)) {
  console.error(`No existe: ${filePath}`);
  process.exit(1);
}

const query = fs.readFileSync(filePath, "utf8").trim();
if (!query) {
  console.error("El archivo SQL está vacío.");
  process.exit(1);
}

const name = migrationNameFromFile(filename);
const { token, ref } = requireAuth();

if (dryRun) {
  console.log(`[dry-run] Proyecto: ${ref}`);
  console.log(`[dry-run] Migración: ${name}`);
  console.log(`[dry-run] ${query.length} caracteres SQL\n`);
  console.log(query.slice(0, 800) + (query.length > 800 ? "\n…" : ""));
  process.exit(0);
}

console.log(`Aplicando ${filename} en ${ref}…`);

await supabaseApi(ref, token, "/database/migrations", {
  method: "POST",
  body: { name, query },
});

console.log(`✓ Migración aplicada: ${name}`);
console.log("  Verifica con: npm run db:status");
