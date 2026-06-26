#!/usr/bin/env node
/**
 * Compara migraciones locales vs remoto y muestra pendientes de aplicar.
 * Uso: npm run db:status
 */
import {
  requireAuth,
  supabaseApi,
  listLocalMigrations,
  migrationNameFromFile,
} from "./_lib.mjs";

const { token, ref } = requireAuth();

const remote = await supabaseApi(ref, token, "/database/migrations");
const applied = Array.isArray(remote) ? remote : remote?.migrations ?? [];

const appliedNames = new Set(
  applied.map((m) => {
    const n = String(m.name ?? m.version ?? "").toLowerCase();
    return n;
  })
);

const local = listLocalMigrations();
const pending = [];

for (const m of local) {
  const base = migrationNameFromFile(m.file).toLowerCase();
  const found = [...appliedNames].some(
    (r) => r === base || r.endsWith(base) || base.endsWith(r)
  );
  if (!found) pending.push(m.file);
}

console.log(`Proyecto: ${ref}\n`);
console.log(`Local: ${local.length}  |  Remoto: ${applied.length} aplicadas\n`);

if (pending.length === 0) {
  console.log("✓ No hay migraciones locales pendientes de aplicar.");
} else {
  console.log(`⚠ Pendientes (${pending.length}) — aplicar con npm run db:apply -- <archivo>`);
  for (const f of pending) console.log(`  • ${f}`);
}

const orphanRemote = applied
  .map((m) => m.name ?? m.version)
  .filter(Boolean)
  .filter((name) => {
    const n = String(name).toLowerCase();
    return !local.some((m) => {
      const base = migrationNameFromFile(m.file).toLowerCase();
      return base === n || base.endsWith(n) || n.endsWith(base);
    });
  });

if (orphanRemote.length > 0) {
  console.log(`\nℹ Solo en remoto (${orphanRemote.length}) — histórico o aplicadas fuera del repo:`);
  for (const n of orphanRemote) console.log(`  • ${n}`);
}

process.exit(pending.length > 0 ? 2 : 0);
