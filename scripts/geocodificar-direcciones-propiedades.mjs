#!/usr/bin/env node
/**
 * Geocodifica direcciones postales desde el título operativo.
 * Solo actualiza `direccion`; nunca modifica `titulo`.
 *
 * Uso:
 *   node scripts/geocodificar-direcciones-propiedades.mjs --dry-run
 *   node scripts/geocodificar-direcciones-propiedades.mjs
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const BIAS_LAT = 41.36;
const BIAS_LON = 2.1;
const DELAY_MS = 1100;

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

function geocodeQueryFromTitulo(titulo) {
  const raw = titulo.trim();
  if (!raw) return "";

  const isLH = /\s+L\s*['\u2019]?\s*H\s*$/i.test(raw);
  let q = raw.replace(/\s+L\s*['\u2019]?\s*H\s*$/i, "");
  q = q.replace(/\s+ESC\s+\d+.*$/i, "");
  q = q.replace(/\s+BJOS\s+.*$/i, "");
  q = q.replace(/\s+BAJOS\s+.*$/i, "");
  q = q.replace(/\s+\d+\s*º\s*.*$/i, "");
  q = q.replace(/\s+(AT|BAJOS|PRAL|SOB AT|ENT|ENTLO)\s+.*$/i, "");
  q = q.replace(/\s+/g, " ").trim();

  if (!q) return "";

  const city = isLH ? "L'Hospitalet de Llobregat, España" : "Barcelona, España";
  return `${q}, ${city}`;
}

function formatPhotonProperties(props) {
  const parts = [];
  if (props.street) {
    parts.push(props.housenumber ? `${props.street}, ${props.housenumber}` : props.street);
  } else if (props.name) {
    parts.push(props.name);
  }
  const city = props.city || props.locality || props.town || props.municipality;
  if (city) parts.push(city);
  return parts.join(", ");
}

async function photonSearch(q) {
  const url = new URL("https://photon.komoot.io/api/");
  url.searchParams.set("q", q);
  url.searchParams.set("lang", "default");
  url.searchParams.set("limit", "1");
  url.searchParams.set("lat", String(BIAS_LAT));
  url.searchParams.set("lon", String(BIAS_LON));

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Photon ${res.status}`);
  const data = await res.json();
  const feature = data.features?.[0];
  if (!feature) return null;
  const label = formatPhotonProperties(feature.properties ?? {});
  return label || null;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

loadEnv();

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE;
const dryRun = process.argv.includes("--dry-run");

if (!url || !key) {
  console.error("Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE");
  process.exit(1);
}

const headers = {
  apikey: key,
  Authorization: `Bearer ${key}`,
  "Content-Type": "application/json",
  Prefer: "return=minimal",
};

const listRes = await fetch(
  `${url}/rest/v1/propiedades?tipo=eq.inversion&select=id,titulo,direccion&order=titulo.asc`,
  { headers: { apikey: key, Authorization: `Bearer ${key}` } }
);
if (!listRes.ok) {
  console.error(await listRes.text());
  process.exit(1);
}

const rows = await listRes.json();
let updated = 0;
let skipped = 0;
let failed = 0;

for (const row of rows) {
  const query = geocodeQueryFromTitulo(row.titulo ?? "");
  if (!query) {
    console.log(`⊘ ${row.titulo} — sin consulta geocodable`);
    skipped++;
    continue;
  }

  await sleep(DELAY_MS);
  let next;
  try {
    next = await photonSearch(query);
  } catch (e) {
    console.log(`✗ ${row.titulo} — error: ${e.message}`);
    failed++;
    continue;
  }

  if (!next) {
    console.log(`? ${row.titulo} — sin resultado (${query})`);
    failed++;
    continue;
  }

  if (row.direccion?.trim() === next) {
    skipped++;
    continue;
  }

  console.log(`• ${row.titulo}`);
  console.log(`  consulta: ${query}`);
  console.log(`  antes: ${row.direccion?.trim() || "(vacío)"}`);
  console.log(`  después: ${next}`);

  if (!dryRun) {
    const patchRes = await fetch(`${url}/rest/v1/propiedades?id=eq.${row.id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ direccion: next }),
    });
    if (!patchRes.ok) {
      console.error("  ERROR:", await patchRes.text());
      process.exit(1);
    }
  }
  updated++;
}

console.log(
  `\n${dryRun ? "[dry-run] " : ""}Total: ${rows.length} | actualizadas: ${updated} | omitidas: ${skipped} | sin resultado: ${failed}`
);
