-- Pago automático según ingreso en banco o transferencia en liquidación.

UPDATE public.propiedades p
SET pago = true
WHERE p.tipo = 'inversion'
  AND COALESCE(p.ingreso_banco, 0) > 0
  AND p.pago IS DISTINCT FROM true;

UPDATE public.propiedades p
SET pago = true
FROM public.liquidaciones l
WHERE l.propiedad_id = p.id
  AND p.tipo = 'inversion'
  AND COALESCE(l.transferencia, 0) > 0
  AND p.pago IS DISTINCT FROM true;

UPDATE public.propiedades p
SET pago = false
WHERE p.tipo = 'inversion'
  AND COALESCE(p.ingreso_banco, 0) <= 0
  AND NOT EXISTS (
    SELECT 1
    FROM public.liquidaciones l
    WHERE l.propiedad_id = p.id
      AND COALESCE(l.transferencia, 0) > 0
  )
  AND p.pago IS DISTINCT FROM false;
