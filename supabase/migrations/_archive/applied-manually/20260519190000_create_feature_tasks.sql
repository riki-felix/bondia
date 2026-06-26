-- Feature tasks used by /ajustes progress module

CREATE TABLE IF NOT EXISTS public.feature_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo TEXT NOT NULL,
    descripcion TEXT NOT NULL DEFAULT '',
    progreso INTEGER NOT NULL DEFAULT 0 CHECK (progreso >= 0 AND progreso <= 100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.feature_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for feature_tasks" ON public.feature_tasks;
CREATE POLICY "Allow all for feature_tasks"
  ON public.feature_tasks
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.set_feature_tasks_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_feature_tasks_updated_at ON public.feature_tasks;
CREATE TRIGGER set_feature_tasks_updated_at
BEFORE UPDATE ON public.feature_tasks
FOR EACH ROW
EXECUTE FUNCTION public.set_feature_tasks_updated_at();
