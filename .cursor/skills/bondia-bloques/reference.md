# Endpoints Casa (Sanyus: sustituir Casa → Sanyus en nombre de function)

| Acción | Function |
|--------|----------|
| CRUD gasto | create/update/deleteCasaGasto |
| CRUD ingreso | create/update/deleteCasaIngreso |
| CRUD activo | create/update/deleteCasaActivo |
| Foto activo | uploadCasaActivoFoto, deleteCasaActivoFoto |
| CRUD categoría | create/update/deleteCasaCategoria |
| CRUD área | create/update/deleteCasaArea, syncCasaAreaCategorias |
| Override | upsertCasaOverride |
| Tags activo | syncCasaActivoTags (+ create/update/deleteActivoTag compartidos) |
| Características | syncCasaCaracteristicaValores (+ create/update/deleteCaracteristica compartidos) |

Sanyus usa el mismo listado con prefijo `Sanyus` (p. ej. `createSanyusGasto`).

Tablas: ver `CASA_CONFIG.tables` y `SANYUS_CONFIG.tables` en `src/lib/bloqueConfig.ts`.
