-- Migration: Create liquidaciones table for settlement tracking
-- Each liquidación is linked to a property (propiedad)

CREATE TABLE IF NOT EXISTS public.liquidaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    propiedad_id UUID NOT NULL REFERENCES public.propiedades(id) ON DELETE CASCADE,
    fecha_liquidacion DATE NOT NULL,
    numero_liquidacion INTEGER NOT NULL,
    aportacion DECIMAL(12,2) NOT NULL DEFAULT 0,
    retribucion DECIMAL(12,2) NOT NULL DEFAULT 0,
    retencion DECIMAL(12,2) GENERATED ALWAYS AS (ROUND(retribucion * 0.19, 2)) STORED,
    neto DECIMAL(12,2) GENERATED ALWAYS AS (ROUND(retribucion - ROUND(retribucion * 0.19, 2), 2)) STORED,
    transferencia DECIMAL(12,2) NOT NULL DEFAULT 0,
    efectivo DECIMAL(12,2) GENERATED ALWAYS AS (
        ROUND(
            (retribucion - ROUND(retribucion * 0.19, 2)) - transferencia,
            2
        )
    ) STORED,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for common queries
CREATE INDEX IF NOT EXISTS idx_liquidaciones_propiedad ON public.liquidaciones(propiedad_id);
CREATE INDEX IF NOT EXISTS idx_liquidaciones_fecha ON public.liquidaciones(fecha_liquidacion);

-- Auto-update updated_at on row changes
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

-- Column descriptions:
-- id: Unique identifier (UUID, auto-generated)
-- propiedad_id: FK to propiedades table
-- fecha_liquidacion: Settlement date
-- numero_liquidacion: Sequence number (for sorting within a property)
-- aportacion: Contribution amount (user input)
-- retribucion: Return/distribution amount (user input)
-- retencion: Tax retention = retribucion × 19% (GENERATED)
-- neto: Net amount = retribucion − retencion (GENERATED)
-- efectivo: Cash amount = neto − transferencia (GENERATED)
-- transferencia: Bank transfer amount (user input)
