---
name: bondia-supabase
description: >-
  Gestiona Supabase en Bondia: migraciones SQL, aplicar/cotejar con remoto,
  backups, RLS, storage e imports. Usar al crear migraciones, aplicar cambios
  en BD, auditar esquema, generar backups o interactuar con el proyecto remoto.
---

# Bondia — Supabase (esquema y operaciones)

## Prioridad de herramientas

| Tarea | 1ª opción (agente) | 2ª opción (terminal) |
|-------|-------------------|------------------------|
| Ver migraciones pendientes | MCP `list_migrations` + comparar con `supabase/migrations/` | `npm run db:status` |
| Aplicar migración DDL | MCP `apply_migration` | `npm run db:apply -- <archivo.sql>` |
| Consulta / auditoría datos | MCP `execute_sql` (SELECT) | — |
| Backup completo | `npm run db:backup` (CLI) | Dashboard → Backups |
| Push todas las pendientes | `supabase db push` (`npm run db:push`) | — |
| Inspeccionar esquema | MCP `list_tables` | — |

**DDL (CREATE/ALTER/DROP):** siempre `apply_migration` o `npm run db:apply` — **nunca** `execute_sql` para DDL (provoca drift en el historial).

**DML (SELECT/INSERT/UPDATE):** `execute_sql`. Antes de UPDATE masivo → `npm run db:backup`.

## Configuración MCP (una vez por máquina)

1. PAT en [Account → Access Tokens](https://supabase.com/dashboard/account/tokens).
2. Copiar `.cursor/mcp.json.example` → `.cursor/mcp.json` y poner el token.
3. Project ref: `supabase/.project-ref` (o `SUPABASE_PROJECT_REF` en `.env`).
4. Cursor → Settings → Tools & MCP → activar `supabase` → reiniciar chat.
5. **No** commitear `.cursor/mcp.json`.

### Herramientas MCP relevantes

- `list_migrations` — historial remoto
- `apply_migration` — `{ name, query }` desde archivo en `supabase/migrations/`
- `execute_sql` — consultas (no DDL)
- `list_tables` — columnas y tipos tras un cambio
- `get_advisors` — avisos de seguridad (RLS, etc.)

Para migraciones **no** usar `read_only=true` en la config MCP.

## Scripts npm (requieren `SUPABASE_ACCESS_TOKEN` en `.env`)

```bash
npm run db:status      # local vs remoto — pendientes
npm run db:migrations  # listado detallado
npm run db:apply -- 20260615120000_ejemplo.sql
npm run db:apply -- 20260615120000_ejemplo.sql --dry-run
npm run db:backup      # supabase db dump → supabase/backups/ (gitignored)
npm run db:push        # supabase CLI: todas las pendientes
```

Primera vez backup/push:

```bash
brew install supabase/tap/supabase   # o docs oficiales
supabase login
supabase link --project-ref $(cat supabase/.project-ref)
```

## Flujo del agente al aplicar una migración

1. **Backup** si el cambio es destructivo o toca datos: `npm run db:backup`.
2. **Crear** archivo `supabase/migrations/YYYYMMDDHHMMSS_descripcion.sql`.
3. **Revisar** dependencias (Casa ↔ Sanyus espejo, RLS, columnas generadas).
4. **Dry-run:** `npm run db:apply -- <archivo> --dry-run`.
5. **Aplicar:** MCP `apply_migration` o `npm run db:apply -- <archivo>`.
6. **Verificar:** `npm run db:status` + `list_tables` / consulta de prueba.
7. **Código:** actualizar tipos TS (`propertyTypes.ts`, `bloqueTypes.ts`, etc.) si aplica.
8. **Commit:** mensaje indicando que la migración debe estar aplicada en prod.

## Enfoque de esquema

PostgreSQL en Supabase. **Sin ORM**: tipos manuales en `src/lib/*.ts`, migraciones en `supabase/migrations/`.

Archivos `step*.sql`: evolución histórica liquidaciones/propiedades (proyectos nuevos: aplicar en orden lógico).

## Dominios y migraciones de referencia

| Dominio | Migración ejemplo |
|---------|-------------------|
| Casa | `20260331000000_create_casa.sql` |
| Sanyus | `20260402000000_create_sanyus.sql` |
| Liquidaciones | `20260311000000_create_liquidaciones.sql` |
| RLS anon | `20260603120000_restore_bondia_anon_rls.sql` |
| Liquidación 1:1 | `20260608120000_liquidaciones_propiedad_1to1.sql` |

Ver `reference.md` para diagrama de relaciones.

## Tablas principales

**Inmobiliario:** `propiedades`, `liquidaciones` (columnas generadas: retención, neto, efectivo).

**Por bloque:** `casa_*` / `sanyus_*` (gastos, ingresos, activos_v2, categorías, overrides, areas).

**Cartera:** `cartera_movimientos`, `cartera_ajustes` (`NUMERIC` sin escala fija — cuidado al redondear).

**Auxiliar:** `metodos_pago`, `feature_tasks`, `documentos`.

## RLS y seguridad

- Lectura UI: rol **`anon`** (`PUBLIC_SUPABASE_ANON_KEY`).
- Mutaciones app: **`service_role`** en Netlify Functions.
- Patrón: `bondia_anon_select` (solo SELECT) — ver `20260603120000_restore_bondia_anon_rls.sql`.
- **No** sustituir SELECT anon por `auth.uid()` sin login real.

## Storage buckets

| Bucket | Uso |
|--------|-----|
| `activos-fotos` | Fotos activos (público) |
| `property-images` | Imágenes propiedades (público) |
| `bondia-documentos` | Documentos privados (URLs firmadas vía functions) |

## Convención nueva migración

1. Nombre: `YYYYMMDDHHMMSS_descripcion.sql` en `supabase/migrations/`.
2. Bloques espejo: alterar **casa_* y sanyus_*** si aplica.
3. RLS: `bondia_reset_anon_select_rls('public.tabla')` o política equivalente.
4. Tipos TS y functions Netlify si hay columnas nuevas.
5. Idempotencia: `IF NOT EXISTS`, `DROP IF EXISTS` cuando sea seguro.

## Lo que no crear sin requisito explícito

- Tabla `users` / perfiles
- Cuentas bancarias / `transactions`
- Tipos generados con Supabase CLI (el proyecto no los usa hoy)

## Tipos TypeScript

| Archivo | Entidades |
|---------|-----------|
| `bloqueTypes.ts` | Gasto, Ingreso, Activo, cartera |
| `propertyTypes.ts` | Property |
| `settlementTypes.ts` | Settlement |
