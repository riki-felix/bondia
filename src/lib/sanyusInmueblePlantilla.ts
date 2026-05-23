// src/lib/sanyusInmueblePlantilla.ts
// Metadatos de la plantilla inmueble (características Sanyus con slugs fijos)

import { ESTADO_OPTIONS, OCUPADO_OPTIONS } from "@/lib/propertyTypes";
import type { BloqueCategoria } from "@/lib/bloqueTypes";

export const INMUEBLE_PARTICIPACION_SLUGS = [
  "participacion_carlos",
  "participacion_laura",
  "participacion_izan",
] as const;

export const INMUEBLE_PLANTILLA_SLUGS = [
  "origen",
  "direccion",
  "precio_venta",
  "superficie_m2",
  "anio_construccion",
  "numero_catastro",
  "estado",
  "ocupado",
  "fecha_ingreso",
  "fecha_venta",
  ...INMUEBLE_PARTICIPACION_SLUGS,
] as const;

export type InmueblePlantillaSlug = (typeof INMUEBLE_PLANTILLA_SLUGS)[number];

export type InmuebleFieldType = "text" | "number" | "date" | "select" | "percent";

export interface InmuebleFieldMeta {
  slug: InmueblePlantillaSlug;
  label: string;
  type: InmuebleFieldType;
  options?: readonly { value: string; label: string }[];
  step?: string;
  min?: string;
  max?: string;
  colSpan?: 1 | 2 | 3;
}

export const INMUEBLE_FIELD_META: Record<InmueblePlantillaSlug, InmuebleFieldMeta> = {
  origen: { slug: "origen", label: "Origen", type: "text", colSpan: 1 },
  direccion: { slug: "direccion", label: "Dirección", type: "text", colSpan: 2 },
  precio_venta: { slug: "precio_venta", label: "Precio venta (€)", type: "number", step: "0.01" },
  superficie_m2: { slug: "superficie_m2", label: "Superficie (m²)", type: "number" },
  anio_construccion: {
    slug: "anio_construccion",
    label: "Año construcción",
    type: "number",
    min: "1800",
    max: "2100",
  },
  numero_catastro: { slug: "numero_catastro", label: "Ref. Catastral", type: "text" },
  estado: {
    slug: "estado",
    label: "Estado",
    type: "select",
    options: ESTADO_OPTIONS,
  },
  ocupado: {
    slug: "ocupado",
    label: "Ocupado",
    type: "select",
    options: OCUPADO_OPTIONS,
  },
  fecha_ingreso: { slug: "fecha_ingreso", label: "Inicio operación", type: "date" },
  fecha_venta: { slug: "fecha_venta", label: "Fecha venta", type: "date" },
  participacion_carlos: {
    slug: "participacion_carlos",
    label: "Carlos",
    type: "percent",
    step: "0.001",
    min: "0",
    max: "100",
  },
  participacion_laura: {
    slug: "participacion_laura",
    label: "Laura",
    type: "percent",
    step: "0.001",
    min: "0",
    max: "100",
  },
  participacion_izan: {
    slug: "participacion_izan",
    label: "Izan",
    type: "percent",
    step: "0.001",
    min: "0",
    max: "100",
  },
};

/** Secciones del formulario inmueble (orden y agrupación) */
export const INMUEBLE_FIELD_GROUPS: { title: string; slugs: InmueblePlantillaSlug[] }[] = [
  { title: "Identificación", slugs: ["origen", "direccion"] },
  { title: "Datos económicos", slugs: ["precio_venta"] },
  { title: "Características", slugs: ["superficie_m2", "anio_construccion", "numero_catastro"] },
  { title: "Estado", slugs: ["estado", "ocupado"] },
  { title: "Fechas", slugs: ["fecha_ingreso", "fecha_venta"] },
  { title: "Participación", slugs: ["participacion_carlos", "participacion_laura", "participacion_izan"] },
];

export function isInmueblePlantillaSlug(slug: string): slug is InmueblePlantillaSlug {
  return (INMUEBLE_PLANTILLA_SLUGS as readonly string[]).includes(slug);
}

export function findInmueblesCategoriaId(categorias: BloqueCategoria[]): string | null {
  const found = categorias.find(
    (c) => c.slug === "inmuebles" || c.nombre.toLowerCase() === "inmuebles"
  );
  return found?.id ?? null;
}
