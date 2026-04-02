// netlify/functions/updateCasaCategoria.ts
import type { Handler } from '@netlify/functions';
import { handleUpdateCategoria, wrapHandler } from './_bloqueHandlers';

const TABLE_MAP: Record<string, string> = {
  gasto: 'casa_gastos_categorias',
  ingreso: 'casa_ingresos_categorias',
  activo: 'casa_activos_categorias',
};

export const handler: Handler = wrapHandler(
  (body) => handleUpdateCategoria(TABLE_MAP, body),
  'updateCasaCategoria'
);
