// src/lib/documentEntityConfig.ts
// Configuración por tipo de entidad (rutas storage, tablas, etiquetas)

import type { DocumentBloque, DocumentEntityType } from "./documentTypes";

export interface DocumentEntityConfig {
  entityType: DocumentEntityType;
  bloque: DocumentBloque;
  table: string;
  pathSegment: string;
  labelField: string;
  href: (id: string) => string;
}

const CASA_ACTIVOS = "casa_activos_v2";
const SANYUS_ACTIVOS = "sanyus_activos_v2";

export const DOCUMENT_ENTITY_CONFIGS: Record<string, DocumentEntityConfig> = {
  propiedad: {
    entityType: "propiedad",
    bloque: "engine",
    table: "propiedades",
    pathSegment: "propiedades",
    labelField: "titulo",
    href: (id) => `/propiedades/${id}`,
  },
  "casa-activo": {
    entityType: "activo",
    bloque: "casa",
    table: CASA_ACTIVOS,
    pathSegment: "activos",
    labelField: "nombre",
    href: (id) => `/casa/activos/${id}`,
  },
  "sanyus-activo": {
    entityType: "activo",
    bloque: "sanyus",
    table: SANYUS_ACTIVOS,
    pathSegment: "activos",
    labelField: "nombre",
    href: (id) => `/sanyus/activos/${id}`,
  },
  "casa-gasto": {
    entityType: "gasto",
    bloque: "casa",
    table: "casa_gastos",
    pathSegment: "gastos",
    labelField: "concepto",
    href: () => "/casa/gastos",
  },
  "sanyus-gasto": {
    entityType: "gasto",
    bloque: "sanyus",
    table: "sanyus_gastos",
    pathSegment: "gastos",
    labelField: "concepto",
    href: () => "/sanyus/gastos",
  },
  "casa-ingreso": {
    entityType: "ingreso",
    bloque: "casa",
    table: "casa_ingresos",
    pathSegment: "ingresos",
    labelField: "concepto",
    href: () => "/casa/ingresos",
  },
  "sanyus-ingreso": {
    entityType: "ingreso",
    bloque: "sanyus",
    table: "sanyus_ingresos",
    pathSegment: "ingresos",
    labelField: "concepto",
    href: () => "/sanyus/ingresos",
  },
};

export function configKey(bloque: DocumentBloque, entityType: DocumentEntityType): string {
  if (entityType === "propiedad") return "propiedad";
  return `${bloque}-${entityType}`;
}

export function getDocumentEntityConfig(
  bloque: DocumentBloque,
  entityType: DocumentEntityType
): DocumentEntityConfig | null {
  return DOCUMENT_ENTITY_CONFIGS[configKey(bloque, entityType)] ?? null;
}
