-- Add favorito flag to all 6 category tables (casa + sanyus)

ALTER TABLE public.casa_gastos_categorias
  ADD COLUMN IF NOT EXISTS favorito BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.casa_ingresos_categorias
  ADD COLUMN IF NOT EXISTS favorito BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.casa_activos_categorias
  ADD COLUMN IF NOT EXISTS favorito BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.sanyus_gastos_categorias
  ADD COLUMN IF NOT EXISTS favorito BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.sanyus_ingresos_categorias
  ADD COLUMN IF NOT EXISTS favorito BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.sanyus_activos_categorias
  ADD COLUMN IF NOT EXISTS favorito BOOLEAN NOT NULL DEFAULT false;
