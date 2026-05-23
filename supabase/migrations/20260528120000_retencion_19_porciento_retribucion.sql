-- Retención = 19% de retribución (no 19/119)

ALTER TABLE public.propiedades DROP COLUMN IF EXISTS efectivo;
ALTER TABLE public.propiedades DROP COLUMN IF EXISTS retencion;

ALTER TABLE public.propiedades
  ADD COLUMN retencion NUMERIC(12,2) GENERATED ALWAYS AS (
    ROUND(retribucion * 0.19, 2)
  ) STORED,
  ADD COLUMN efectivo NUMERIC(12,2) GENERATED ALWAYS AS (
    ROUND(
      retribucion - ROUND(retribucion * 0.19, 2) - COALESCE(ingreso_banco, 0),
      2
    )
  ) STORED;

ALTER TABLE public.liquidaciones DROP COLUMN IF EXISTS efectivo;
ALTER TABLE public.liquidaciones DROP COLUMN IF EXISTS neto;
ALTER TABLE public.liquidaciones DROP COLUMN IF EXISTS retencion;

ALTER TABLE public.liquidaciones
  ADD COLUMN retencion NUMERIC(12,2) GENERATED ALWAYS AS (
    ROUND(retribucion * 0.19, 2)
  ) STORED,
  ADD COLUMN neto NUMERIC(12,2) GENERATED ALWAYS AS (
    ROUND(retribucion - ROUND(retribucion * 0.19, 2), 2)
  ) STORED,
  ADD COLUMN efectivo NUMERIC(12,2) GENERATED ALWAYS AS (
    ROUND(
      retribucion - ROUND(retribucion * 0.19, 2) - transferencia,
      2
    )
  ) STORED;

-- Recalcular retribución desde bruto × % Sanyus de la propiedad
UPDATE public.liquidaciones l
SET retribucion = ROUND(
  COALESCE(l.beneficio_bruto, 0) * COALESCE(p.participacion_sanyus, 40) / 100,
  2
)
FROM public.propiedades p
WHERE p.id = l.propiedad_id
  AND COALESCE(l.beneficio_bruto, 0) > 0;

-- Sincronizar retribución agregada en propiedades
UPDATE public.propiedades p
SET retribucion = sub.total_ret
FROM (
  SELECT propiedad_id, ROUND(COALESCE(SUM(retribucion), 0), 2) AS total_ret
  FROM public.liquidaciones
  GROUP BY propiedad_id
) sub
WHERE p.id = sub.propiedad_id;
