-- JASP editable: quitar GENERATED y permitir override manual

ALTER TABLE public.propiedades
  ADD COLUMN IF NOT EXISTS jasp_manual BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.propiedades.jasp_manual IS
  'Si true, jasp_10_percent fue fijado a mano y no se recalcula al cambiar ingreso_banco';

-- Quitar expresión generada; conserva valores almacenados actuales
ALTER TABLE public.propiedades
  ALTER COLUMN jasp_10_percent DROP EXPRESSION;
