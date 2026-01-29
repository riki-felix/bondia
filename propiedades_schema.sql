-- Schema for propiedades table
-- This defines the structure for property data

CREATE TABLE IF NOT EXISTS public.propiedades (
    id UUID PRIMARY KEY,
    numero_operacion INTEGER UNIQUE,
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
    fecha_venta TIMESTAMP,
    ocupado BOOLEAN DEFAULT FALSE,
    notas TEXT,
    CONSTRAINT propiedades_estado_check CHECK (estado IN ('comprado', 'vendido', 'reformando'))
);

-- Column descriptions:
-- id: Unique identifier (UUID)
-- numero_operacion: Operation number from ID column (integer, unique)
-- titulo: Property title/name
-- estado: Property status (lowercase: comprado, vendido, reformando)
-- fecha_inicio: Start date
-- pago: Payment status (boolean, Realizado → TRUE)
-- aportacion: Contribution amount
-- retribucion: Return/distribution amount
-- retencion: Tax retention amount from CSV
-- ingreso_banco: Bank deposit amount
-- efectivo: Cash amount from CSV
-- jasp_10_percent: 10% amount from CSV
-- ja: JA status (boolean, VERDADERO → TRUE)
-- transfe: Transfer date
-- fecha_compra: Purchase date
-- fecha_venta: Sale date
-- ocupado: Property occupancy status (boolean, Libre → TRUE means available)
-- notas: Additional notes
