-- Superficies en propiedades (Engine) y plantilla inmueble (Casa / Sanyus)

ALTER TABLE public.propiedades
  ADD COLUMN IF NOT EXISTS superficie_m2 INTEGER,
  ADD COLUMN IF NOT EXISTS superficie_registrada_m2 INTEGER,
  ADD COLUMN IF NOT EXISTS superficie_real_m2 INTEGER;

COMMENT ON COLUMN public.propiedades.superficie_m2 IS 'Superficie catastral (m²)';
COMMENT ON COLUMN public.propiedades.superficie_registrada_m2 IS 'Superficie registrada (m²)';
COMMENT ON COLUMN public.propiedades.superficie_real_m2 IS 'Superficie real (m²)';

-- Casa: renombrar y añadir campos de plantilla inmueble
UPDATE public.casa_activos_caracteristicas
SET nombre = 'Superficie Catastral'
WHERE slug = 'superficie_m2';

INSERT INTO public.casa_activos_caracteristicas (nombre, slug, categoria_id, plantilla_inmueble)
VALUES
  ('Superficie registrada en m²', 'superficie_registrada_m2', NULL, true),
  ('Superficie real en m²', 'superficie_real_m2', NULL, true)
ON CONFLICT (slug) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  plantilla_inmueble = true;

-- Sanyus: renombrar y añadir campos de plantilla inmueble
UPDATE public.sanyus_activos_caracteristicas
SET nombre = 'Superficie Catastral'
WHERE slug = 'superficie_m2';

INSERT INTO public.sanyus_activos_caracteristicas (nombre, slug, categoria_id, plantilla_inmueble)
VALUES
  ('Superficie registrada en m²', 'superficie_registrada_m2', NULL, true),
  ('Superficie real en m²', 'superficie_real_m2', NULL, true)
ON CONFLICT (slug) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  plantilla_inmueble = true;
