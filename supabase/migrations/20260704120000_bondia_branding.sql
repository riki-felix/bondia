-- Branding de la app (logo editable en Ajustes).

CREATE TABLE IF NOT EXISTS public.bondia_branding (
  id TEXT PRIMARY KEY DEFAULT 'default',
  logo_storage_path TEXT,
  logo_mime_type TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.bondia_branding (id)
VALUES ('default')
ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE public.bondia_branding IS
  'Configuración de marca; logo en bucket bondia-branding (público).';

SELECT public.bondia_reset_anon_select_rls('public.bondia_branding'::regclass);

INSERT INTO storage.buckets (id, name, public)
VALUES ('bondia-branding', 'bondia-branding', true)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'bondia-branding') THEN
    DROP POLICY IF EXISTS bondia_branding_public_read ON storage.objects;
    DROP POLICY IF EXISTS bondia_branding_manage ON storage.objects;
    CREATE POLICY bondia_branding_public_read ON storage.objects
      FOR SELECT TO anon, authenticated
      USING (bucket_id = 'bondia-branding');
    CREATE POLICY bondia_branding_manage ON storage.objects
      FOR ALL TO service_role
      USING (bucket_id = 'bondia-branding')
      WITH CHECK (bucket_id = 'bondia-branding');
  END IF;
END $$;
