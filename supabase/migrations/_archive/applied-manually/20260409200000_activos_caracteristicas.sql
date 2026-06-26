-- Características for activos (custom fields per category)

-- ─── Characteristic definitions (shared) ─────────────────────
CREATE TABLE IF NOT EXISTS activos_caracteristicas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  slug TEXT NOT NULL,
  categoria_id UUID,  -- optional: limits to activos of this category (no FK — works across blocks)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE activos_caracteristicas ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'activos_caracteristicas'
      AND policyname = 'activos_caracteristicas_all'
  ) THEN
    CREATE POLICY activos_caracteristicas_all ON activos_caracteristicas FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ─── Values: casa_activos_v2 ↔ características ──────────────
CREATE TABLE IF NOT EXISTS casa_activos_caracteristica_valores (
  activo_id UUID NOT NULL REFERENCES casa_activos_v2(id) ON DELETE CASCADE,
  caracteristica_id UUID NOT NULL REFERENCES activos_caracteristicas(id) ON DELETE CASCADE,
  valor TEXT NOT NULL DEFAULT '',
  PRIMARY KEY (activo_id, caracteristica_id)
);

ALTER TABLE casa_activos_caracteristica_valores ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'casa_activos_caracteristica_valores'
      AND policyname = 'casa_activos_caract_val_all'
  ) THEN
    CREATE POLICY casa_activos_caract_val_all ON casa_activos_caracteristica_valores FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ─── Values: sanyus_activos_v2 ↔ características ────────────
CREATE TABLE IF NOT EXISTS sanyus_activos_caracteristica_valores (
  activo_id UUID NOT NULL REFERENCES sanyus_activos_v2(id) ON DELETE CASCADE,
  caracteristica_id UUID NOT NULL REFERENCES activos_caracteristicas(id) ON DELETE CASCADE,
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
    CREATE POLICY sanyus_activos_caract_val_all ON sanyus_activos_caracteristica_valores FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
