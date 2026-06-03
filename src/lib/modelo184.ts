// Modelo 184 AEAT — entidades en régimen de atribución de rentas (Sanyus / inmuebles)

import {
  type BloqueGasto,
  type BloqueIngreso,
  type BloqueOverride,
  calcularImporteMes,
  buildOverridesMap,
} from "@/lib/bloqueTypes";
import {
  INMUEBLE_PARTICIPACION_SLUGS,
  INMUEBLE_FIELD_META,
  type InmueblePlantillaSlug,
} from "@/lib/sanyusInmueblePlantilla";
import { roundParticipacionPct, formatParticipacionPct } from "@/lib/participacion";

/** Clave actividad principal — tenencia y administración de bienes inmuebles (modelo 184) */
export const MODELO184_ACTIVIDAD_PRINCIPAL = 3;

/** Situación del inmueble (registro tipo 2, clave C — rendimientos capital inmobiliario) */
export const SITUACION_INMUEBLE_OPTIONS = [
  { codigo: 1, label: "Territorio común (con ref. catastral)" },
  { codigo: 2, label: "País Vasco" },
  { codigo: 3, label: "Navarra" },
  { codigo: 4, label: "España sin ref. catastral / sin número de finca" },
  { codigo: 5, label: "Extranjero" },
] as const;

export type SituacionInmuebleCodigo = (typeof SITUACION_INMUEBLE_OPTIONS)[number]["codigo"];

export interface Modelo184EntidadConfig {
  nif: string;
  denominacion: string;
  domicilio: string;
  municipio: string;
  provincia: string;
  codigoPostal: string;
}

export interface Modelo184ParticipeConfig {
  key: "carlos" | "laura" | "izan";
  label: string;
  slug: (typeof INMUEBLE_PARTICIPACION_SLUGS)[number];
  nif: string;
}

export interface Modelo184InmuebleRow {
  activoId: string;
  nombre: string;
  slug: string | null;
  fechaCompra: string | null;
  precioCompra: number | null;
  valorEstimado: number | null;
  fechaEstimacion: string | null;
  campos: Partial<Record<InmueblePlantillaSlug, string>>;
  situacion: { codigo: SituacionInmuebleCodigo; label: string };
  participacionSuma: number;
  participacionOk: boolean;
  ingresosAnuales: number;
  gastosAnuales: number;
  resultadoNeto: number;
  detalleIngresos: { concepto: string; importe: number }[];
  detalleGastos: { concepto: string; importe: number }[];
}

export interface Modelo184AtribucionParticipe {
  key: Modelo184ParticipeConfig["key"];
  label: string;
  nif: string;
  ingresosAtribuidos: number;
  gastosAtribuidos: number;
  netoAtribuido: number;
}

export interface Modelo184InmuebleExcluido {
  activoId: string;
  nombre: string;
}

export interface Modelo184Resumen {
  ejercicio: number;
  entidad: Modelo184FichaConfig["entidad"];
  participes: Modelo184ParticipeConfig[];
  /** Inmuebles con ingresos o gastos en el ejercicio (informan en el 184). */
  inmuebles: Modelo184InmuebleRow[];
  /** Marcados como inmueble pero sin movimientos con importe en el ejercicio. */
  inmueblesExcluidos: Modelo184InmuebleExcluido[];
  inmueblesMarcadosCount: number;
  totales: {
    ingresos: number;
    gastos: number;
    neto: number;
    inmueblesCount: number;
  };
  atribuciones: Modelo184AtribucionParticipe[];
  avisos: string[];
}

/** Hay rentas inmobiliarias que declarar/atribuir este ejercicio. */
export function inmuebleInformaEnEjercicio(
  ingresosAnuales: number,
  gastosAnuales: number
): boolean {
  return ingresosAnuales > 0 || gastosAnuales > 0;
}

import type { Modelo184FichaConfig } from "@/lib/modelo184Config";
import { DEFAULT_MODELO184_FICHA } from "@/lib/modelo184Config";

export function inferSituacionInmueble(
  origen: string,
  direccion: string,
  numeroCatastro: string
): { codigo: SituacionInmuebleCodigo; label: string } {
  const texto = `${origen} ${direccion}`.toLowerCase();
  if (
    /extranjero|francia|portugal|andorra|italia|alemania|uk|reino\s*unido|usa|méxico|marruecos/i.test(
      texto
    )
  ) {
    return pickSituacion(5);
  }
  if (/navarra|foral.*navarra|\bnap\b/i.test(texto)) {
    return pickSituacion(3);
  }
  if (
    /pa[ií]s\s*vasco|euskadi|vizcaya|bizkaia|guip[uú]zcoa|gipuzkoa|[áa]lava|araba/i.test(
      texto
    )
  ) {
    return pickSituacion(2);
  }
  if (!numeroCatastro.trim()) {
    return pickSituacion(4);
  }
  return pickSituacion(1);
}

