-- Bienes Sanyus CB por defecto 50% (CASTELLO = 50%)

ALTER TABLE public.propiedades
  ALTER COLUMN participacion_bienes_sanyus_cb SET DEFAULT 50;

UPDATE public.propiedades
SET participacion_bienes_sanyus_cb = 50
WHERE participacion_bienes_sanyus_cb IS NULL;
