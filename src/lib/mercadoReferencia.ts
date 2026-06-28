import type { SupabaseClient } from "@supabase/supabase-js";
import { parsePostalAddress } from "./formatAddress";

export interface MercadoReferenciaItem {
  slug: string;
  fuente: "mitma" | "idealista";
  territorioKey: string;
  etiqueta: string;
  euroM2: number;
  periodo: string;
  updatedAt: string;
}

export interface MercadoReferenciaBundle {
  mitma: {
    espana: MercadoReferenciaItem | null;
    provincias: Record<string, MercadoReferenciaItem>;
  };
  idealista: {
    provincias: Record<string, MercadoReferenciaItem>;
  };
  updatedAt: string | null;
}

/** Municipios habituales en cartera → clave en bondia_mercado_referencia. */
const CIUDAD_A_TERRITORIO: Readonly<Record<string, string>> = {
  barcelona: "BARCELONA",
  "l'hospitalet de llobregat": "BARCELONA",
  "hospitalet de llobregat": "BARCELONA",
  "esplugues de llobregat": "BARCELONA",
  begues: "BARCELONA",
  "el masnou": "BARCELONA",
  badalona: "BARCELONA",
  "sant boi de llobregat": "BARCELONA",
  "santa coloma de gramanet": "BARCELONA",
  "cornella de llobregat": "BARCELONA",
  castelldefels: "BARCELONA",
  "sant cugat del valles": "BARCELONA",
  "sant adria de besos": "BARCELONA",
  "sant joan despi": "BARCELONA",
  "sant just desvern": "BARCELONA",
  "sant feliu de llobregat": "BARCELONA",
  "sant vicenc dels horts": "BARCELONA",
  "montcada i reixac": "BARCELONA",
  "cerdanyola del valles": "BARCELONA",
  "molins de rei": "BARCELONA",
  "palleja": "BARCELONA",
  madrid: "MADRID",
  "alcala de henares": "MADRID",
  alcobendas: "MADRID",
  "mostoles": "MADRID",
  "fuenlabrada": "MADRID",
  getafe: "MADRID",
  leganes: "MADRID",
};

function normalizeCiudadKey(city: string): string {
  return city
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[''`´]/g, "'")
    .toLowerCase()
    .trim();
}

function territorioFromCiudad(city: string): string | null {
  return CIUDAD_A_TERRITORIO[normalizeCiudadKey(city)] ?? null;
}

export function extractProvinciaFromDireccion(direccion: string | null | undefined): string | null {
  if (!direccion?.trim()) return null;

  const match = direccion.match(/\(([^)]+)\)\s*$/);
  if (match) {
    const raw = match[1].trim();
    const upper = raw.toUpperCase();
    if (upper === "BARCELONA" || upper === "MADRID") return upper;
    const fromParen = territorioFromCiudad(raw);
    if (fromParen) return fromParen;
  }

  const { city } = parsePostalAddress(direccion);
  if (city) {
    const fromCity = territorioFromCiudad(city);
    if (fromCity) return fromCity;
  }

  return null;
}

export function resolveMercadoItem(
  fuente: "mitma" | "idealista",
  provincia: string | null,
  bundle: MercadoReferenciaBundle
): MercadoReferenciaItem | null {
  const pool =
    fuente === "mitma"
      ? bundle.mitma.provincias
      : bundle.idealista.provincias;

  if (provincia && pool[provincia]) return pool[provincia];
  if (fuente === "mitma") return bundle.mitma.espana;
  return null;
}

export function computeDiffPctVsMercado(
  nuestroEuroM2: number | null,
  mercadoEuroM2: number | null
): number | null {
  if (nuestroEuroM2 == null || mercadoEuroM2 == null || mercadoEuroM2 <= 0) return null;
  return Math.round(((nuestroEuroM2 - mercadoEuroM2) / mercadoEuroM2) * 100);
}

export function formatMercadoUpdatedAt(iso: string | null): string {
  if (!iso) return "Sin actualizar";
  try {
    return new Date(iso).toLocaleString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

type MercadoReferenciaRow = {
  slug: string;
  fuente: "mitma" | "idealista";
  territorio_key: string;
  etiqueta: string;
  euro_m2: number;
  periodo: string;
  updated_at: string;
};

function mapMercadoRow(row: MercadoReferenciaRow): MercadoReferenciaItem {
  return {
    slug: row.slug,
    fuente: row.fuente,
    territorioKey: row.territorio_key,
    etiqueta: row.etiqueta,
    euroM2: Number(row.euro_m2),
    periodo: row.periodo,
    updatedAt: row.updated_at,
  };
}

export function bundleFromMercadoRows(rows: MercadoReferenciaRow[]): MercadoReferenciaBundle {
  const mitmaProvincias: Record<string, MercadoReferenciaItem> = {};
  const idealistaProvincias: Record<string, MercadoReferenciaItem> = {};
  let mitmaEspana: MercadoReferenciaItem | null = null;
  let updatedAt: string | null = null;

  for (const row of rows) {
    const item = mapMercadoRow(row);
    if (!updatedAt || new Date(item.updatedAt).getTime() > new Date(updatedAt).getTime()) {
      updatedAt = item.updatedAt;
    }

    if (row.fuente === "mitma") {
      if (row.territorio_key === "ESPANA") mitmaEspana = item;
      else mitmaProvincias[row.territorio_key] = item;
    } else {
      idealistaProvincias[row.territorio_key] = item;
    }
  }

  return {
    mitma: { espana: mitmaEspana, provincias: mitmaProvincias },
    idealista: { provincias: idealistaProvincias },
    updatedAt,
  };
}

export async function fetchMercadoReferencia(
  supabase: SupabaseClient
): Promise<MercadoReferenciaBundle> {
  const { data, error } = await supabase
    .from("bondia_mercado_referencia")
    .select("slug, fuente, territorio_key, etiqueta, euro_m2, periodo, updated_at");

  if (error) throw new Error(error.message);
  return bundleFromMercadoRows(data ?? []);
}
