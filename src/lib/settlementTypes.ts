// src/lib/settlementTypes.ts
// Type definitions for liquidaciones (settlements)

export interface Settlement {
  id: string;
  propiedad_id: string;
  fecha_liquidacion: string;
  numero_liquidacion: number;
  aportacion: number;
  retribucion: number;
  retencion: number;    // generated
  neto: number;          // generated
  efectivo: number;      // generated
  transferencia: number;
  fecha_transferencia: string | null;
  liquidado: boolean;
  ejercicio: number | null;
  created_at: string;
  updated_at: string;
  // Joined field
  propiedad_titulo?: string;
}

export const SETTLEMENT_SELECT =
  "id, propiedad_id, fecha_liquidacion, numero_liquidacion, aportacion, retribucion, retencion, neto, efectivo, transferencia, fecha_transferencia, liquidado, ejercicio, created_at, updated_at, propiedades(titulo)" as const;
