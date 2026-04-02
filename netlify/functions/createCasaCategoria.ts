// netlify/functions/createCasaCategoria.ts
import type { Handler } from '@netlify/functions';
import { handleCreateCategoria, wrapHandler } from './_bloqueHandlers';

const TABLE_MAP: Record<string, string> = {
  gasto: 'casa_gastos_categorias',
  ingreso: 'casa_ingresos_categorias',
  activo: 'casa_activos_categorias',
};

export const handler: Handler = wrapHandler(
  (body) => handleCreateCategoria(TABLE_MAP, body),
  'createCasaCategoria'
);
