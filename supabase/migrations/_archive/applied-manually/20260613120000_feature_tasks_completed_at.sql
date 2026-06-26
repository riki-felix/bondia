-- Fecha de cierre para timeline del Diario

ALTER TABLE public.feature_tasks
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS feature_tasks_completed_at_idx
  ON public.feature_tasks (completed_at);
