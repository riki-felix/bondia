-- Add numero_operacion (operation number) to liquidaciones
ALTER TABLE public.liquidaciones ADD COLUMN IF NOT EXISTS numero_operacion INTEGER;
