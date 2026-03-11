CREATE TABLE public.liquidaciones (
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
