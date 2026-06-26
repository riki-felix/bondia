# Esquema resumido Bondia

```
propiedades 1──1 liquidaciones  (id = propiedad_id)

casa_gastos *──1 casa_gastos_categorias
casa_gastos 1──* casa_gastos_overrides

sanyus_* (espejo de casa_*)

activos_tags *──* casa_activos_v2 (casa_activos_tags)
activos_tags *──* sanyus_activos_v2 (sanyus_activos_tags)

activos_caracteristicas 1──* *_activos_caracteristica_valores

cartera_movimientos (origen/destino: inversiones|familiar|sanyus|ahorro)
cartera_ajustes (bolsillo ahorro)

metodos_pago ← casa_gastos, sanyus_gastos (metodo_pago_id)
```

No hay FK a `auth.users` en el esquema de aplicación.

---

# Operaciones Supabase — referencia rápida

## Project ref Bondia

`supabase/.project-ref` — commiteado, no es secreto.

## Variables `.env` para scripts

| Variable | Uso |
|----------|-----|
| `SUPABASE_ACCESS_TOKEN` | PAT para Management API (`db:status`, `db:apply`) |
| `SUPABASE_PROJECT_REF` | Opcional; por defecto lee `.project-ref` |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE` | App y functions (no sustituyen el PAT) |

## Auditoría antes de migración destructiva

```sql
-- Ejemplo vía MCP execute_sql
SELECT COUNT(*) FROM propiedades;
SELECT column_name, data_type, numeric_precision, numeric_scale
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'liquidaciones';
```

## Restaurar backup

```bash
# Solo en emergencia, con backup .sql generado por db:backup
psql "$DATABASE_URL" -f supabase/backups/bondia-YYYYMMDD-HHMMSS.sql
```

Usar connection string del dashboard (Settings → Database). **Probar primero en rama/proyecto de staging** si existe.

## Migraciones históricas fuera del repo

`npm run db:status` puede listar entradas «solo en remoto». No borrarlas del historial sin `supabase migration repair` y criterio explícito del usuario.
