// Ficha persistente Modelo 184 (tabla sanyus_modelo184_config)

import type { Modelo184EntidadConfig, Modelo184ParticipeConfig } from "@/lib/modelo184";

export const MODELO184_CONFIG_ID = "default" as const;

/** Sanyus CB — siempre comunidad de bienes (modelo 184). */
export const MODELO184_TIPO_ENTIDAD = "comunidad_bienes" as const;
export const MODELO184_TIPO_ENTIDAD_LABEL = "Comunidad de bienes";

export interface SanyusModelo184ConfigRow {
  id: string;
  tipo_entidad: string;
  nif: string;
  denominacion: string;
  domicilio: string;
  municipio: string;
  provincia: string;
  codigo_postal: string;
  carlos_nif: string;
  laura_nif: string;
  izan_nif: string;
  notas: string | null;
  updated_at: string;
}

export interface Modelo184FichaConfig {
  entidad: Modelo184EntidadConfig & {
    notas: string;
  };
  participes: Modelo184ParticipeConfig[];
}

export const DEFAULT_MODELO184_FICHA: Modelo184FichaConfig = {
  entidad: {
    nif: "",
    denominacion: "Sanyus CB",
    domicilio: "",
    municipio: "",
    provincia: "",
    codigoPostal: "",
    notas: "",
  },
  participes: [
    { key: "carlos", label: "Carlos", slug: "participacion_carlos", nif: "" },
    { key: "laura", label: "Laura", slug: "participacion_laura", nif: "" },
    { key: "izan", label: "Izan", slug: "participacion_izan", nif: "" },
  ],
};

export function fichaFromRow(row: SanyusModelo184ConfigRow | null | undefined): Modelo184FichaConfig {
  if (!row) return DEFAULT_MODELO184_FICHA;
  return {
    entidad: {
      nif: row.nif?.trim() ?? "",
      denominacion: row.denominacion?.trim() || "Sanyus CB",
      domicilio: row.domicilio?.trim() ?? "",
      municipio: row.municipio?.trim() ?? "",
      provincia: row.provincia?.trim() ?? "",
      codigoPostal: row.codigo_postal?.trim() ?? "",
      notas: row.notas?.trim() ?? "",
    },
    participes: [
      {
        key: "carlos",
        label: "Carlos",
        slug: "participacion_carlos",
        nif: row.carlos_nif?.trim() ?? "",
      },
      {
        key: "laura",
        label: "Laura",
        slug: "participacion_laura",
        nif: row.laura_nif?.trim() ?? "",
      },
      {
        key: "izan",
        label: "Izan",
        slug: "participacion_izan",
        nif: row.izan_nif?.trim() ?? "",
      },
    ],
  };
}

export function rowFromFicha(ficha: Modelo184FichaConfig): Omit<
  SanyusModelo184ConfigRow,
  "id" | "updated_at"
> {
  const carlos = ficha.participes.find((p) => p.key === "carlos");
  const laura = ficha.participes.find((p) => p.key === "laura");
  const izan = ficha.participes.find((p) => p.key === "izan");
  return {
    tipo_entidad: MODELO184_TIPO_ENTIDAD,
    nif: ficha.entidad.nif.trim(),
    denominacion: ficha.entidad.denominacion.trim() || "Sanyus CB",
    domicilio: ficha.entidad.domicilio.trim(),
    municipio: ficha.entidad.municipio.trim(),
    provincia: ficha.entidad.provincia.trim(),
    codigo_postal: ficha.entidad.codigoPostal.trim(),
    carlos_nif: carlos?.nif.trim() ?? "",
    laura_nif: laura?.nif.trim() ?? "",
    izan_nif: izan?.nif.trim() ?? "",
    notas: ficha.entidad.notas.trim() || null,
  };
}
