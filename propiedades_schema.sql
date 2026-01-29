-- Schema for propiedades table
-- This defines the structure for property data

CREATE TABLE IF NOT EXISTS public.propiedades (
    id UUID PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    estado VARCHAR(50),
    fecha_inicio TIMESTAMP,
    pago BOOLEAN DEFAULT FALSE,
    aportacion DECIMAL(12, 2),
    retribucion DECIMAL(12, 2),
    retencion DECIMAL(12, 2),
    ingreso_banco DECIMAL(12, 2),
    efectivo DECIMAL(12, 2),
    jasp_10_percent DECIMAL(12, 2),
    ja BOOLEAN DEFAULT FALSE,
    transfe TIMESTAMP,
    fecha_compra TIMESTAMP,
    fecha_venta TIMESTAMP
);

-- Column descriptions:
-- id: Unique identifier (UUID)
-- titulo: Property title/name
-- estado: Property status (e.g., Comprado, Vendido)
-- fecha_inicio: Start date
-- pago: Payment status (boolean)
-- aportacion: Contribution amount
-- retribucion: Return/distribution amount
-- retencion: Tax retention (calculated as 19% of retribucion)
-- ingreso_banco: Bank deposit amount
-- efectivo: Cash amount (calculated: retribucion - retencion - ingreso_banco)
-- jasp_10_percent: 10% of ingreso_banco (calculated)
-- ja: JA status (boolean)
-- transfe: Transfer date
-- fecha_compra: Purchase date
-- fecha_venta: Sale date
