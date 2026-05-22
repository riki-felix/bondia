---
name: bondia-architecture
description: >-
  Guía la arquitectura frontend de Bondia: Astro 5 SSR, routing por archivos,
  islas React, Layout, Sidebar, clientes Supabase y componentes bloque. Usar al
  modificar páginas .astro, routing, layout o integración React en Bondia.
disable-model-invocation: true
---

# Bondia — arquitectura frontend

## Stack en una frase

Astro 5 SSR en Netlify + islas React 19 + Tailwind v4/shadcn. Lecturas con Supabase anon; escrituras vía Netlify Functions (ver skill `bondia-netlify-functions`).

## Configuración clave

- `astro.config.ts`: `output: 'server'`, `adapter: netlify()`, alias `@` → `/src`, `__APP_VERSION__` desde `COMMIT_REF` o git.
- Todas las páginas de app usan `export const prerender = false`.

## Routing

File-based en `src/pages/`:

| Ruta | Patrón |
|------|--------|
| Dashboard | `index.astro` |
| Bloque Casa | `casa/*.astro`, `casa/activos/[id].astro` |
| Bloque Sanyus | `sanyus/*.astro` (espejo) |
| Propiedades | `propiedades/*.astro` |
| Cartera, inversiones, liquidaciones, ajustes | carpetas homónimas |

Navegación: `src/components/AppSidebar.tsx`. Layout global: `src/components/Layout.astro` → `SidebarLayout` (React `client:load`).

## Patrón de página `.astro`

1. `prerender = false`
2. Import `Layout`, `supabaseClient`, config (`CASA_CONFIG` / `SANYUS_CONFIG`) si aplica
3. Fetch en frontmatter con `.from(cfg.tables.*).select(...)`
4. Pasar datos serializados a componente React con `client:load`

Ejemplo: `src/pages/casa/gastos.astro` — carga gastos, overrides y categorías; renderiza `BloqueGastosTable`.

## Clientes Supabase

| Archivo | Uso |
|---------|-----|
| `src/lib/supabaseClient.ts` | SSR en `.astro` (`PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`) |
| `src/lib/supabaseReact.ts` | Singleton en islas React (`getSupabase()`) |
| `src/lib/supabaseServer.ts` | `createSupabaseServerClient` con cookies — **no usado** en páginas actuales |

No mutar datos sensibles desde estos clientes; usar endpoints en `bloqueConfig.endpoints`.

## Componentes por dominio

| Carpeta | Rol |
|---------|-----|
| `src/components/bloque/` | UI genérica Casa/Sanyus (`BloqueGastosTable`, `BloqueControlDashboard`, …) — reciben `BloqueConfig` |
| `src/components/casa/` | Wrappers o piezas específicas Casa (algunas reexportan bloque) |
| `src/components/inversiones/` | Propiedades, liquidaciones |
| `src/components/ui/` | shadcn (no editar estilo base sin necesidad) |

## Alias e imports

- `@/components/...`, `@/lib/...` vía `tsconfig` paths y Vite alias.

## API legacy

`src/pages/api/frameworks/[id]/like.ts` — resto del starter; no es el núcleo del producto.

## Checklist al añadir una pantalla

1. Crear `src/pages/<ruta>/index.astro` con `prerender = false`
2. Añadir entrada en `AppSidebar.tsx` si debe aparecer en menú
3. Reutilizar componente en `bloque/` si es Casa o Sanyus
4. Solo lectura en frontmatter; mutaciones en React → `cfg.endpoints.*`

Ver `reference.md` en este skill para lista de rutas principales.
