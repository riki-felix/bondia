-- Origen de la operación / fuente de la inversión (texto libre)
ALTER TABLE public.propiedades
  ADD COLUMN IF NOT EXISTS origen TEXT;

COMMENT ON COLUMN public.propiedades.origen IS 'Origen o fuente de la inversión (texto libre)';
