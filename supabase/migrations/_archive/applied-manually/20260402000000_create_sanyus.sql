-- Migration: Create Sanyus section tables
-- Identical structure to Casa (Gastos, Ingresos, Activos) with separate tables
-- Reuses the existing casa_frecuencia ENUM type

-- ─── Category Tables ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.sanyus_gastos_categorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sanyus_ingresos_categorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sanyus_activos_categorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Main Tables ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.sanyus_gastos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    concepto TEXT NOT NULL DEFAULT '',
    categoria_id UUID REFERENCES public.sanyus_gastos_categorias(id) ON DELETE SET NULL,
    frecuencia casa_frecuencia NOT NULL DEFAULT 'mensual',
    fecha_inicio DATE,
    fecha_fin DATE,
    importe DECIMAL(12,2) NOT NULL DEFAULT 0,
    ejercicio INT NOT NULL DEFAULT EXTRACT(YEAR FROM now()),
    slug TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sanyus_ingresos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    concepto TEXT NOT NULL DEFAULT '',
    categoria_id UUID REFERENCES public.sanyus_ingresos_categorias(id) ON DELETE SET NULL,
    frecuencia casa_frecuencia NOT NULL DEFAULT 'mensual',
    fecha_inicio DATE,
    fecha_fin DATE,
    importe DECIMAL(12,2) NOT NULL DEFAULT 0,
    ejercicio INT NOT NULL DEFAULT EXTRACT(YEAR FROM now()),
    slug TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sanyus_activos_v2 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL DEFAULT '',
    categoria_id UUID REFERENCES public.sanyus_activos_categorias(id) ON DELETE SET NULL,
    fecha_compra DATE,
    precio_compra DECIMAL(12,2),
    slug TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Override Tables (per-cell edits) ────────────────────────

CREATE TABLE IF NOT EXISTS public.sanyus_gastos_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gasto_id UUID NOT NULL REFERENCES public.sanyus_gastos(id) ON DELETE CASCADE,
    ejercicio INT NOT NULL,
    mes INT NOT NULL CHECK (mes >= 1 AND mes <= 12),
    importe DECIMAL(12,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (gasto_id, ejercicio, mes)
);

CREATE TABLE IF NOT EXISTS public.sanyus_ingresos_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ingreso_id UUID NOT NULL REFERENCES public.sanyus_ingresos(id) ON DELETE CASCADE,
    ejercicio INT NOT NULL,
    mes INT NOT NULL CHECK (mes >= 1 AND mes <= 12),
    importe DECIMAL(12,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (ingreso_id, ejercicio, mes)
);

-- ─── Area Tables ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.sanyus_areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sanyus_areas_categorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    area_id UUID NOT NULL REFERENCES public.sanyus_areas(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL CHECK (tipo IN ('gasto', 'ingreso', 'activo')),
    categoria_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (area_id, tipo, categoria_id)
);

-- ─── Indexes ─────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_sanyus_gastos_ejercicio ON public.sanyus_gastos(ejercicio);
CREATE INDEX IF NOT EXISTS idx_sanyus_gastos_categoria ON public.sanyus_gastos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_sanyus_ingresos_ejercicio ON public.sanyus_ingresos(ejercicio);
CREATE INDEX IF NOT EXISTS idx_sanyus_ingresos_categoria ON public.sanyus_ingresos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_sanyus_activos_v2_categoria ON public.sanyus_activos_v2(categoria_id);
CREATE INDEX IF NOT EXISTS idx_sanyus_gastos_overrides_gasto ON public.sanyus_gastos_overrides(gasto_id, ejercicio);
CREATE INDEX IF NOT EXISTS idx_sanyus_ingresos_overrides_ingreso ON public.sanyus_ingresos_overrides(ingreso_id, ejercicio);
CREATE INDEX IF NOT EXISTS idx_sanyus_areas_categorias_area ON public.sanyus_areas_categorias(area_id);
CREATE INDEX IF NOT EXISTS idx_sanyus_areas_categorias_tipo_cat ON public.sanyus_areas_categorias(tipo, categoria_id);

-- ─── Updated_at Triggers ─────────────────────────────────────

CREATE OR REPLACE FUNCTION update_sanyus_gastos_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_sanyus_ingresos_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_sanyus_activos_v2_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_sanyus_areas_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_sanyus_gastos_updated_at
    BEFORE UPDATE ON public.sanyus_gastos
    FOR EACH ROW EXECUTE FUNCTION update_sanyus_gastos_updated_at();

CREATE TRIGGER set_sanyus_ingresos_updated_at
    BEFORE UPDATE ON public.sanyus_ingresos
    FOR EACH ROW EXECUTE FUNCTION update_sanyus_ingresos_updated_at();

CREATE TRIGGER set_sanyus_activos_v2_updated_at
    BEFORE UPDATE ON public.sanyus_activos_v2
    FOR EACH ROW EXECUTE FUNCTION update_sanyus_activos_v2_updated_at();

CREATE TRIGGER set_sanyus_areas_updated_at
    BEFORE UPDATE ON public.sanyus_areas
    FOR EACH ROW EXECUTE FUNCTION update_sanyus_areas_updated_at();

-- ─── RLS (permissive – same pattern as casa tables) ──────────

ALTER TABLE public.sanyus_gastos_categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sanyus_ingresos_categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sanyus_activos_categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sanyus_gastos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sanyus_ingresos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sanyus_activos_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sanyus_gastos_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sanyus_ingresos_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sanyus_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sanyus_areas_categorias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for sanyus_gastos_categorias" ON public.sanyus_gastos_categorias FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for sanyus_ingresos_categorias" ON public.sanyus_ingresos_categorias FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for sanyus_activos_categorias" ON public.sanyus_activos_categorias FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for sanyus_gastos" ON public.sanyus_gastos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for sanyus_ingresos" ON public.sanyus_ingresos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for sanyus_activos_v2" ON public.sanyus_activos_v2 FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for sanyus_gastos_overrides" ON public.sanyus_gastos_overrides FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for sanyus_ingresos_overrides" ON public.sanyus_ingresos_overrides FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for sanyus_areas" ON public.sanyus_areas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for sanyus_areas_categorias" ON public.sanyus_areas_categorias FOR ALL USING (true) WITH CHECK (true);
