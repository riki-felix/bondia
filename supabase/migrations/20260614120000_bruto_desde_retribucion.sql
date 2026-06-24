-- Bruto derivado de retribución (inversa de retribución = bruto × % Sanyus).
-- No modifica retribución; solo rellena beneficio_bruto.

COMMENT ON COLUMN public.liquidaciones.beneficio_bruto IS
  'Beneficio bruto calculado desde retribución y % Sanyus de la propiedad; no editable';

UPDATE public.liquidaciones l
SET beneficio_bruto = CASE
  WHEN COALESCE(l.retribucion, 0) <= 0 THEN 0
  WHEN COALESCE(p.participacion_sanyus, 40) <= 0 THEN 0
  ELSE ROUND(
    l.retribucion * 100 / COALESCE(p.participacion_sanyus, 40),
    2
  )
END
FROM public.propiedades p
WHERE p.id = l.propiedad_id;