function pickSituacion(codigo: SituacionInmuebleCodigo) {
  const opt = SITUACION_INMUEBLE_OPTIONS.find((o) => o.codigo === codigo)!;
  return { codigo: opt.codigo, label: opt.label };
}

export function parseParticipacionValor(raw: string): number {
  const s = raw.trim().replace("%", "").replace(",", ".");
  if (!s) return 0;
  const n = Number(s);
  if (!Number.isFinite(n)) return 0;
  return roundParticipacionPct(Math.min(100, Math.max(0, n)));
}

export function calcularImporteAnual(
  item: {
    id: string;
    frecuencia: BloqueGasto["frecuencia"];
    fecha_inicio: string | null;
    fecha_fin: string | null;
    importe: number;
  },
  ejercicio: number,
  overrides: Map<string, number>
): number {
  let sum = 0;
  for (let mes = 1; mes <= 12; mes++) {
    const v = calcularImporteMes(item, mes, ejercicio, overrides);
    if (v != null) sum += v;
  }
  return Math.round(sum * 100) / 100;
}

export interface Modelo184ActivoInput {
  id: string;
  nombre: string;
  slug: string | null;
  fecha_compra: string | null;
  precio_compra: number | null;
  valor_estimado: number | null;
  fecha_estimacion: string | null;
  caracteristica_valores: { caracteristica_id: string; valor: string }[];
}

export interface Modelo184CaracteristicaInput {
  id: string;
  slug: string;
}

