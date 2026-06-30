-- Fase 3: propiedades es la única fuente de verdad para liquidación operativa.
-- La tabla liquidaciones queda obsoleta tras backfill en 20260701120000.

DROP TRIGGER IF EXISTS set_liquidaciones_updated_at ON public.liquidaciones;
DROP FUNCTION IF EXISTS public.update_liquidaciones_updated_at();
DROP TABLE IF EXISTS public.liquidaciones CASCADE;
