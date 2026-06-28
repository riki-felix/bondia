/** Superficie de vivienda (m²) según catastro → `superficie_registrada_m2`. */
export function getSuperficieViviendaM2(
  row: { superficie_registrada_m2?: number | null }
): number | null {
  const m2 = Number(row.superficie_registrada_m2);
  return Number.isFinite(m2) && m2 > 0 ? m2 : null;
}
