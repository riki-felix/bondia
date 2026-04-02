// netlify/functions/deleteSanyusCategoria.ts
import type { Handler } from '@netlify/functions';
import { handleDeleteCategoria, wrapHandler } from './_bloqueHandlers';

const TABLE_MAP: Record<string, string> = {
  gasto: 'sanyus_gastos_categorias',
  ingreso: 'sanyus_ingresos_categorias',
  activo: 'sanyus_activos_categorias',
};

export const handler: Handler = wrapHandler(
  (body) => handleDeleteCategoria(TABLE_MAP, body),
  'deleteSanyusCategoria'
);
