// src/lib/propertyTypes.ts
// Type definition for property records used in the Inversiones table.

export interface Property {
  id: string;
  numero_operacion: number | null;
  titulo: string | null;
  estado: string | null;
  created_at: string | null;
  pago: boolean;
  aportacion: number | null;
  retribucion: number | null;
  retencion: number | null;
  ingreso_banco: number | null;
  efectivo: number | null;
  jasp_10_percent: number | null;
  transfe: string | null;
  fecha_compra: string | null;
  fecha_venta: string | null;
  ocupado: boolean;
  notas: string | null;
  liquidacion: boolean;
  fecha_ingreso: string | null;
  slug: string | null;
  // Overlay from linked liquidación (aggregated)
  liq?: {
    aportacion: number;
    retribucion: number;
    retencion: number;
    transferencia: number;
    efectivo: number;
    fecha_transferencia: string | null;
    ejercicio: number | null;
  } | null;
}

export const ESTADO_OPTIONS = [
  { value: "sin_estado", label: "Sin Estado" },
  { value: "tanteo", label: "Tanteo" },
  { value: "negociacion", label: "Negociación" },
  { value: "comprado", label: "Comprado" },
  { value: "reforma", label: "Reforma" },
  { value: "alquiler", label: "Alquiler" },
  { value: "vendido", label: "Vendido" },
] as const;

export const PAGO_OPTIONS = [
  { value: "true", label: "Realizado" },
  { value: "false", label: "Pendiente" },
] as const;

export const OCUPADO_OPTIONS = [
  { value: "true", label: "Ocupado" },
  { value: "false", label: "Libre" },
] as const;

/** Columns that are fetched from Supabase for the inversiones table */
export const PROPERTY_SELECT =
  "id, numero_operacion, titulo, estado, created_at, pago, aportacion, retribucion, retencion, ingreso_banco, efectivo, jasp_10_percent, transfe, fecha_compra, fecha_venta, ocupado, notas, liquidacion, fecha_ingreso, slug" as const;
