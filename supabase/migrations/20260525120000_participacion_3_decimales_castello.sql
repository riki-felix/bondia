-- 3 decimales en participación + Bienes Sanyus CB (solo ficha; CASTELLO se calcula en UI)

ALTER TABLE public.propiedades
  ALTER COLUMN participacion_sanyus TYPE NUMERIC(6,3),
  ALTER COLUMN participacion_jasp TYPE NUMERIC(6,3);

ALTER TABLE public.propiedades
  ADD COLUMN IF NOT EXISTS participacion_bienes_sanyus_cb NUMERIC(6,3);

COMMENT ON COLUMN public.propiedades.participacion_bienes_sanyus_cb IS
  'Porcentaje Bienes Sanyus CB (ficha). CASTELLO = 100% − este valor (no usado en cálculos de inversión)';

ALTER TABLE public.propiedades
  ADD CONSTRAINT propiedades_participacion_bienes_sanyus_cb_range
    CHECK (
      participacion_bienes_sanyus_cb IS NULL
      OR (participacion_bienes_sanyus_cb >= 0 AND participacion_bienes_sanyus_cb <= 100)
    );
