export function yearFromDate(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const normalized =
    dateStr.length <= 10 ? `${String(dateStr).slice(0, 10)}T12:00:00` : dateStr;
  const d = new Date(normalized);
  if (Number.isNaN(d.getTime())) return null;
  return d.getFullYear();
}

export interface EjercicioPropiedadInput {
  liquidacion?: boolean | null;
  fecha_liquidacion?: string | null;
  fecha_venta?: string | null;
  fecha_ingreso?: string | null;
  created_at?: string | null;
}

export function deriveEjercicioPropiedad(
  input: EjercicioPropiedadInput
): number | null {
  const ventaYear = yearFromDate(input.fecha_venta);
  const liqYear =
    input.liquidacion === true ? yearFromDate(input.fecha_liquidacion) : null;

  if (input.liquidacion === true && liqYear != null) {
    if (ventaYear != null && liqYear !== ventaYear) return liqYear;
    if (ventaYear == null) return liqYear;
  }

  if (ventaYear != null) return ventaYear;

  const ingresoYear = yearFromDate(input.fecha_ingreso);
  if (ingresoYear != null) return ingresoYear;

  return yearFromDate(input.created_at);
}

export function shouldAutoDeriveEjercicio(
  body: Record<string, unknown>,
  updates: Record<string, unknown>
): boolean {
  if (body.ejercicio !== undefined) return false;
  return (
    updates.fecha_venta !== undefined ||
    updates.fecha_ingreso !== undefined ||
    updates.liquidacion !== undefined ||
    updates.fecha_liquidacion !== undefined
  );
}

export function mergeEjercicioPropiedadInput(
  current: EjercicioPropiedadInput,
  updates: Partial<EjercicioPropiedadInput>
): EjercicioPropiedadInput {
  return {
    liquidacion:
      updates.liquidacion !== undefined ? updates.liquidacion : current.liquidacion,
    fecha_liquidacion:
      updates.fecha_liquidacion !== undefined
        ? updates.fecha_liquidacion
        : current.fecha_liquidacion,
    fecha_venta:
      updates.fecha_venta !== undefined ? updates.fecha_venta : current.fecha_venta,
    fecha_ingreso:
      updates.fecha_ingreso !== undefined
        ? updates.fecha_ingreso
        : current.fecha_ingreso,
    created_at: current.created_at,
  };
}
