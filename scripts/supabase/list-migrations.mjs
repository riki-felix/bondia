#!/usr/bin/env node
/**
 * Lista migraciones aplicadas en Supabase remoto (Management API).
 * Uso: npm run db:migrations
 */
import {
  requireAuth,
  supabaseApi,
  listLocalMigrations,
} from "./_lib.mjs";

const { token, ref } = requireAuth();

const remote = await supabaseApi(ref, token, "/database/migrations");
const applied = Array.isArray(remote) ? remote : remote?.migrations ?? [];

console.log(`Proyecto: ${ref}`);
console.log(`\nRemoto (${applied.length} aplicadas):`);
for (const m of applied) {
  const name = m.name ?? m.version ?? m.id ?? JSON.stringify(m);
  const at = m.inserted_at ?? m.applied_at ?? "";
  console.log(`  • ${name}${at ? `  (${at})` : ""}`);
}

const local = listLocalMigrations();
console.log(`\nLocal (${local.length} archivos en supabase/migrations/):`);
for (const m of local) {
  console.log(`  • ${m.file}`);
}
