-- Tags y características de activos Sanyus (separados de Casa)

CREATE TABLE IF NOT EXISTS sanyus_activos_tag_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  slug TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6b7280',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE sanyus_activos_tag_catalog ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'sanyus_activos_tag_catalog'
      AND policyname = 'sanyus_activos_tag_catalog_all'
  ) THEN
    CREATE POLICY sanyus_activos_tag_catalog_all ON sanyus_activos_tag_catalog
      FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS sanyus_activos_tags (
  activo_id UUID NOT NULL REFERENCES sanyus_activos_v2(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES sanyus_activos_tag_catalog(id) ON DELETE CASCADE,
  PRIMARY KEY (activo_id, tag_id)
);

ALTER TABLE sanyus_activos_tags ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'sanyus_activos_tags'
      AND policyname = 'sanyus_activos_tags_all'
  ) THEN
    CREATE POLICY sanyus_activos_tags_all ON sanyus_activos_tags
      FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS sanyus_activos_caracteristicas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  slug TEXT NOT NULL,
  categoria_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE sanyus_activos_caracteristicas ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'sanyus_activos_caracteristicas'
      AND policyname = 'sanyus_activos_caracteristicas_all'
  ) THEN
    CREATE POLICY sanyus_activos_caracteristicas_all ON sanyus_activos_caracteristicas
      FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS sanyus_activos_caracteristica_valores (
  activo_id UUID NOT NULL REFERENCES sanyus_activos_v2(id) ON DELETE CASCADE,
  caracteristica_id UUID NOT NULL REFERENCES sanyus_activos_caracteristicas(id) ON DELETE CASCADE,
  valor TEXT NOT NULL DEFAULT '',
  PRIMARY KEY (activo_id, caracteristica_id)
);

ALTER TABLE sanyus_activos_caracteristica_valores ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'sanyus_activos_caracteristica_valores'
      AND policyname = 'sanyus_activos_caract_val_all'
  ) THEN
    CREATE POLICY sanyus_activos_caract_val_all ON sanyus_activos_caracteristica_valores
      FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

COMMENT ON TABLE sanyus_activos_tag_catalog IS 'Definiciones de tags para activos de Sanyus';
COMMENT ON TABLE sanyus_activos_caracteristicas IS 'Definiciones de características para activos de Sanyus';
