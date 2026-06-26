# Archivo de migraciones históricas

SQL que **ya está aplicado** en el proyecto remoto (`zcezehuuxkravxjfdrbm`), pero se ejecutó
manualmente (SQL Editor / dashboard) o con nombres distintos en el historial de Supabase.

## No usar con `db:apply`

Estos archivos son **solo referencia** (documentar evolución del esquema, bootstrap teórico).
El agente y `npm run db:status` **ignoran** esta carpeta.

## Carpetas

| Carpeta | Contenido |
|---------|-----------|
| `applied-manually/` | Migraciones locales que nunca entraron en el historial remoto con el mismo nombre |

## Flujo actual

1. Esquema productivo = estado real en Supabase (18+ entradas en historial remoto).
2. **Nuevas** migraciones → `supabase/migrations/*.sql` (raíz, sin subcarpetas).
3. Aplicar con MCP `apply_migration` o `npm run db:apply -- <archivo>`.
4. Verificar con `npm run db:status`.

## Recrear BD desde cero

No hay un único script lineal fiable: usar `npm run db:backup` del entorno actual o
revisar el orden lógico en `applied-manually/` + historial remoto.
