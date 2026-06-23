// src/lib/bloqueConfig.ts
// Configuration per block — maps table names, endpoints and routes

export interface BloqueActivoMetadataEndpoints {
  createActivoTag: string;
  updateActivoTag: string;
  deleteActivoTag: string;
  syncActivoTags: string;
  createCaracteristica: string;
  updateCaracteristica: string;
  deleteCaracteristica: string;
  syncCaracteristicaValores: string;
}

export interface BloqueConfig {
  id: "casa" | "sanyus";
  label: string;
  tables: {
    gastos: string;
    ingresos: string;
    activos: string;
    gastosCateg: string;
    ingresosCateg: string;
    activosCateg: string;
    gastosOverrides: string;
    ingresosOverrides: string;
    areas: string;
    areasCategorias: string;
    /** Catálogo de tags del bloque */
    activosTagCatalog?: string;
    /** Join activo ↔ tag del bloque */
    activosTagsJoin?: string;
    /** Definiciones de características del bloque */
    activosCaracteristicas?: string;
    /** Valores por activo del bloque */
    activosCaracteristicaValores?: string;
  };
  /** Supabase join expression:  `*, table_name(nombre)` */
  joins: {
    gastosCateg: string;
    ingresosCateg: string;
    activosCateg: string;
  };
  endpoints: {
    createGasto: string;
    updateGasto: string;
    deleteGasto: string;
    createIngreso: string;
    updateIngreso: string;
    deleteIngreso: string;
    createActivo: string;
    updateActivo: string;
    deleteActivo: string;
    uploadActivoFoto: string;
    deleteActivoFoto: string;
    createCategoria: string;
    updateCategoria: string;
    deleteCategoria: string;
    createArea: string;
    updateArea: string;
    deleteArea: string;
    syncAreaCategorias: string;
    upsertOverride: string;
  } & Partial<BloqueActivoMetadataEndpoints> & {
    /** Solo Sanyus — ficha Modelo 184 */
    upsertModelo184Config?: string;
  };
  routes: {
    control: string;
    gastos: string;
    ingresos: string;
    activos: string;
    activoNuevo: string;
    activoDetalle: string; // append /{id}
    categorias: string;
    /** Solo Sanyus — declaración modelo 184 AEAT */
    modelo184?: string;
  };
}

export function bloqueHasActivoTags(config: BloqueConfig): boolean {
  return !!config.tables.activosTagCatalog && !!config.tables.activosTagsJoin;
}

export function bloqueHasActivoCaracteristicas(config: BloqueConfig): boolean {
  return (
    !!config.tables.activosCaracteristicas &&
    !!config.tables.activosCaracteristicaValores
  );
}

export function bloqueHasActivoInmuebles(config: BloqueConfig): boolean {
  return config.id === "sanyus" || config.id === "casa";
}

export function bloqueHasActivoTitular(config: BloqueConfig): boolean {
  return config.id === "casa";
}

export const CASA_CONFIG: BloqueConfig = {
  id: "casa",
  label: "Casa",
  tables: {
    gastos: "casa_gastos",
    ingresos: "casa_ingresos",
    activos: "casa_activos_v2",
    gastosCateg: "casa_gastos_categorias",
    ingresosCateg: "casa_ingresos_categorias",
    activosCateg: "casa_activos_categorias",
    gastosOverrides: "casa_gastos_overrides",
    ingresosOverrides: "casa_ingresos_overrides",
    areas: "casa_areas",
    areasCategorias: "casa_areas_categorias",
    activosTagCatalog: "casa_activos_tag_catalog",
    activosTagsJoin: "casa_activos_tags",
    activosCaracteristicas: "casa_activos_caracteristicas",
    activosCaracteristicaValores: "casa_activos_caracteristica_valores",
  },
  joins: {
    gastosCateg: "casa_gastos_categorias(nombre)",
    ingresosCateg: "casa_ingresos_categorias(nombre)",
    activosCateg: "casa_activos_categorias(nombre)",
  },
  endpoints: {
    createGasto: "/.netlify/functions/createCasaGasto",
    updateGasto: "/.netlify/functions/updateCasaGasto",
    deleteGasto: "/.netlify/functions/deleteCasaGasto",
    createIngreso: "/.netlify/functions/createCasaIngreso",
    updateIngreso: "/.netlify/functions/updateCasaIngreso",
    deleteIngreso: "/.netlify/functions/deleteCasaIngreso",
    createActivo: "/.netlify/functions/createCasaActivo",
    updateActivo: "/.netlify/functions/updateCasaActivo",
    deleteActivo: "/.netlify/functions/deleteCasaActivo",
    uploadActivoFoto: "/.netlify/functions/uploadCasaActivoFoto",
    deleteActivoFoto: "/.netlify/functions/deleteCasaActivoFoto",
    createCategoria: "/.netlify/functions/createCasaCategoria",
    updateCategoria: "/.netlify/functions/updateCasaCategoria",
    deleteCategoria: "/.netlify/functions/deleteCasaCategoria",
    createArea: "/.netlify/functions/createCasaArea",
    updateArea: "/.netlify/functions/updateCasaArea",
    deleteArea: "/.netlify/functions/deleteCasaArea",
    syncAreaCategorias: "/.netlify/functions/syncCasaAreaCategorias",
    upsertOverride: "/.netlify/functions/upsertCasaOverride",
    createActivoTag: "/.netlify/functions/createActivoTag",
    updateActivoTag: "/.netlify/functions/updateActivoTag",
    deleteActivoTag: "/.netlify/functions/deleteActivoTag",
    syncActivoTags: "/.netlify/functions/syncCasaActivoTags",
    createCaracteristica: "/.netlify/functions/createCaracteristica",
    updateCaracteristica: "/.netlify/functions/updateCaracteristica",
    deleteCaracteristica: "/.netlify/functions/deleteCaracteristica",
    syncCaracteristicaValores: "/.netlify/functions/syncCasaCaracteristicaValores",
  },
  routes: {
    control: "/casa/control",
    gastos: "/casa/gastos",
    ingresos: "/casa/ingresos",
    activos: "/casa/activos",
    activoNuevo: "/casa/activos/nuevo",
    activoDetalle: "/casa/activos",
    categorias: "/casa/categorias",
  },
};

