const CATASTRO_DNPRC_URL =
  'http://ovc.catastro.meh.es/OVCServWeb/OVCWcfCallejero/COVCCallejero.svc/json/Consulta_DNPRC';

const CATASTRO_FACHADA_URL =
  'http://ovc.catastro.meh.es/OVCServWeb/OVCWcfLibres/OVCFotoFachada.svc/RecuperarFotoFachadaGet';

const MIN_FACHADA_BYTES = 100;

export interface CatastroValidationResult {
  ok: true;
  referenciaCatastral: string;
  superficieConstruidaM2: number;
  superficieViviendaM2: number | null;
  anioConstruccion: number | null;
  uso: string | null;
  direccionCatastro: string | null;
}

export function normalizeReferenciaCatastral(raw: string): string | null {
  const ref = raw.replace(/\s+/g, '').toUpperCase();
  if (!ref) return null;
  if (!/^[0-9A-Z]{14}([0-9A-Z]{4})?([0-9A-Z]{2})?$/.test(ref)) return null;
  return ref;
}

/** Referencia de parcela (14 chars) para foto de fachada del edificio. */
export function parcelReferenciaFromRef(referencia: string): string | null {
  const ref = normalizeReferenciaCatastral(referencia);
  if (!ref || ref.length < 14) return null;
  return ref.slice(0, 14);
}

export async function fetchCatastroFachadaBuffer(referencia: string): Promise<Buffer | null> {
  const parcelRef = parcelReferenciaFromRef(referencia);
  if (!parcelRef) return null;

  const url = new URL(CATASTRO_FACHADA_URL);
  url.searchParams.set('ReferenciaCatastral', parcelRef);

  const res = await fetch(url.toString());
  if (!res.ok) return null;

  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.length < MIN_FACHADA_BYTES) return null;
  return buffer;
}

function formatReferenciaFromRc(rc: {
  pc1?: string;
  pc2?: string;
  car?: string;
  cc1?: string;
  cc2?: string;
}): string | null {
  const parts = [rc.pc1, rc.pc2, rc.car, rc.cc1, rc.cc2].filter(Boolean);
  if (parts.length < 3) return null;
  return parts.join('');
}

function parseNumber(value: unknown): number | null {
  if (value == null || value === '') return null;
  const n = Number(String(value).replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function extractSuperficieVivienda(
  lcons?: Array<{
    lcd?: string;
    dfcons?: { stl?: string };
    dvcons?: { dtip?: string };
  }>
): number | null {
  if (!lcons?.length) return null;

  const viviendas = lcons.filter((u) => {
    const lcd = (u.lcd ?? '').toUpperCase();
    const dtip = (u.dvcons?.dtip ?? '').toUpperCase();
    return lcd === 'VIVIENDA' || dtip.includes('VIVIENDA');
  });

  if (!viviendas.length) return null;

  let total = 0;
  let hasAny = false;
  for (const unidad of viviendas) {
    const m2 = parseNumber(unidad.dfcons?.stl);
    if (m2 != null) {
      total += m2;
      hasAny = true;
    }
  }

  return hasAny ? total : null;
}

export function parseCatastroDnprcResponse(data: unknown): CatastroValidationResult | { ok: false; error: string } {
  const root = data as {
    consulta_dnprcResult?: {
      control?: { cuerr?: number };
      lerr?: Array<{ cod?: string; des?: string }>;
      bico?: {
        bi?: {
          ldt?: string;
          debi?: { luso?: string; sfc?: string; ant?: string };
          idbi?: { rc?: { pc1?: string; pc2?: string; car?: string; cc1?: string; cc2?: string } };
        };
        lcons?: Array<{
          lcd?: string;
          dfcons?: { stl?: string };
          dvcons?: { dtip?: string };
        }>;
      };
    };
  };

  const result = root.consulta_dnprcResult;
  if (!result) {
    return { ok: false, error: 'Respuesta inválida del Catastro' };
  }

  if (result.control?.cuerr) {
    const msg = result.lerr?.[0]?.des || 'Referencia catastral no encontrada';
    return { ok: false, error: msg };
  }

  const bi = result.bico?.bi;
  if (!bi) {
    return { ok: false, error: 'No se encontró información para esta referencia' };
  }

  const superficieConstruidaM2 = parseNumber(bi.debi?.sfc);
  if (superficieConstruidaM2 == null) {
    return { ok: false, error: 'La referencia no tiene superficie construida registrada' };
  }

  const anio = parseNumber(bi.debi?.ant);
  const anioConstruccion = anio != null ? Math.round(anio) : null;

  const referenciaCatastral =
    formatReferenciaFromRc(bi.idbi?.rc ?? {}) ?? normalizeReferenciaCatastral(bi.ldt ?? '') ?? '';

  const superficieViviendaM2 = extractSuperficieVivienda(result.bico?.lcons);

  return {
    ok: true,
    referenciaCatastral,
    superficieConstruidaM2,
    superficieViviendaM2,
    anioConstruccion,
    uso: bi.debi?.luso?.trim() || null,
    direccionCatastro: bi.ldt?.trim() || null,
  };
}

export async function fetchCatastroByReferencia(referencia: string): Promise<CatastroValidationResult> {
  const ref = normalizeReferenciaCatastral(referencia);
  if (!ref) {
    throw new Error('La referencia catastral debe tener 14, 18 o 20 caracteres alfanuméricos');
  }

  const url = new URL(CATASTRO_DNPRC_URL);
  url.searchParams.set('RefCat', ref);

  const res = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
  });

  if (!res.ok) {
    throw new Error(`Error al consultar el Catastro (${res.status})`);
  }

  const data = await res.json();
  const parsed = parseCatastroDnprcResponse(data);
  if (!parsed.ok) {
    throw new Error(parsed.error);
  }
  return parsed;
}
