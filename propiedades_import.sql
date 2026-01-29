-- Generated automatically from Sin título 3.csv
-- Import data into public.propiedades table
-- Uses ON CONFLICT to update existing records based on ID

-- Property: Abedul 6
INSERT INTO public.propiedades (
  id, titulo, estado, fecha_inicio, pago,
  aportacion, retribucion, retencion, ingreso_banco, efectivo,
  jasp_10_percent, ja, transfe, fecha_compra, fecha_venta
) VALUES (
  '4b98ab74-3ed3-4a9a-853d-c7a4917bffd3', 'Abedul 6', 'Comprado', '2023-01-15', TRUE,
  25000.0, 35000.0, 6650.0, 28000.0, 350.0,
  2800.0, TRUE, '2023-02-01', '2023-01-20', NULL
)
ON CONFLICT (id) DO UPDATE SET
  titulo = 'Abedul 6',
  estado = 'Comprado',
  fecha_inicio = '2023-01-15',
  pago = TRUE,
  aportacion = 25000.0,
  retribucion = 35000.0,
  retencion = 6650.0,
  ingreso_banco = 28000.0,
  efectivo = 350.0,
  jasp_10_percent = 2800.0,
  ja = TRUE,
  transfe = '2023-02-01',
  fecha_compra = '2023-01-20',
  fecha_venta = NULL;

-- Property: Aigües del Ll 118
INSERT INTO public.propiedades (
  id, titulo, estado, fecha_inicio, pago,
  aportacion, retribucion, retencion, ingreso_banco, efectivo,
  jasp_10_percent, ja, transfe, fecha_compra, fecha_venta
) VALUES (
  '084c7152-d631-48a3-ab3d-1f9b5349dfdf', 'Aigües del Ll 118', 'Vendido', '2023-03-10', FALSE,
  30000.0, 45000.0, 8550.0, 36000.0, 450.0,
  3600.0, FALSE, '2023-04-05', '2023-03-15', '2024-01-20'
)
ON CONFLICT (id) DO UPDATE SET
  titulo = 'Aigües del Ll 118',
  estado = 'Vendido',
  fecha_inicio = '2023-03-10',
  pago = FALSE,
  aportacion = 30000.0,
  retribucion = 45000.0,
  retencion = 8550.0,
  ingreso_banco = 36000.0,
  efectivo = 450.0,
  jasp_10_percent = 3600.0,
  ja = FALSE,
  transfe = '2023-04-05',
  fecha_compra = '2023-03-15',
  fecha_venta = '2024-01-20';

-- Property: Aigües del Llob. 91
INSERT INTO public.propiedades (
  id, titulo, estado, fecha_inicio, pago,
  aportacion, retribucion, retencion, ingreso_banco, efectivo,
  jasp_10_percent, ja, transfe, fecha_compra, fecha_venta
) VALUES (
  '801ed2ce-10c7-4a25-a88f-822e629c1b46', 'Aigües del Llob. 91', 'Comprado', '2023-05-12', TRUE,
  20000.0, 28000.0, 5320.0, 22400.0, 280.0,
  2240.0, TRUE, '2023-06-01', '2023-05-20', NULL
)
ON CONFLICT (id) DO UPDATE SET
  titulo = 'Aigües del Llob. 91',
  estado = 'Comprado',
  fecha_inicio = '2023-05-12',
  pago = TRUE,
  aportacion = 20000.0,
  retribucion = 28000.0,
  retencion = 5320.0,
  ingreso_banco = 22400.0,
  efectivo = 280.0,
  jasp_10_percent = 2240.0,
  ja = TRUE,
  transfe = '2023-06-01',
  fecha_compra = '2023-05-20',
  fecha_venta = NULL;

-- Property: Aigües del Llobregat
INSERT INTO public.propiedades (
  id, titulo, estado, fecha_inicio, pago,
  aportacion, retribucion, retencion, ingreso_banco, efectivo,
  jasp_10_percent, ja, transfe, fecha_compra, fecha_venta
) VALUES (
  '2262b155-b597-4ae1-ae12-906679d57ebd', 'Aigües del Llobregat', 'Reformando', '2023-07-08', FALSE,
  35000.0, 50000.0, 9500.0, 40000.0, 500.0,
  4000.0, FALSE, '2023-08-01', '2023-07-15', NULL
)
ON CONFLICT (id) DO UPDATE SET
  titulo = 'Aigües del Llobregat',
  estado = 'Reformando',
  fecha_inicio = '2023-07-08',
  pago = FALSE,
  aportacion = 35000.0,
  retribucion = 50000.0,
  retencion = 9500.0,
  ingreso_banco = 40000.0,
  efectivo = 500.0,
  jasp_10_percent = 4000.0,
  ja = FALSE,
  transfe = '2023-08-01',
  fecha_compra = '2023-07-15',
  fecha_venta = NULL;

-- Property: Aigües del Llobregat 131
INSERT INTO public.propiedades (
  id, titulo, estado, fecha_inicio, pago,
  aportacion, retribucion, retencion, ingreso_banco, efectivo,
  jasp_10_percent, ja, transfe, fecha_compra, fecha_venta
) VALUES (
  '8bdf0a86-446d-42bc-b09f-23661750d4d1', 'Aigües del Llobregat 131', 'Comprado', '2023-09-20', TRUE,
  22000.0, 32000.0, 6080.0, 25600.0, 320.0,
  2560.0, TRUE, '2023-10-01', '2023-09-25', NULL
)
ON CONFLICT (id) DO UPDATE SET
  titulo = 'Aigües del Llobregat 131',
  estado = 'Comprado',
  fecha_inicio = '2023-09-20',
  pago = TRUE,
  aportacion = 22000.0,
  retribucion = 32000.0,
  retencion = 6080.0,
  ingreso_banco = 25600.0,
  efectivo = 320.0,
  jasp_10_percent = 2560.0,
  ja = TRUE,
  transfe = '2023-10-01',
  fecha_compra = '2023-09-25',
  fecha_venta = NULL;

-- Total records processed: 5
