---
name: bondia-bloques
description: >-
  Explica y extiende los bloques Casa y Sanyus en Bondia: bloqueConfig, tablas
  espejo, handlers compartidos y componentes bloque. Usar al añadir campos,
  pantallas o CRUD en casa_* o sanyus_*.
disable-model-invocation: true
---

# Bondia — bloques Casa y Sanyus

## Concepto

Dos patrimonios paralelos con la misma estructura. La fuente de verdad de mapeos es `src/lib/bloqueConfig.ts` (`CASA_CONFIG`, `SANYUS_CONFIG`).

Cada `BloqueConfig` define:

- `tables` — nombres Supabase
- `joins` — expresiones `.select()` para categorías
- `endpoints` — URLs `/.netlify/functions/...`
- `routes` — rutas Astro

## Tablas por bloque (prefijo `casa_` / `sanyus_`)

| Concepto | Tablas |
|----------|--------|
| Gastos | `*_gastos`, `*_gastos_categorias`, `*_gastos_overrides` |
| Ingresos | `*_ingresos`, `*_ingresos_categorias`, `*_ingresos_overrides` |
| Activos (bienes) | `*_activos_v2`, `*_activos_categorias` |
| Áreas | `*_areas`, `*_areas_categorias` |
| Puente | `*_activos_tags`, `*_activos_caracteristica_valores` |

**Compartidas entre bloques:** `activos_tags`, `activos_caracteristicas` (+ functions sin prefijo bloque).

## Handlers compartidos

`netlify/functions/_bloqueHandlers.ts` implementa CRUD pasando el nombre de tabla:

```typescript
// createCasaGasto.ts
export const handler = wrapHandler(
  (body) => handleCreateGasto('casa_gastos', body),
  'createCasaGasto'
);
```

Para Sanyus: misma función con `'sanyus_gastos'` y archivo `createSanyusGasto.ts`.

Antes de crear handler nuevo, comprobar si `handleCreateGasto`, `handleUpdateActivo`, etc. ya cubren el caso.

## UI

Componentes en `src/components/bloque/` reciben `config: BloqueConfig`:

- `BloqueGastosTable`, `BloqueIngresosTable`, `BloqueActivosTable`
- `BloqueControlDashboard`, `BloqueActivoDetail`, managers de categorías/áreas/tags

Páginas en `src/pages/casa/` y `src/pages/sanyus/` importan el config correspondiente y el componente bloque.

## Checklist: cambio en un bloque (espejo)

Cuando el cambio aplica a ambos patrimonios:

1. **SQL**: migración para `casa_*` y `sanyus_*` (o una migración con ambas tablas).
2. **Tipos**: `src/lib/bloqueTypes.ts` si afecta a gastos/ingresos/activos.
3. **Handlers**: extender `_bloqueHandlers.ts` si la lógica es nueva; si no, solo wrappers Casa + Sanyus.
4. **Functions**: `createCasaX.ts` + `createSanyusX.ts` (o actualizar existentes).
5. **bloqueConfig**: `endpoints` en ambos configs si hay nueva function.
6. **UI bloque**: un solo componente parametrizado con `config`.
7. **Páginas**: solo si la ruta o query nueva difiere; suelen ser espejo `casa/` / `sanyus/`.

Si el usuario pide **solo Casa** o **solo Sanyus**, documentar la excepción y no tocar el otro bloque.

## Checklist: nuevo campo en activos

1. `ALTER` en `casa_activos_v2` y `sanyus_activos_v2` (migración en `supabase/migrations/`).
2. Campos en `handleCreateActivo` / `handleUpdateActivo` en `_bloqueHandlers.ts`.
3. Tipo `BloqueActivo` en `bloqueTypes.ts`.
4. Formulario en `BloqueActivoDetail` o tabla según UI.
5. No hace falta nueva function si update existente acepta el campo.

## Cálculos

`calcularImporteMes` y frecuencias en `bloqueTypes.ts`. Overrides en tablas `*_gastos_overrides` / `*_ingresos_overrides`.

## Referencia endpoints

Ver `reference.md` (copia de `bloqueConfig.ts`) o el archivo fuente directamente.
