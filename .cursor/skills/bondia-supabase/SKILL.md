---
name: bondia-supabase
description: >-
  Gestiona esquema Supabase de Bondia: migraciones SQL, tablas por dominio, RLS,
  storage buckets e imports. Usar al crear migraciones, cambiar columnas,
  seeds o scripts de importación en Bondia.
disable-model-invocation: true
---

# Bondia — Supabase y esquema

## Enfoque

PostgreSQL en Supabase. **Sin ORM**: tipos manuales en `src/lib/*.ts`, migraciones SQL en `supabase/migrations/`. Aplicar migraciones **manualmente** en el SQL Editor de Supabase (no hay CI de BD en el repo).

## Dominios y migraciones de referencia

| Dominio | Migración ejemplo |
|---------|-------------------|
| Casa | `20260331000000_create_casa.sql` |
| Sanyus | `20260402000000_create_sanyus.sql` |
| Áreas Casa | `20260331300000_create_casa_areas.sql` |
| Liquidaciones | `20260311000000_create_liquidaciones.sql` |
| Métodos pago | `20260402500000_create_metodos_pago.sql` |
| Cartera | `20260402600000_create_cartera.sql` |
| Activos valor/foto | `20260409000000_activos_valor_estimado_foto.sql` |
| Tags | `20260409100000_activos_tags.sql` |
| Características | `20260409200000_activos_caracteristicas.sql` |
| Feature tasks | `20260519190000_create_feature_tasks.sql` |

Archivos `step*.sql` en la misma carpeta: evolución de liquidaciones/propiedades (aplicar en orden lógico si el proyecto es nuevo).

## Tablas principales

**Inmobiliario:** `propiedades`, `liquidaciones` (columnas generadas: retención, neto, efectivo).

**Por bloque (`casa_*` / `sanyus_*`):** gastos, ingresos, activos_v2, categorías, overrides, areas.

**Cartera:** `cartera_movimientos`, `cartera_ajustes`.

**Auxiliar:** `metodos_pago`, `feature_tasks`, `activos_tags`, `activos_caracteristicas`.

**Legacy starter:** `frameworks` — ignorar salvo limpieza.

## RLS y seguridad

Políticas permisivas (`USING (true)`) en tablas de aplicación. La app confía en red interna; **mutaciones reales** van por service role en Netlify Functions. No asumir que RLS protege escrituras desde el cliente anon.

## Storage buckets

| Bucket | Uso |
|--------|-----|
| `activos-fotos` | Fotos activos Casa/Sanyus (público) |
| `property-images` | Imágenes propiedades (público) |
| `bondia-documentos` | PDF/JPG privados; URLs firmadas vía Netlify Functions |

Tabla `documentos`: metadatos, `sort_order`, `entity_type` + `entity_id`, `bloque` (`engine`|`casa`|`sanyus`). Migración `20260522140000_create_documentos.sql`.

## ENUM y tipos SQL

- `casa_frecuencia` — semanal, mensual, anual, puntual, variable, etc. (usado en gastos/ingresos de ambos bloques según migración).

## Scripts e imports en raíz

- `propiedades_schema.sql`, `import_*.sql`, `generar_*.py` — herramientas puntuales; leer README asociado (`PROPERTY_IMPORT_README.md`, `PROPIEDADES_*_README.md`).
- Seeds de datos en migraciones `*_import_*_2026.sql`.

## Convención nueva migración

1. Nombre: `YYYYMMDDHHMMSS_descripcion.sql` en `supabase/migrations/`.
2. Si afecta bloques espejo: alterar **ambas** tablas `casa_*` y `sanyus_*`.
3. RLS: replicar patrón `ENABLE ROW LEVEL SECURITY` + policy allow si la tabla es de app.
4. Actualizar tipos TS en `bloqueTypes.ts` / `propertyTypes.ts` según corresponda.
5. Documentar en commit que la migración debe aplicarse en Supabase prod.

## Lo que no crear sin requisito explícito

- Tabla `users` / perfiles
- Cuentas bancarias / `transactions`
- Tipos generados con Supabase CLI (el proyecto no los usa hoy)

## Tipos TypeScript

| Archivo | Entidades |
|---------|-----------|
| `bloqueTypes.ts` | Gasto, Ingreso, Activo, overrides, cartera |
| `propertyTypes.ts` | Property |
| `settlementTypes.ts` | Settlement |
| `supabase/types.ts` | Legacy frameworks |

Ver `reference.md` para diagrama de relaciones resumido.
