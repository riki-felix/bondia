-- Retención 19% incluida en retribución: retención = retribución × 19/119, neto = retribución × 100/119

-- Propiedades
ALTER TABLE public.propiedades DROP COLUMN IF EXISTS efectivo;
ALTER TABLE public.propiedades DROP COLUMN IF EXISTS retencion;

ALTER TABLE public.propiedades
  ADD COLUMN retencion NUMERIC(12,2) GENERATED ALWAYS AS (
    ROUND(retribucion * 19 / 119, 2)
  ) STORED,
  ADD COLUMN efectivo NUMERIC(12,2) GENERATED ALWAYS AS (
    ROUND(
      retribucion - ROUND(retribucion * 19 / 119, 2) - COALESCE(ingreso_banco, 0),
      2
    )
  ) STORED;

-- Liquidaciones
ALTER TABLE public.liquidaciones DROP COLUMN IF EXISTS efectivo;
ALTER TABLE public.liquidaciones DROP COLUMN IF EXISTS neto;
ALTER TABLE public.liquidaciones DROP COLUMN IF EXISTS retencion;

ALTER TABLE public.liquidaciones
  ADD COLUMN retencion NUMERIC(12,2) GENERATED ALWAYS AS (
    ROUND(retribucion * 19 / 119, 2)
  ) STORED,
  ADD COLUMN neto NUMERIC(12,2) GENERATED ALWAYS AS (
    ROUND(retribucion - ROUND(retribucion * 19 / 119, 2), 2)
  ) STORED,
  ADD COLUMN efectivo NUMERIC(12,2) GENERATED ALWAYS AS (
    ROUND(
      retribucion - ROUND(retribucion * 19 / 119, 2) - transferencia,
      2
    )
  ) STORED;

COMMENT ON COLUMN public.propiedades.retencion IS
  'IRPF 19% incluido en retribución: retribución × 19/119';
COMMENT ON COLUMN public.liquidaciones.retencion IS
  'IRPF 19% incluido en retribución: retribución × 19/119';
