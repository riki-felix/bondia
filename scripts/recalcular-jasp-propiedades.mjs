#!/usr/bin/env node
/**
 * Recalcula jasp_10_percent con la fórmula actual:
 *   bruto = Σ (retribución × 100 / % Sanyus) por liquidación
 *   JASP  = bruto × % JASP de la ficha
 *
 * Solo propiedades con jasp_manual = false.
 *
 * Uso:
 *   node scripts/recalcular-jasp-propiedades.mjs --dry-run
 *   node scripts/recalcular-jasp-propiedades.mjs
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const DEFAULT_SANYUS = 40;
const DEFAULT_JASP = 20;

function loadEnv() {
  const path = resolve(process.cwd(), ".env");
  const text = readFileSync(path, "utf8");
  for (const line of text.split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (!m) continue;
    const key = m[1].trim();
    const val = m[2].trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

function toNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function effectiveSanyus(v) {
  return v != null && Number.isFinite(Number(v)) ? Number(v) : DEFAULT_SANYUS;
}

function effectiveJasp(v) {
  return v != null && Number.isFinite(Number(v)) ? Number(v) : DEFAULT_JASP;
}

function brutoFromRetribucion(retribucion, pctSanyus) {
  if (pctSanyus <= 0 || retribucion <= 0) return 0;
  return round2((retribucion * 100) / pctSanyus);
}

function jaspFromBruto(bruto, pctJasp) {
  return round2(bruto * (pctJasp / 100));
}

function formatEuro(n) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(n);
}

loadEnv();

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE;
const dryRun = process.argv.includes("--dry-run");

if (!url || !key) {
  console.error("Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE en .env");
  process.exit(1);
}

const authHeaders = {
  apikey: key,
  Authorization: `Bearer ${key}`,
};

const patchHeaders = {
  ...authHeaders,
  "Content-Type": "application/json",
  Prefer: "return=minimal",
};

async function fetchJson(path) {
  const res = await fetch(`${url}/rest/v1/${path}`, { headers: authHeaders });
  if (!res.ok) throw new Error(`${path}: ${res.status} ${await res.text()}`);
  return res.json();
}

async function patch(table, filter, body) {
  const res = await fetch(`${url}/rest/v1/${table}?${filter}`, {
    method: "PATCH",
    headers: patchHeaders,
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${table} PATCH: ${res.status} ${await res.text()}`);
}

const props = await fetchJson(
  "propiedades?tipo=eq.inversion&select=id,numero_operacion,titulo,participacion_sanyus,participacion_jasp,jasp_manual,jasp_10_percent,retribucion,ingreso_banco&order=numero_operacion.asc"
);

const liqs = await fetchJson(
  "liquidaciones?select=id,propiedad_id,retribucion,beneficio_bruto"
);

const liqsByProp = new Map();
for (const liq of liqs) {
  const list = liqsByProp.get(liq.propiedad_id) ?? [];
  list.push(liq);
  liqsByProp.set(liq.propiedad_id, list);
}

let updated = 0;
let unchanged = 0;
let manual = 0;
let empty = 0;
let failed = 0;

console.log(
  dryRun
    ? "Modo dry-run — no se escribirá en la BD\n"
    : "Recalculando JASP en la BD…\n"
);

for (const prop of props) {
  const label =
    prop.numero_operacion != null
      ? `#${prop.numero_operacion} ${prop.titulo ?? ""}`.trim()
      : prop.titulo ?? prop.id;

  if (prop.jasp_manual === true) {
    manual++;
    continue;
  }

  const pctSanyus = effectiveSanyus(prop.participacion_sanyus);
  const pctJasp = effectiveJasp(prop.participacion_jasp);
  const propLiqs = liqsByProp.get(prop.id) ?? [];

  let totalBruto = 0;
  let totalRetribucion = 0;
  const liqUpdates = [];

  for (const liq of propLiqs) {
    const retribucion = toNum(liq.retribucion);
    totalRetribucion += retribucion;
    const bruto = brutoFromRetribucion(retribucion, pctSanyus);
    totalBruto += bruto;
    const brutoRounded = round2(bruto);
    if (toNum(liq.beneficio_bruto) !== brutoRounded) {
      liqUpdates.push({ id: liq.id, beneficio_bruto: brutoRounded });
    }
  }

  totalRetribucion = round2(totalRetribucion);
  totalBruto = round2(totalBruto);

  if (totalBruto <= 0) {
    empty++;
    continue;
  }

  const newJasp = jaspFromBruto(totalBruto, pctJasp);
  const oldJasp = round2(toNum(prop.jasp_10_percent));
  const oldRetribucion = round2(toNum(prop.retribucion));
  const retribChanged = oldRetribucion !== totalRetribucion;
  const jaspChanged = oldJasp !== newJasp;

  if (!jaspChanged && !retribChanged && liqUpdates.length === 0) {
    unchanged++;
    continue;
  }

  const oldJaspFromIngreso = round2(toNum(prop.ingreso_banco) * 0.1);
  const looksLegacy =
    oldJasp > 0 && Math.abs(oldJasp - oldJaspFromIngreso) < 0.02;

  console.log(`• ${label}`);
  console.log(
    `  bruto ${formatEuro(totalBruto)} · retribución ${formatEuro(totalRetribucion)}`
  );
  if (jaspChanged) {
    console.log(
      `  JASP: ${formatEuro(oldJasp)} → ${formatEuro(newJasp)} (${pctJasp}% del bruto)${
        looksLegacy ? " [antes ≈ 10% ingreso banco]" : ""
      }`
    );
  }
  if (retribChanged) {
    console.log(
      `  retribución propiedad: ${formatEuro(oldRetribucion)} → ${formatEuro(totalRetribucion)}`
    );
  }
  if (liqUpdates.length > 0) {
    console.log(`  liquidaciones bruto actualizadas: ${liqUpdates.length}`);
  }

  if (dryRun) {
    updated++;
    continue;
  }

  try {
    for (const u of liqUpdates) {
      await patch("liquidaciones", `id=eq.${u.id}`, {
        beneficio_bruto: u.beneficio_bruto,
      });
    }
    await patch("propiedades", `id=eq.${prop.id}`, {
      retribucion: totalRetribucion,
      jasp_10_percent: newJasp,
      jasp_manual: false,
    });
    updated++;
  } catch (e) {
    console.error(`  ERROR: ${e.message}`);
    failed++;
  }
}

console.log(
  `\n${dryRun ? "[dry-run] " : ""}Resumen: ${props.length} inversiones | ` +
    `actualizadas: ${updated} | sin cambios: ${unchanged} | manual: ${manual} | ` +
    `sin bruto: ${empty} | errores: ${failed}`
);

if (failed > 0) process.exit(1);
