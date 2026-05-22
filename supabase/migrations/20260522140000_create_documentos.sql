-- Documentos privados (metadatos + orden); ficheros en bucket bondia-documentos

CREATE TABLE IF NOT EXISTS public.documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('propiedad', 'activo', 'gasto', 'ingreso')),
  entity_id UUID NOT NULL,
  bloque TEXT NOT NULL CHECK (bloque IN ('engine', 'casa', 'sanyus')),
  storage_path TEXT NOT NULL UNIQUE,
  folder_slug TEXT NOT NULL,
  display_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS documentos_entity_sort_idx
  ON public.documentos (entity_type, entity_id, sort_order);

CREATE INDEX IF NOT EXISTS documentos_bloque_entity_idx
  ON public.documentos (bloque, entity_type, entity_id);

CREATE INDEX IF NOT EXISTS documentos_display_name_idx
  ON public.documentos (display_name);

ALTER TABLE public.documentos ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'documentos'
      AND policyname = 'documentos_allow_all'
  ) THEN
    CREATE POLICY documentos_allow_all ON public.documentos
      FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Bucket privado (sin lectura pública)
INSERT INTO storage.buckets (id, name, public)
VALUES ('bondia-documentos', 'bondia-documentos', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Sin políticas anon de lectura; acceso vía service role en Netlify Functions
