// Helpers Catastro para activos inmueble (valores en característica_valores)

import { isCatastroReferenciaValidada, type CatastroValidationResult } from "@/lib/catastroApi";
import type { ActivoCaracteristica } from "@/lib/bloqueTypes";
import type { InmueblePlantillaSlug } from "@/lib/sanyusInmueblePlantilla";

function slugToId(
  plantilla: ActivoCaracteristica[],
  slug: InmueblePlantillaSlug
): string | undefined {
  return plantilla.find((c) => c.slug === slug)?.id;
}

function setSlugValue(
  plantilla: ActivoCaracteristica[],
  next: Record<string, string>,
  slug: InmueblePlantillaSlug,
  value: string,
  onlyIfEmpty = false
) {
  const id = slugToId(plantilla, slug);
  if (!id) return;
  if (onlyIfEmpty && (next[id] ?? "").trim()) return;
  next[id] = value;
}

export function getInmuebleCatastroValidation(
  plantilla: ActivoCaracteristica[],
  caracValores: Record<string, string>,
  referencia: string
): { validatedReferencia: string; validatedAt: string; isValidated: boolean } {
  const validatedReferencia =
    caracValores[slugToId(plantilla, "catastro_referencia_validada") ?? ""] ?? "";
  const validatedAt =
    caracValores[slugToId(plantilla, "catastro_validado_at") ?? ""] ?? "";
  const isValidated = isCatastroReferenciaValidada(
    referencia,
    validatedReferencia,
    validatedAt
  );
  return { validatedReferencia, validatedAt, isValidated };
}

export function touchInmuebleCatastroReferencia(
  plantilla: ActivoCaracteristica[],
  prev: Record<string, string>,
  newRef: string
): Record<string, string> {
  const next = { ...prev };
  setSlugValue(plantilla, next, "numero_catastro", newRef);

  const { validatedReferencia, validatedAt } = getInmuebleCatastroValidation(
    plantilla,
    prev,
    newRef
  );
  const stillValid = isCatastroReferenciaValidada(newRef, validatedReferencia, validatedAt);

  if (!stillValid) {
    setSlugValue(plantilla, next, "catastro_referencia_validada", "");
    setSlugValue(plantilla, next, "catastro_validado_at", "");
  }

  return next;
}

export function applyCatastroToInmuebleCaracValores(
  plantilla: ActivoCaracteristica[],
  prev: Record<string, string>,
  result: CatastroValidationResult
): Record<string, string> {
  const next = { ...prev };

  setSlugValue(plantilla, next, "numero_catastro", result.referenciaCatastral);
  setSlugValue(plantilla, next, "catastro_referencia_validada", result.referenciaCatastral);
  setSlugValue(plantilla, next, "catastro_validado_at", new Date().toISOString());
  setSlugValue(plantilla, next, "superficie_m2", String(result.superficieConstruidaM2), true);
  if (result.superficieViviendaM2 != null) {
    setSlugValue(
      plantilla,
      next,
      "superficie_registrada_m2",
      String(result.superficieViviendaM2),
      true
    );
  }
  if (result.anioConstruccion != null) {
    setSlugValue(
      plantilla,
      next,
      "anio_construccion",
      String(result.anioConstruccion),
      true
    );
  }

  return next;
}
