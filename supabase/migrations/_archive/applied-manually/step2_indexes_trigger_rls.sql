-- Run AFTER step1 succeeds

CREATE INDEX idx_liquidaciones_propiedad ON public.liquidaciones(propiedad_id);
CREATE INDEX idx_liquidaciones_fecha ON public.liquidaciones(fecha_liquidacion);

CREATE OR REPLACE FUNCTION update_liquidaciones_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_liquidaciones_updated_at
    BEFORE UPDATE ON public.liquidaciones
    FOR EACH ROW
    EXECUTE FUNCTION update_liquidaciones_updated_at();

-- RLS
ALTER TABLE public.liquidaciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON public.liquidaciones FOR ALL USING (true) WITH CHECK (true);
