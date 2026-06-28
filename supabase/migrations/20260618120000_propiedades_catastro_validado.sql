ALTER TABLE public.propiedades
  ADD COLUMN IF NOT EXISTS catastro_referencia_validada TEXT,
  ADD COLUMN IF NOT EXISTS catastro_validado_at TIMESTAMPTZ;

COMMENT ON COLUMN public.propiedades.catastro_referencia_validada IS
  'Referencia catastral normalizada validada contra el Catastro';
COMMENT ON COLUMN public.propiedades.catastro_validado_at IS
  'Fecha/hora de la última validación catastral correcta';
