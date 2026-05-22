// src/lib/documentsTree.ts
// Estructura del árbol de la sección Documentos (espejo del sidebar)

import type { DocumentEntityType } from "./documentTypes";

export interface DocumentsTreeNodeConfig {
  key: string;
  label: string;
  bloque?: "engine" | "casa" | "sanyus";
  entityType?: DocumentEntityType;
  pathSegment?: string;
  children?: DocumentsTreeNodeConfig[];
}

export const DOCUMENTS_TREE_CONFIG: DocumentsTreeNodeConfig[] = [
  {
    key: "engine",
    label: "Engine",
    bloque: "engine",
    children: [
      {
        key: "engine-propiedades",
        label: "Propiedades",
        bloque: "engine",
        entityType: "propiedad",
        pathSegment: "propiedades",
      },
    ],
  },
  {
    key: "casa",
    label: "Casa",
    bloque: "casa",
    children: [
      { key: "casa-gastos", label: "Gastos", bloque: "casa", entityType: "gasto", pathSegment: "gastos" },
      { key: "casa-ingresos", label: "Ingresos", bloque: "casa", entityType: "ingreso", pathSegment: "ingresos" },
      { key: "casa-activos", label: "Activos", bloque: "casa", entityType: "activo", pathSegment: "activos" },
    ],
  },
  {
    key: "sanyus",
    label: "Sanyus",
    bloque: "sanyus",
    children: [
      { key: "sanyus-gastos", label: "Gastos", bloque: "sanyus", entityType: "gasto", pathSegment: "gastos" },
      { key: "sanyus-ingresos", label: "Ingresos", bloque: "sanyus", entityType: "ingreso", pathSegment: "ingresos" },
      { key: "sanyus-activos", label: "Activos", bloque: "sanyus", entityType: "activo", pathSegment: "activos" },
    ],
  },
];
