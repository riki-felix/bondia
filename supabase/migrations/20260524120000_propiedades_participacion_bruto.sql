-- Participación por propiedad + beneficio bruto (base de Retribución y JASP)

ALTER TABLE public.propiedades
  ADD COLUMN IF NOT EXISTS beneficio_bruto NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS participacion_sanyus NUMERIC(5,2) NOT NULL DEFAULT 40,
  ADD COLUMN IF NOT EXISTS participacion_jasp NUMERIC(5,2) NOT NULL DEFAULT 20;

COMMENT ON COLUMN public.propiedades.beneficio_bruto IS
  'Beneficio bruto; base para retribución (Sanyus) y JASP según participación';
COMMENT ON COLUMN public.propiedades.participacion_sanyus IS
  'Porcentaje de participación Sanyus (p. ej. 40 = 40%)';
COMMENT ON COLUMN public.propiedades.participacion_jasp IS
  'Porcentaje de participación JASP (p. ej. 20 = 20%)';

ALTER TABLE public.propiedades
  ADD CONSTRAINT propiedades_participacion_sanyus_range
    CHECK (participacion_sanyus >= 0 AND participacion_sanyus <= 100),
  ADD CONSTRAINT propiedades_participacion_jasp_range
    CHECK (participacion_jasp >= 0 AND participacion_jasp <= 100),
  ADD CONSTRAINT propiedades_participacion_sum
    CHECK (participacion_sanyus + participacion_jasp <= 100);