export const SANYUS_CONFIG: BloqueConfig = {
  id: "sanyus",
  label: "Sanyus",
  tables: {
    gastos: "sanyus_gastos",
    ingresos: "sanyus_ingresos",
    activos: "sanyus_activos_v2",
    gastosCateg: "sanyus_gastos_categorias",
    ingresosCateg: "sanyus_ingresos_categorias",
    activosCateg: "sanyus_activos_categorias",
    gastosOverrides: "sanyus_gastos_overrides",
    ingresosOverrides: "sanyus_ingresos_overrides",
    areas: "sanyus_areas",
    areasCategorias: "sanyus_areas_categorias",
    activosTagCatalog: "sanyus_activos_tag_catalog",
    activosTagsJoin: "sanyus_activos_tags",
    activosCaracteristicas: "sanyus_activos_caracteristicas",
    activosCaracteristicaValores: "sanyus_activos_caracteristica_valores",
  },
  joins: {
    gastosCateg: "sanyus_gastos_categorias(nombre)",
    ingresosCateg: "sanyus_ingresos_categorias(nombre)",
    activosCateg: "sanyus_activos_categorias(nombre)",
  },
  endpoints: {
    createGasto: "/.netlify/functions/createSanyusGasto",
    updateGasto: "/.netlify/functions/updateSanyusGasto",
    deleteGasto: "/.netlify/functions/deleteSanyusGasto",
    createIngreso: "/.netlify/functions/createSanyusIngreso",
    updateIngreso: "/.netlify/functions/updateSanyusIngreso",
    deleteIngreso: "/.netlify/functions/deleteSanyusIngreso",
    createActivo: "/.netlify/functions/createSanyusActivo",
    updateActivo: "/.netlify/functions/updateSanyusActivo",
    deleteActivo: "/.netlify/functions/deleteSanyusActivo",
    uploadActivoFoto: "/.netlify/functions/uploadSanyusActivoFoto",
    deleteActivoFoto: "/.netlify/functions/deleteSanyusActivoFoto",
    createCategoria: "/.netlify/functions/createSanyusCategoria",
    updateCategoria: "/.netlify/functions/updateSanyusCategoria",
    deleteCategoria: "/.netlify/functions/deleteSanyusCategoria",
    createArea: "/.netlify/functions/createSanyusArea",
    updateArea: "/.netlify/functions/updateSanyusArea",
    deleteArea: "/.netlify/functions/deleteSanyusArea",
    syncAreaCategorias: "/.netlify/functions/syncSanyusAreaCategorias",
    upsertOverride: "/.netlify/functions/upsertSanyusOverride",
    createActivoTag: "/.netlify/functions/createSanyusActivoTag",
    updateActivoTag: "/.netlify/functions/updateSanyusActivoTag",
    deleteActivoTag: "/.netlify/functions/deleteSanyusActivoTag",
    syncActivoTags: "/.netlify/functions/syncSanyusActivoTags",
    createCaracteristica: "/.netlify/functions/createSanyusCaracteristica",
    updateCaracteristica: "/.netlify/functions/updateSanyusCaracteristica",
    deleteCaracteristica: "/.netlify/functions/deleteSanyusCaracteristica",
    syncCaracteristicaValores: "/.netlify/functions/syncSanyusCaracteristicaValores",
    upsertModelo184Config: "/.netlify/functions/upsertSanyusModelo184Config",
  },
  routes: {
    control: "/sanyus/control",
    gastos: "/sanyus/gastos",
    ingresos: "/sanyus/ingresos",
    activos: "/sanyus/activos",
    activoNuevo: "/sanyus/activos/nuevo",
    activoDetalle: "/sanyus/activos",
    categorias: "/sanyus/categorias",
    modelo184: "/sanyus/modelo-184",
  },
};
