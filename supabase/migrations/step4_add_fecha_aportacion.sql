-- Add fecha_aportacion (contribution date) to liquidaciones
-- Used to calculate duración and beneficio in the frontend
ALTER TABLE public.liquidaciones ADD COLUMN fecha_aportacion DATE;
