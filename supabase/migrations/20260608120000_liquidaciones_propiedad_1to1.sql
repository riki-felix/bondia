-- Liquidación 1:1 con propiedad de inversión: mismo id, sin fecha obligatoria.

ALTER TABLE public.liquidaciones
  ALTER COLUMN fecha_liquidacion DROP NOT NULL;

-- Una sola liquidación por propiedad (conservar la de menor número).
DELETE FROM public.liquidaciones l
WHERE l.ctid NOT IN (
  SELECT DISTINCT ON (propiedad_id) ctid
  FROM public.liquidaciones
  ORDER BY propiedad_id, numero_liquidacion ASC, created_at ASC
);

-- id de liquidación = id de propiedad.
UPDATE public.liquidaciones
SET id = propiedad_id
WHERE id IS DISTINCT FROM propiedad_id;

CREATE UNIQUE INDEX IF NOT EXISTS liquidaciones_propiedad_id_unique
  ON public.liquidaciones (propiedad_id);

DO $$ BEGIN
  ALTER TABLE public.liquidaciones
    ADD CONSTRAINT liquidaciones_id_matches_propiedad CHECK (id = propiedad_id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Inversiones sin liquidación: crear fila vinculada.
WITH missing AS (
  SELECT
    p.id,
    p.ejercicio,
    COALESCE(p.aportacion, 0) AS aportacion,
    COALESCE(p.retribucion, 0) AS retribucion,
    COALESCE(p.ingreso_banco, 0) AS transferencia,
    COALESCE(p.liquidacion, false) AS liquidado,
    ROW_NUMBER() OVER (ORDER BY p.created_at) AS rn
  FROM public.propiedades p
  WHERE p.tipo = 'inversion'
    AND NOT EXISTS (
      SELECT 1 FROM public.liquidaciones l WHERE l.propiedad_id = p.id
    )
),
max_num AS (
  SELECT COALESCE(MAX(numero_liquidacion), 0) AS base FROM public.liquidaciones
)
INSERT INTO public.liquidaciones (
  id,
  propiedad_id,
  fecha_liquidacion,
  numero_liquidacion,
  numero_operacion,
  aportacion,
  retribucion,
  transferencia,
  liquidado,
  ejercicio
)
SELECT
  m.id,
  m.id,
  NULL,
  (SELECT base FROM max_num) + m.rn::int,
  NULL,
  m.aportacion,
  m.retribucion,
  m.transferencia,
  m.liquidado,
  m.ejercicio
FROM missing m;

-- Ejercicio y flag liquidada: manda la liquidación.
UPDATE public.propiedades p
SET
  ejercicio = l.ejercicio,
  liquidacion = COALESCE(l.liquidado, false)
FROM public.liquidaciones l
WHERE l.propiedad_id = p.id
  AND p.tipo = 'inversion';

SELECT public.bondia_reset_anon_select_rls('public.liquidaciones');
