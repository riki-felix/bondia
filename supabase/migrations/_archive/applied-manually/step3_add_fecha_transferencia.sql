-- Add bank transfer date to liquidaciones
ALTER TABLE public.liquidaciones ADD COLUMN fecha_transferencia DATE;
