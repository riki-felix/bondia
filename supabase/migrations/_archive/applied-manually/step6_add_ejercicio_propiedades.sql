-- Add ejercicio (fiscal year) to propiedades and make numero_operacion unique per ejercicio
-- Run on production Supabase

-- 1. Add ejercicio column
ALTER TABLE public.propiedades ADD COLUMN IF NOT EXISTS ejercicio INTEGER;

-- 2. Drop the old unique constraint on numero_operacion alone
ALTER TABLE public.propiedades DROP CONSTRAINT IF EXISTS propiedades_numero_operacion_key;

-- 3. Create composite unique constraint: same numero_operacion allowed in different ejercicios
CREATE UNIQUE INDEX IF NOT EXISTS propiedades_ejercicio_numero_operacion_key
  ON public.propiedades (ejercicio, numero_operacion)
  WHERE ejercicio IS NOT NULL AND numero_operacion IS NOT NULL;

-- 4. Update estado check constraint to include borrador and activa
ALTER TABLE public.propiedades DROP CONSTRAINT IF EXISTS propiedades_estado_check;
ALTER TABLE public.propiedades ADD CONSTRAINT propiedades_estado_check
  CHECK (estado IN ('borrador', 'activa', 'sin_estado', 'tanteo', 'negociacion', 'comprado', 'reforma', 'alquiler', 'vendido'));
