-- Migration: Create Casa section tables
-- Gastos, Ingresos, Activos with category taxonomies and monthly overrides

-- ─── Frecuencia ENUM ─────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE casa_frecuencia AS ENUM (
    'semanal','quincenal','mensual','bimensual',
    'trimestral','semestral','anual','puntual','variable'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── Category Tables ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.casa_gastos_categorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.casa_ingresos_categorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.casa_activos_categorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Main Tables ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.casa_gastos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    concepto TEXT NOT NULL DEFAULT '',
    categoria_id UUID REFERENCES public.casa_gastos_categorias(id) ON DELETE SET NULL,
    frecuencia casa_frecuencia NOT NULL DEFAULT 'mensual',
    fecha_inicio DATE,
    fecha_fin DATE,
    importe DECIMAL(12,2) NOT NULL DEFAULT 0,
    ejercicio INT NOT NULL DEFAULT EXTRACT(YEAR FROM now()),
    slug TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.casa_ingresos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    concepto TEXT NOT NULL DEFAULT '',
    categoria_id UUID REFERENCES public.casa_ingresos_categorias(id) ON DELETE SET NULL,
    frecuencia casa_frecuencia NOT NULL DEFAULT 'mensual',
    fecha_inicio DATE,
    fecha_fin DATE,
    importe DECIMAL(12,2) NOT NULL DEFAULT 0,
    ejercicio INT NOT NULL DEFAULT EXTRACT(YEAR FROM now()),
    slug TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.casa_activos_v2 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL DEFAULT '',
    categoria_id UUID REFERENCES public.casa_activos_categorias(id) ON DELETE SET NULL,
    fecha_compra DATE,
    precio_compra DECIMAL(12,2),
    slug TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Override Tables (per-cell edits) ────────────────────────

CREATE TABLE IF NOT EXISTS public.casa_gastos_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gasto_id UUID NOT NULL REFERENCES public.casa_gastos(id) ON DELETE CASCADE,
    ejercicio INT NOT NULL,
    mes INT NOT NULL CHECK (mes >= 1 AND mes <= 12),
    importe DECIMAL(12,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (gasto_id, ejercicio, mes)
);

CREATE TABLE IF NOT EXISTS public.casa_ingresos_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ingreso_id UUID NOT NULL REFERENCES public.casa_ingresos(id) ON DELETE CASCADE,
    ejercicio INT NOT NULL,
    mes INT NOT NULL CHECK (mes >= 1 AND mes <= 12),
    importe DECIMAL(12,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (ingreso_id, ejercicio, mes)
);

-- ─── Indexes ─────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_casa_gastos_ejercicio ON public.casa_gastos(ejercicio);
CREATE INDEX IF NOT EXISTS idx_casa_gastos_categoria ON public.casa_gastos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_casa_ingresos_ejercicio ON public.casa_ingresos(ejercicio);
CREATE INDEX IF NOT EXISTS idx_casa_ingresos_categoria ON public.casa_ingresos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_casa_activos_v2_categoria ON public.casa_activos_v2(categoria_id);
CREATE INDEX IF NOT EXISTS idx_casa_gastos_overrides_gasto ON public.casa_gastos_overrides(gasto_id, ejercicio);
CREATE INDEX IF NOT EXISTS idx_casa_ingresos_overrides_ingreso ON public.casa_ingresos_overrides(ingreso_id, ejercicio);

-- ─── Updated_at Triggers ─────────────────────────────────────

CREATE OR REPLACE FUNCTION update_casa_gastos_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_casa_ingresos_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_casa_activos_v2_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_casa_gastos_updated_at
    BEFORE UPDATE ON public.casa_gastos
    FOR EACH ROW EXECUTE FUNCTION update_casa_gastos_updated_at();

CREATE TRIGGER set_casa_ingresos_updated_at
    BEFORE UPDATE ON public.casa_ingresos
    FOR EACH ROW EXECUTE FUNCTION update_casa_ingresos_updated_at();

CREATE TRIGGER set_casa_activos_v2_updated_at
    BEFORE UPDATE ON public.casa_activos_v2
    FOR EACH ROW EXECUTE FUNCTION update_casa_activos_v2_updated_at();

-- ─── RLS (permissive – same pattern as existing tables) ──────

ALTER TABLE public.casa_gastos_categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.casa_ingresos_categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.casa_activos_categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.casa_gastos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.casa_ingresos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.casa_activos_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.casa_gastos_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.casa_ingresos_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for casa_gastos_categorias" ON public.casa_gastos_categorias FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for casa_ingresos_categorias" ON public.casa_ingresos_categorias FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for casa_activos_categorias" ON public.casa_activos_categorias FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for casa_gastos" ON public.casa_gastos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for casa_ingresos" ON public.casa_ingresos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for casa_activos_v2" ON public.casa_activos_v2 FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for casa_gastos_overrides" ON public.casa_gastos_overrides FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for casa_ingresos_overrides" ON public.casa_ingresos_overrides FOR ALL USING (true) WITH CHECK (true);
