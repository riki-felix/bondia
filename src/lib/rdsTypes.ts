export interface RdsPiso {
  id: string;
  nombre: string;
  direccion: string | null;
  fecha_creacion: string;
  created_at?: string;
  updated_at?: string;
}

export interface RdsMovimiento {
  id: string;
  piso_id: string;
  anio: number;
  mes: number;
  gasto: number;
  ingreso: number;
  promocion: number;
}

export interface RdsPromo {
  id: string;
  anio: number;
  mes: number;
  importe: number;
}

export interface RdsResumenGlobal {
  totalGastos: number;
  totalIngresos: number;
  totalPromos: number;
}

export interface RdsMesResumen {
  mes: number;
  gastos: number;
  ingresos: number;
  promocion: number;
  balance: number;
  balanceAjustado: number;
  miParte: number;
}

export interface RdsPisoResumen {
  gastos: number;
  ingresos: number;
  beneficio: number;
}

export interface RdsMesPiso {
  mes: number;
  gasto: number;
  ingreso: number;
  balance: number;
}

export const RDS_MESES_CORTOS = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
] as const;

export const RDS_MESES_LARGOS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
] as const;
