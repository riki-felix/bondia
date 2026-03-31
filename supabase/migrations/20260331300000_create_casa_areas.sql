-- Migration: Create Casa áreas (category grouping)
-- An area groups categories from gastos, ingresos, or activos for filtering

CREATE TABLE IF NOT EXISTS public.casa_areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Junction table: area ↔ category (polymorphic via tipo + categoria_id)
CREATE TABLE IF NOT EXISTS public.casa_areas_categorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    area_id UUID NOT NULL REFERENCES public.casa_areas(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL CHECK (tipo IN ('gasto', 'ingreso', 'activo')),
    categoria_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (area_id, tipo, categoria_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_casa_areas_categorias_area ON public.casa_areas_categorias(area_id);
CREATE INDEX IF NOT EXISTS idx_casa_areas_categorias_tipo_cat ON public.casa_areas_categorias(tipo, categoria_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_casa_areas_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_casa_areas_updated_at
    BEFORE UPDATE ON public.casa_areas
    FOR EACH ROW EXECUTE FUNCTION update_casa_areas_updated_at();

-- RLS
ALTER TABLE public.casa_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.casa_areas_categorias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for casa_areas" ON public.casa_areas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for casa_areas_categorias" ON public.casa_areas_categorias FOR ALL USING (true) WITH CHECK (true);
