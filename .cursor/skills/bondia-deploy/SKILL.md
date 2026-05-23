---
name: bondia-deploy
description: >-
  Despliega y desarrolla Bondia en Netlify: netlify dev, build, variables de
  entorno, extensión Supabase y migraciones manuales. Usar al configurar entorno
  local, deploy a producción o depurar functions en Bondia.
disable-model-invocation: true
---

# Bondia — deploy y entorno local

## Producción (Netlify)

1. Push al repo conectado a Netlify (sin GitHub Actions en el repo).
2. Build: `npm run build` → `astro check && astro build`.
3. Publish: `dist/` (`netlify.toml`).
4. Functions: carpeta `netlify/functions/` desplegada automáticamente.
5. Adapter: `@astrojs/netlify` en `astro.config.ts` (SSR, no sitio estático).

Template Netlify declara extensión **Supabase** (`[template] required-extensions` en `netlify.toml`) para inyectar variables.

## Variables de entorno

| Variable | Dónde | Obligatoria |
|----------|-------|-------------|
| `PUBLIC_SUPABASE_URL` | Cliente Astro/React | Sí |
| `PUBLIC_SUPABASE_ANON_KEY` | Cliente | Sí |
| `SUPABASE_URL` | Functions (fallback) | Recomendada |
| `SUPABASE_ANON_KEY` | Compat | Opcional |
| `SUPABASE_SERVICE_ROLE` | Functions (mutaciones) | **Sí** para CRUD |
| `PUBLIC_SITE_URL` | URLs absolutas | Dev: `http://localhost:8888` |
| `COMMIT_REF` | Build Netlify → `__APP_VERSION__` | Auto en CI |

Copiar `.env.example` → `.env` y rellenar. **Nunca** commitear `.env`.

## Desarrollo local

```bash
npm install
netlify link          # enlazar sitio desplegado
npm run dev:netlify
```

Abrir **http://localhost:8888** (proxy). Astro corre en 4321; HMR configurado en `astro.config.ts` (`clientPort`/`port` 4321).

| Comando | Functions | Puerto | Notas |
|---------|-----------|--------|-------|
| `npm run dev` | No | 4321 | Solo frontend |
| `npm run dev:netlify` | Sí | 8888 | Desarrollo completo |
| `npm run check` | — | — | Seguro con netlify dev activo |
| `npm run build` | — | — | **Parar netlify dev antes** (ver abajo) |

Para probar crear/editar/borrar, usar siempre **netlify dev**.

## Base de datos

Tras crear proyecto Supabase:

1. Ejecutar SQL de `supabase/migrations/` en orden (timestamp en nombre de archivo).
2. Opcional: seeds en migraciones `*_import_*` o `supabase/seed.csv` (legacy).

No hay pipeline automático de migraciones en deploy.

## Supabase MCP en Cursor (migraciones por el agente)

Bondia puede usar el **MCP oficial de Supabase** para que el agente liste tablas, ejecute SQL y aplique migraciones sin pegar SQL a mano.

### Configuración (recomendada: nivel proyecto)

1. Crear token en [Supabase → Account → Access Tokens](https://supabase.com/dashboard/account/tokens) (PAT, no la anon key del `.env`).
2. Obtener **Project ref** del dashboard (Settings → General) o del host `https://<ref>.supabase.co`.
3. Copiar [`.cursor/mcp.json.example`](../../mcp.json.example) → `.cursor/mcp.json` y sustituir `TU_PROJECT_REF` y `TU_PERSONAL_ACCESS_TOKEN`.
4. **Cursor → Settings → Tools & MCP**: activar servidor `supabase`, reiniciar si no aparecen herramientas.
5. Chat nuevo; revisar cada llamada a herramienta antes de aprobar.

**No** commitear `.cursor/mcp.json` (está en `.gitignore`).

### Herramientas útiles para Bondia

- `list_migrations` / `apply_migration` — aplicar archivos de `supabase/migrations/`
- `execute_sql` — consultas puntuales
- `list_tables` — comprobar esquema tras un cambio

Para migraciones, **no** usar `read_only=true`. Opcional: `--project-ref` en args para limitar al proyecto Bondia.

### Alternativa sin MCP

```bash
supabase link --project-ref <ref>
supabase db push
```

Requiere Supabase CLI (`supabase` en PATH) y login `supabase login`.

## Checklist deploy / nuevo entorno

- [ ] Variables en panel Netlify (o extensión Supabase)
- [ ] `SUPABASE_SERVICE_ROLE` configurada (functions fallan sin ella)
- [ ] Migraciones aplicadas en Supabase prod
- [ ] `netlify dev` verifica mutaciones antes de merge
- [ ] `npm run build` pasa localmente (`astro check`)

## Versión en UI

`__APP_VERSION__` = primeros 7 caracteres de `COMMIT_REF` o `git rev-parse --short HEAD` (fallback `dev`).

## Renovate

`renovate.json` extiende preset Netlify — actualizaciones de dependencias, no sustituye deploy.

## Troubleshooting

| Síntoma | Causa probable |
|---------|----------------|
| 404 en `/.netlify/functions/*` | Solo `npm run dev` |
| 404 en `/_astro/*.js` tras cambios del agente | Se ejecutó `npm run build` con netlify dev activo |
| Terminal: `Removed function …` + `Loaded function ssr` | Mismo caso — reiniciar `npm run dev:netlify` |
| Config: SUPABASE_SERVICE_ROLE ausente | Falta en `.env` |
| Mutaciones OK en local, fallan en prod | Vars no en Netlify |
| Lecturas vacías | `PUBLIC_*` incorrectas o RLS/proyecto equivocado |

### Desarrollo continuo roto

Si tras una tarea del agente hay que reiniciar netlify dev: el agente probablemente corrió `npm run build`. Desde ahora:

- `prebuild` bloquea el build si el puerto 8888 está en uso (`FORCE_BUILD=1` para forzar).
- El agente debe usar `npm run check` durante sesiones de dev.
- Recuperación: Ctrl+C → `npm run dev:netlify` → refrescar :8888.
