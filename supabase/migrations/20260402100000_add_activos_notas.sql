-- Migration: Add notas column to activos tables (casa + sanyus)

ALTER TABLE public.casa_activos_v2
  ADD COLUMN IF NOT EXISTS notas TEXT DEFAULT '';

ALTER TABLE public.sanyus_activos_v2
  ADD COLUMN IF NOT EXISTS notas TEXT DEFAULT '';
