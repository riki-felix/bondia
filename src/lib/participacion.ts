// Porcentajes de participación por propiedad (hasta 3 decimales).

export function roundParticipacionPct(value: number): number {
  return Math.round(value * 1000) / 1000;
}

export const DEFAULT_PARTICIPACION_SANYUS = 40;
export const DEFAULT_PARTICIPACION_JASP = 20;
/** Bienes Sanyus CB por defecto; CASTELLO = 100% − este valor → 50% cada uno */
export const DEFAULT_PARTICIPACION_BIENES_SANYUS_CB = 50;

export function effectiveParticipacionSanyus(
  value: number | null | undefined
): number {
  if (value != null && Number.isFinite(value)) return value;
  return DEFAULT_PARTICIPACION_SANYUS;
}

export function effectiveParticipacionJasp(
  value: number | null | undefined
): number {
  if (value != null && Number.isFinite(value)) return value;
  return DEFAULT_PARTICIPACION_JASP;
}

export function effectiveParticipacionBienesSanyusCb(
  value: number | null | undefined
): number {
  if (value != null && Number.isFinite(value)) return value;
  return DEFAULT_PARTICIPACION_BIENES_SANYUS_CB;
}

/** Valor inicial en formularios (ficha / diálogo) */
export function participacionBienesSanyusCbFormValue(
  value: number | null | undefined
): string {
  if (value != null && Number.isFinite(value)) return String(value);
  return String(DEFAULT_PARTICIPACION_BIENES_SANYUS_CB);
}

/** Externa = 100% − Sanyus − JASP */
export function participacionExterna(
  sanyus: number,
  jasp: number
): number {
  return roundParticipacionPct(100 - sanyus - jasp);
}

/** CASTELLO = 100% − Bienes Sanyus CB */
export function participacionCastello(bienesSanyusCb: number): number {
  return roundParticipacionPct(100 - bienesSanyusCb);
}

export function formatParticipacionPct(value: number): string {
  const r = roundParticipacionPct(value);
  const s = r.toFixed(3).replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
  return `${s}%`;
}

export function parseParticipacionInput(raw: string): number | null {
  const s = raw.trim().replace("%", "").replace(",", ".");
  if (!s) return null;
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0 || n > 100) return null;
  return roundParticipacionPct(n);
}

export function validateParticipacionPair(
  sanyus: number,
  jasp: number
): string | null {
  if (sanyus < 0 || jasp < 0) return "Los porcentajes no pueden ser negativos";
  if (roundParticipacionPct(sanyus + jasp) > 100) {
    return "Sanyus + JASP no pueden superar el 100%";
  }
  return null;
}

export function validateBienesSanyusCb(pct: number | null): string | null {
  if (pct == null) return null;
  if (pct < 0 || pct > 100) {
    return "Bienes Sanyus CB debe estar entre 0 y 100%";
  }
  return null;
}
