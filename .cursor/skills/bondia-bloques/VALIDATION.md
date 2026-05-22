# Validación del skill bondia-bloques

Checklist verificado contra el repo para **añadir un campo a activos** (ej. `ubicacion`):

| Paso | Archivo / acción | Estado |
|------|------------------|--------|
| 1. Migración SQL | `supabase/migrations/` — `casa_activos_v2` + `sanyus_activos_v2` | Documentado |
| 2. Handlers | `handleCreateActivo` / `handleUpdateActivo` en `_bloqueHandlers.ts` | Existen (~L146, L177) |
| 3. Wrappers | `createCasaActivo.ts`, `updateCasaActivo.ts` (+ Sanyus) | Patrón `wrapHandler` |
| 4. Tipos | `BloqueActivo` en `bloqueTypes.ts` | Existe |
| 5. UI | `BloqueActivoDetail.tsx` | Sin nueva function si update acepta campo |
| 6. Config | `bloqueConfig` endpoints sin cambio si no hay nueva function | OK |

No se requieren cambios al skill tras esta verificación (2026-05-22).