export function buildModelo184Resumen(params: {
  ejercicio: number;
  ficha?: Modelo184FichaConfig;
  activos: Modelo184ActivoInput[];
  caracteristicas: Modelo184CaracteristicaInput[];
  gastos: BloqueGasto[];
  ingresos: BloqueIngreso[];
  gastosOverrides: BloqueOverride[];
  ingresosOverrides: BloqueOverride[];
}): Modelo184Resumen {
  const ficha = params.ficha ?? DEFAULT_MODELO184_FICHA;
  const entidad = ficha.entidad;
  const participes = ficha.participes;
  const idToSlug = new Map(
    params.caracteristicas.map((c) => [c.id, c.slug] as const)
  );

  const gastosMap = buildOverridesMap(params.gastosOverrides, "gasto_id");
  const ingresosMap = buildOverridesMap(params.ingresosOverrides, "ingreso_id");
  const inmuebleIds = new Set(params.activos.map((a) => a.id));

  const gastosByActivo = new Map<string, BloqueGasto[]>();
  const ingresosByActivo = new Map<string, BloqueIngreso[]>();
  for (const g of params.gastos) {
    if (!g.activo_id || !inmuebleIds.has(g.activo_id)) continue;
    const list = gastosByActivo.get(g.activo_id) ?? [];
    list.push(g);
    gastosByActivo.set(g.activo_id, list);
  }
  for (const ing of params.ingresos) {
    if (!ing.activo_id || !inmuebleIds.has(ing.activo_id)) continue;
    const list = ingresosByActivo.get(ing.activo_id) ?? [];
    list.push(ing);
    ingresosByActivo.set(ing.activo_id, list);
  }

  const inmueblesTodos: Modelo184InmuebleRow[] = params.activos.map((activo) => {
    const campos: Partial<Record<InmueblePlantillaSlug, string>> = {};
    for (const cv of activo.caracteristica_valores) {
      const slug = idToSlug.get(cv.caracteristica_id);
      if (slug && slug in INMUEBLE_FIELD_META) {
        campos[slug as InmueblePlantillaSlug] = cv.valor ?? "";
      }
    }

    const origen = campos.origen ?? "";
    const direccion = campos.direccion ?? "";
    const catastro = campos.numero_catastro ?? "";
    const situacion = inferSituacionInmueble(origen, direccion, catastro);

    let participacionSuma = 0;
    for (const slug of INMUEBLE_PARTICIPACION_SLUGS) {
      participacionSuma += parseParticipacionValor(campos[slug] ?? "");
    }
    participacionSuma = roundParticipacionPct(participacionSuma);

    const ingresosList = ingresosByActivo.get(activo.id) ?? [];
    const gastosList = gastosByActivo.get(activo.id) ?? [];

    const detalleIngresos = ingresosList.map((ing) => ({
      concepto: ing.concepto,
      importe: calcularImporteAnual(ing, params.ejercicio, ingresosMap),
    }));
    const detalleGastos = gastosList.map((g) => ({
      concepto: g.concepto,
      importe: calcularImporteAnual(g, params.ejercicio, gastosMap),
    }));

    const ingresosAnuales = detalleIngresos.reduce((s, d) => s + d.importe, 0);
    const gastosAnuales = detalleGastos.reduce((s, d) => s + d.importe, 0);

    return {
      activoId: activo.id,
      nombre: activo.nombre,
      slug: activo.slug,
      fechaCompra: activo.fecha_compra,
      precioCompra: activo.precio_compra,
      valorEstimado: activo.valor_estimado,
      fechaEstimacion: activo.fecha_estimacion,
      campos,
      situacion,
      participacionSuma,
      participacionOk: Math.abs(participacionSuma - 100) < 0.01,
      ingresosAnuales: Math.round(ingresosAnuales * 100) / 100,
      gastosAnuales: Math.round(gastosAnuales * 100) / 100,
      resultadoNeto: Math.round((ingresosAnuales - gastosAnuales) * 100) / 100,
      detalleIngresos,
      detalleGastos,
    };
  });

  const inmuebles = inmueblesTodos.filter((i) =>
    inmuebleInformaEnEjercicio(i.ingresosAnuales, i.gastosAnuales)
  );
  const inmueblesExcluidos: Modelo184InmuebleExcluido[] = inmueblesTodos
    .filter((i) => !inmuebleInformaEnEjercicio(i.ingresosAnuales, i.gastosAnuales))
    .map((i) => ({ activoId: i.activoId, nombre: i.nombre }));

  const totales = {
    ingresos: inmuebles.reduce((s, i) => s + i.ingresosAnuales, 0),
    gastos: inmuebles.reduce((s, i) => s + i.gastosAnuales, 0),
    neto: inmuebles.reduce((s, i) => s + i.resultadoNeto, 0),
    inmueblesCount: inmuebles.length,
  };

  const atribuciones: Modelo184AtribucionParticipe[] = participes.map((p) => {
    let ingresosAtribuidos = 0;
    let gastosAtribuidos = 0;
    for (const inm of inmuebles) {
      const pct = parseParticipacionValor(inm.campos[p.slug] ?? "") / 100;
      ingresosAtribuidos += inm.ingresosAnuales * pct;
      gastosAtribuidos += inm.gastosAnuales * pct;
    }
    ingresosAtribuidos = Math.round(ingresosAtribuidos * 100) / 100;
    gastosAtribuidos = Math.round(gastosAtribuidos * 100) / 100;
    return {
      key: p.key,
      label: p.label,
      nif: p.nif,
      ingresosAtribuidos,
      gastosAtribuidos,
      netoAtribuido: Math.round((ingresosAtribuidos - gastosAtribuidos) * 100) / 100,
    };
  });

  const avisos: string[] = [];
  if (!entidad.nif) {
    avisos.push("Falta el NIF de la entidad declarante (ficha de configuración).");
  }
  if (!entidad.domicilio?.trim()) {
    avisos.push("Falta el domicilio fiscal de la entidad.");
  }
  for (const p of participes) {
    if (!p.nif) {
      avisos.push(`Falta el NIF del partícipe ${p.label}.`);
    }
  }
  const inmueblesMarcadosCount = inmueblesTodos.length;
  if (inmueblesMarcadosCount === 0) {
    avisos.push("No hay activos marcados como inmueble en Sanyus.");
  } else if (inmuebles.length === 0) {
    avisos.push(
      `Ningún inmueble tiene ingresos ni gastos en ${params.ejercicio}; no procede detallarlos en el 184 de este ejercicio.`
    );
  }
  for (const inm of inmuebles) {
    if (!inm.campos.numero_catastro?.trim() && inm.situacion.codigo !== 5) {
      avisos.push(`${inm.nombre}: sin referencia catastral.`);
    }
    if (!inm.participacionOk) {
      avisos.push(
        `${inm.nombre}: participación suma ${formatParticipacionPct(inm.participacionSuma)} (debe ser 100%).`
      );
    }
  }

  return {
    ejercicio: params.ejercicio,
    entidad,
    participes,
    inmuebles,
    inmueblesExcluidos,
    inmueblesMarcadosCount,
    totales,
    atribuciones,
    avisos,
  };
}

export function campoLabel(slug: InmueblePlantillaSlug): string {
  return INMUEBLE_FIELD_META[slug]?.label ?? slug;
}
