# Bondia — guía para agentes

Aplicación interna de gestión patrimonial: inversiones inmobiliarias, presupuesto Casa/Sanyus, inventario de activos (bienes) y cartera virtual.

## Stack

- **Astro 5** SSR (`output: 'server'`) + **React 19** (islas `client:load`)
- **Tailwind v4** + shadcn/ui (Radix)
- **Supabase** (PostgreSQL) — sin ORM
- **Netlify**: hosting SSR (`@astrojs/netlify`) + ~64 functions en `netlify/functions/`

## Reglas de oro

1. **Lecturas**: páginas `.astro` y React usan clave anónima (`PUBLIC_SUPABASE_*` vía `supabaseClient` / `getSupabase`).
2. **Escrituras**: solo vía `fetch('/.netlify/functions/...')` → service role en functions. No insertar/actualizar desde el cliente con anon key.
3. **Casa ↔ Sanyus**: patrón espejo. Cambios en un bloque suelen replicarse en el otro (tablas, config, functions, páginas).
4. **Dev local con mutaciones**: `npm run dev:netlify` (o `netlify dev --target-port 4321`) → http://localhost:8888. `npm run dev` solo no expone functions.
5. **No asumir**: cuentas bancarias, ledger de transacciones, auth multi-usuario ni Prisma.
6. **Verificación en dev**: usar `npm run check`, **no** `npm run build` con netlify dev activo (rompe HMR y functions). Ver `.cursor/rules/bondia-dev-workflow.mdc`.

## Dominios de negocio

| Área | Rutas | Tablas / API |
|------|-------|----------------|
| Dashboard | `/` | agregados varios |
| Propiedades / inversiones | `/propiedades`, `/inversiones`, `/liquidaciones` | `propiedades`, `liquidaciones` + functions `createProperty`, etc. |
| Casa | `/casa/*` | `casa_*` + `CASA_CONFIG` |
| Sanyus | `/sanyus/*` | `sanyus_*` + `SANYUS_CONFIG` |
| Cartera | `/cartera` | `cartera_movimientos`, `cartera_ajustes` |
| Ajustes | `/ajustes` | `metodos_pago`, `feature_tasks` |

Mapa técnico de bloques: `src/lib/bloqueConfig.ts`. Handlers CRUD compartidos: `netlify/functions/_bloqueHandlers.ts`.

## Skills del proyecto (invocar por nombre)

| Skill | Cuándo |
|-------|--------|
| `bondia-architecture` | Astro, routing, layout, clientes Supabase, componentes UI |
| `bondia-bloques` | Casa, Sanyus, `bloqueConfig`, tablas `casa_*` / `sanyus_*` |
| `bondia-netlify-functions` | Crear o modificar API serverless |
| `bondia-supabase` | Migraciones SQL, esquema, storage, imports |
| `bondia-deploy` | Build, variables de entorno, `netlify dev` / deploy |

Skill personal (dominio de negocio): `bondia-domain` en `~/.cursor/skills/bondia-domain/`.

## Reglas Cursor (por glob)

- `src/pages/**/*.astro` → `.cursor/rules/bondia-astro-pages.mdc`
- `netlify/functions/**/*.ts` → `.cursor/rules/bondia-netlify-fn.mdc`
- `src/components/bloque/**/*.tsx` → `.cursor/rules/bondia-bloque-react.mdc`

## Archivos de referencia

- Config bloques: `src/lib/bloqueConfig.ts`
- Tipos: `src/lib/bloqueTypes.ts`, `propertyTypes.ts`, `settlementTypes.ts`
- Migraciones: `supabase/migrations/`
- Deploy: `netlify.toml`, `.env.example`

## Comandos

```bash
npm install
netlify link
npm run dev:netlify              # desarrollo completo (alias de netlify dev)
npm run check                    # verificar tipos sin romper netlify dev
npm run build                    # producción (astro check && build); parar netlify dev antes
```

Migraciones de BD: SQL en `supabase/migrations/` — manual en Supabase UI, vía **Supabase MCP** (ver `.cursor/mcp.json.example`) o `supabase db push`.

**Documentos privados:** tabla `documentos`, bucket `bondia-documentos` (privado). Subida/lectura vía `/.netlify/functions/uploadDocument`, `getDocumentSignedUrl`, etc. UI en `/documentos` y paneles por entidad.
