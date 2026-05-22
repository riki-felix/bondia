---
name: bondia-netlify-functions
description: >-
  Crea y modifica Netlify Functions de Bondia: wrapHandler, serviceSupabase,
  _shared, _bloqueHandlers y convención de nombres createCasaX/createSanyusX.
  Usar al añadir API serverless, mutaciones Supabase o endpoints
  /.netlify/functions en Bondia.
disable-model-invocation: true
---

# Bondia — Netlify Functions

## Ubicación y despliegue

- Directorio: `netlify/functions/` (config en `netlify.toml` `[functions]`)
- URL: `/.netlify/functions/<nombreArchivoSinTs>`
- Invocación desde UI: `fetch(cfg.endpoints.createGasto, { method: 'POST', body: JSON.stringify(...) })`

## Variables obligatorias

`netlify/functions/_shared.ts` exige:

- `SUPABASE_URL` o `PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE` o `SUPABASE_SERVICE_ROLE_KEY`

`ensureConfig()` valida antes de cada operación. `serviceSupabase()` usa service role sin sesión.

## Utilidades `_shared.ts`

| Función | Uso |
|---------|-----|
| `json(payload, status)` | Respuesta JSON + CORS `*` |
| `ok()` | 204 sin cuerpo |
| `parseBody(event.body)` | JSON del POST |
| `toMoneyOrNull`, `toDateOrNull` | Validación formato español / fechas ISO |
| `slugifyEs`, `emptyOrNull`, `pickFrom` | Texto y enums |

## Patrón `wrapHandler`

En `_bloqueHandlers.ts`:

- Solo acepta **POST** (y OPTIONS para CORS).
- Envuelve errores y log con `label` (nombre de la function).

```typescript
import type { Handler } from '@netlify/functions';
import { handleCreateGasto, wrapHandler } from './_bloqueHandlers';

export const handler: Handler = wrapHandler(
  (body) => handleCreateGasto('casa_gastos', body),
  'createCasaGasto'
);
```

Functions que no son bloque (propiedades, cartera, settlements) implementan su propio handler pero deben usar `ensureConfig`, `serviceSupabase`, `json`.

## Convención de nombres

| Dominio | Patrón | Ejemplos |
|---------|--------|----------|
| Casa | `createCasaGasto`, `updateCasaActivo` | PascalCase tras prefijo bloque |
| Sanyus | `createSanyusGasto`, … | Espejo de Casa |
| Compartido | Sin prefijo bloque | `createActivoTag`, `createCaracteristica` |
| Propiedades | `createProperty`, `updateProperty` | |
| Liquidaciones | `createSettlement`, `swapSettlementOrder` | |
| Cartera | `createMovimientoCartera`, `updateAhorroCartera` | |

Archivo = nombre exportado en camelCase (p. ej. `createCasaGasto.ts`).

## Extender CRUD de bloque

1. Añadir lógica en `_bloqueHandlers.ts` (`handleCreateActivo`, etc.) si falta campo o validación.
2. Crear o actualizar thin wrapper en `netlify/functions/`.
3. Registrar URL en `src/lib/bloqueConfig.ts` → `endpoints`.
4. Probar con `netlify dev`, no solo `npm run dev`.

## Subidas de archivos

`uploadCasaActivoFoto` / `uploadSanyusActivoFoto` — bucket `activos-fotos`. Propiedades: bucket `propiedades-images`.

## Errores frecuentes

- Olvidar `export const handler` (Netlify no registra la function).
- Mutar desde React con `getSupabase().from().insert()` — prohibido para datos de app.
- Method GET en handlers que solo esperan POST.
- No replicar function Sanyus tras crear la de Casa.

## Checklist nueva function

1. ¿Existe handler genérico en `_bloqueHandlers`?
2. Wrapper + `wrapHandler` + label único
3. Entrada en `bloqueConfig.endpoints` (ambos bloques si aplica)
4. Variable `SUPABASE_SERVICE_ROLE` en `.env` local
5. POST desde componente React con manejo de `error` en JSON de respuesta
