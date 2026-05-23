-- Bruto vive en liquidaciones (no en propiedades)

ALTER TABLE public.liquidaciones
  ADD COLUMN IF NOT EXISTS beneficio_bruto NUMERIC(12,2);

COMMENT ON COLUMN public.liquidaciones.beneficio_bruto IS
  'Beneficio bruto de la liquidación; base para retribución según participación de la propiedad';

UPDATE public.liquidaciones l
SET beneficio_bruto = p.beneficio_bruto
FROM public.propiedades p
WHERE l.propiedad_id = p.id
  AND p.beneficio_bruto IS NOT NULL
  AND l.beneficio_bruto IS NULL;

ALTER TABLE public.propiedades
  DROP COLUMN IF EXISTS beneficio_bruto;
