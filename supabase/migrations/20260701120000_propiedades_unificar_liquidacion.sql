-- Fase 1: unificar campos de liquidación en propiedades.
-- La tabla liquidaciones se mantiene como espejo 1:1 durante la transición.

ALTER TABLE public.propiedades
  ADD COLUMN IF NOT EXISTS beneficio_bruto NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS fecha_liquidacion DATE,
  ADD COLUMN IF NOT EXISTS fecha_aportacion DATE,
  ADD COLUMN IF NOT EXISTS fecha_transferencia DATE,
  ADD COLUMN IF NOT EXISTS numero_op_liquidacion INTEGER,
  ADD COLUMN IF NOT EXISTS liquidada_at TIMESTAMPTZ;

COMMENT ON COLUMN public.propiedades.beneficio_bruto IS
  'Beneficio bruto de la operación; base para retribución y JASP';
COMMENT ON COLUMN public.propiedades.numero_op_liquidacion IS
  'Nº OP manual SANYUS en hoja de liquidación (distinto de numero_operacion ID inversión)';
COMMENT ON COLUMN public.propiedades.liquidada_at IS
  'Momento del cierre definitivo JASP (operación bloqueada)';

-- Backfill desde liquidaciones (fuente histórica 1:1)
UPDATE public.propiedades p
SET
  beneficio_bruto = l.beneficio_bruto,
  fecha_liquidacion = l.fecha_liquidacion,
  fecha_aportacion = l.fecha_aportacion,
  fecha_transferencia = l.fecha_transferencia,
  numero_op_liquidacion = l.numero_operacion,
  aportacion = COALESCE(l.aportacion, p.aportacion, 0),
  retribucion = COALESCE(l.retribucion, p.retribucion, 0),
  ingreso_banco = CASE
    WHEN COALESCE(l.transferencia, 0) > 0 THEN l.transferencia
    WHEN COALESCE(p.ingreso_banco, 0) > 0 THEN p.ingreso_banco
    ELSE NULL
  END,
  fecha_ingreso = CASE
    WHEN COALESCE(l.transferencia, 0) > 0 THEN COALESCE(
      p.fecha_ingreso,
      l.fecha_transferencia,
      l.fecha_liquidacion,
      p.fecha_venta
    )
    WHEN COALESCE(p.ingreso_banco, 0) > 0 THEN p.fecha_ingreso
    ELSE NULL
  END,
  liquidacion = COALESCE(l.liquidado, p.liquidacion, false),
  ejercicio = COALESCE(l.ejercicio, p.ejercicio),
  liquidada_at = CASE
    WHEN COALESCE(l.liquidado, false) THEN COALESCE(p.liquidada_at, l.updated_at, now())
    ELSE NULL
  END
FROM public.liquidaciones l
WHERE l.propiedad_id = p.id
  AND p.tipo = 'inversion';

-- Derivar bruto desde retribución cuando falte
UPDATE public.propiedades p
SET beneficio_bruto = ROUND(
  p.retribucion * 100 / NULLIF(COALESCE(p.participacion_sanyus, 40), 0),
  2
)
WHERE p.tipo = 'inversion'
  AND COALESCE(p.beneficio_bruto, 0) = 0
  AND COALESCE(p.retribucion, 0) > 0;
