-- Tags for activos (shared across casa and sanyus)

-- ─── Tag definitions ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS activos_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  slug TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6b7280',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE activos_tags ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'activos_tags'
      AND policyname = 'activos_tags_all'
  ) THEN
    CREATE POLICY activos_tags_all ON activos_tags FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ─── Join table: casa_activos_v2 ↔ tags ─────────────────────
CREATE TABLE IF NOT EXISTS casa_activos_tags (
  activo_id UUID NOT NULL REFERENCES casa_activos_v2(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES activos_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (activo_id, tag_id)
);

ALTER TABLE casa_activos_tags ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'casa_activos_tags'
      AND policyname = 'casa_activos_tags_all'
  ) THEN
    CREATE POLICY casa_activos_tags_all ON casa_activos_tags FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ─── Join table: sanyus_activos_v2 ↔ tags ───────────────────
CREATE TABLE IF NOT EXISTS sanyus_activos_tags (
  activo_id UUID NOT NULL REFERENCES sanyus_activos_v2(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES activos_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (activo_id, tag_id)
);

ALTER TABLE sanyus_activos_tags ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'sanyus_activos_tags'
      AND policyname = 'sanyus_activos_tags_all'
  ) THEN
    CREATE POLICY sanyus_activos_tags_all ON sanyus_activos_tags FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
