export type CasaActivoTitular = "carlos" | "laura" | "izan" | "comun";

export const CASA_ACTIVO_TITULARES: CasaActivoTitular[] = [
  "carlos",
  "laura",
  "izan",
  "comun",
];

export const CASA_ACTIVO_TITULAR_LABELS: Record<CasaActivoTitular, string> = {
  carlos: "Carlos",
  laura: "Laura",
  izan: "Izan",
  comun: "Común",
};

export function isCasaActivoTitular(
  value: string | null | undefined
): value is CasaActivoTitular {
  return CASA_ACTIVO_TITULARES.includes(value as CasaActivoTitular);
}

export function casaActivoTitularLabel(titular: CasaActivoTitular): string {
  return CASA_ACTIVO_TITULAR_LABELS[titular];
}

export function casaActivoTitularViewTitle(titular: CasaActivoTitular): string {
  if (titular === "comun") return "Activos comunes";
  return `Activos ${CASA_ACTIVO_TITULAR_LABELS[titular]}`;
}

export const CASA_ACTIVO_TITULAR_OPTIONS = CASA_ACTIVO_TITULARES.map((value) => ({
  value,
  label: casaActivoTitularLabel(value),
}));
