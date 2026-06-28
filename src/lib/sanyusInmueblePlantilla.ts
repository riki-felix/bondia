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
  "superficie_registrada_m2",
  "superficie_real_m2",
  "anio_construccion",
  "numero_catastro",
  "estado",
  "ocupado",
  "fecha_ingreso",
  "fecha_venta",
  ...INMUEBLE_PARTICIPACION_SLUGS,
] as const;

export type InmueblePlantillaSlug = (typeof INMUEBLE_PLANTILLA_SLUGS)[number];

export type InmuebleFieldType = "text" | "number" | "date" | "select" | "percent" | "money";

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
  direccion: { slug: "direccion", label: "Dirección", type: "text", colSpan: 1 },
  precio_venta: { slug: "precio_venta", label: "Precio de venta", type: "money" },
  superficie_m2: { slug: "superficie_m2", label: "Superficie construida", type: "number" },
  superficie_registrada_m2: {
    slug: "superficie_registrada_m2",
    label: "Superficie vivienda",
    type: "number",
  },
  superficie_real_m2: {
    slug: "superficie_real_m2",
    label: "Superficie real en m²",
    type: "number",
  },
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
  {
    title: "Características",
    slugs: [
      "superficie_m2",
      "superficie_registrada_m2",
      "superficie_real_m2",
      "anio_construccion",
      "numero_catastro",
    ],
  },
  { title: "Estado", slugs: ["estado", "ocupado"] },
  { title: "Participación", slugs: ["participacion_carlos", "participacion_laura", "participacion_izan"] },
];

/** Slugs de plantilla gestionados fuera de BloqueActivoInmuebleSection */
export const INMUEBLE_EXTERNAL_FIELD_SLUGS = [
  "fecha_ingreso",
  "precio_venta",
  "fecha_venta",
] as const satisfies readonly InmueblePlantillaSlug[];

export const INMUEBLE_ESTADO_VENDIDO = "vendido";

export function isInmueblePlantillaSlug(slug: string): slug is InmueblePlantillaSlug {
  return (INMUEBLE_PLANTILLA_SLUGS as readonly string[]).includes(slug);
}

export function findInmueblesCategoriaId(categorias: BloqueCategoria[]): string | null {
  const found = categorias.find((c) => isInmueblesCategoria(c));
  return found?.id ?? null;
}

export function isInmueblesCategoria(
  cat: Pick<BloqueCategoria, "slug" | "nombre"> | null | undefined
): boolean {
  if (!cat) return false;
  const slug = cat.slug?.toLowerCase();
  const nombre = cat.nombre?.toLowerCase();
  return slug === "inmuebles" || slug === "inmueble" || nombre === "inmuebles" || nombre === "inmueble";
}

export function isActivoInmueble(
  activo: { es_inmueble?: boolean; categoria_id?: string | null },
  categorias: BloqueCategoria[]
): boolean {
  if (activo.es_inmueble) return true;
  const inmueblesId = findInmueblesCategoriaId(categorias);
  return Boolean(inmueblesId && activo.categoria_id === inmueblesId);
}

/** Resuelve ?cat=inmuebles o legacy ?inmueble=1 al id de categoría. */
export function resolveActivosCatFilter(
  filter: string | null | undefined,
  categorias: BloqueCategoria[]
): string | null {
  if (!filter) return null;
  if (filter === "__none__") return "__none__";
  if (filter === "inmuebles" || filter === "inmueble") {
    return findInmueblesCategoriaId(categorias);
  }
  return filter;
}

export function matchesActivosCatFilter(
  activo: { es_inmueble?: boolean; categoria_id?: string | null },
  activeCat: string | null,
  categorias: BloqueCategoria[]
): boolean {
  if (!activeCat) return true;
  const inmueblesId = findInmueblesCategoriaId(categorias);
  if (activeCat === "__none__") {
    return !activo.categoria_id && !isActivoInmueble(activo, categorias);
  }
  if (inmueblesId && activeCat === inmueblesId) {
    return isActivoInmueble(activo, categorias);
  }
  return activo.categoria_id === activeCat;
}
