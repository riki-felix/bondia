-- Add valor_estimado, fecha_estimacion, foto_url to both activos tables

ALTER TABLE casa_activos_v2
  ADD COLUMN IF NOT EXISTS valor_estimado DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS fecha_estimacion DATE,
  ADD COLUMN IF NOT EXISTS foto_url TEXT;

ALTER TABLE sanyus_activos_v2
  ADD COLUMN IF NOT EXISTS valor_estimado DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS fecha_estimacion DATE,
  ADD COLUMN IF NOT EXISTS foto_url TEXT;

-- Create storage bucket for activo photos (public read)
INSERT INTO storage.buckets (id, name, public)
VALUES ('activos-fotos', 'activos-fotos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to read photos (public bucket)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'activos_fotos_public_read'
  ) THEN
    CREATE POLICY activos_fotos_public_read ON storage.objects
      FOR SELECT USING (bucket_id = 'activos-fotos');
  END IF;
END $$;

-- Allow authenticated/service role to manage photos
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'activos_fotos_manage'
  ) THEN
    CREATE POLICY activos_fotos_manage ON storage.objects
      FOR ALL USING (bucket_id = 'activos-fotos');
  END IF;
END $$;
