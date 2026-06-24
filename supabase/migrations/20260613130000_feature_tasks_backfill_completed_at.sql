-- Rellena completed_at en tareas ya cerradas (antes de la columna completed_at)

UPDATE public.feature_tasks
SET completed_at = updated_at
WHERE progreso >= 100
  AND completed_at IS NULL;
