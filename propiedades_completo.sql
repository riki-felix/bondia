-- Generated automatically from Sin título 3.csv
-- Import all 24 rows into public.propiedades table
-- Uses ON CONFLICT on numero_operacion to update existing records
-- All transformations applied as per requirements:
--   - ID → numero_operacion (integer field)
--   - NOMBRE → titulo
--   - ESTADO → estado (lowercase)
--   - PAGO: Realizado → TRUE
--   - JA: VERDADERO → TRUE
--   - OCUPADO: Libre → TRUE
--   - Money fields: Remove €, convert commas to dots
--   - Dates: ISO 8601 format (YYYY-MM-DD)

-- Property 1: MAS 112 BAJOS 2ª L''H
INSERT INTO public.propiedades (
  id, numero_operacion, titulo, estado, fecha_inicio, pago,
  aportacion, retribucion, retencion, ingreso_banco, efectivo,
  jasp_10_percent, ja, transfe, fecha_compra, fecha_venta, ocupado, notas
) VALUES (
  '34a6d609-b2d3-41d3-bbac-5594d763454f', 1, 'MAS 112 BAJOS 2ª L''''H', 'comprado', '2024-05-21', TRUE,
  26237.9, 12761.84, 2424.75, 5085.09, 5252.0,
  508.51, TRUE, '2025-02-21', NULL, '2025-02-03', TRUE, NULL
)
ON CONFLICT (numero_operacion) DO UPDATE SET
  id = '34a6d609-b2d3-41d3-bbac-5594d763454f',
  titulo = 'MAS 112 BAJOS 2ª L''''H',
  estado = 'comprado',
  fecha_inicio = '2024-05-21',
  pago = TRUE,
  aportacion = 26237.9,
  retribucion = 12761.84,
  retencion = 2424.75,
  ingreso_banco = 5085.09,
  efectivo = 5252.0,
  jasp_10_percent = 508.51,
  ja = TRUE,
  transfe = '2025-02-21',
  fecha_compra = NULL,
  fecha_venta = '2025-02-03',
  ocupado = TRUE,
  notas = NULL;

-- Property 2: MINA 33 3º 2ª L''H
INSERT INTO public.propiedades (
  id, numero_operacion, titulo, estado, fecha_inicio, pago,
  aportacion, retribucion, retencion, ingreso_banco, efectivo,
  jasp_10_percent, ja, transfe, fecha_compra, fecha_venta, ocupado, notas
) VALUES (
  '6f9b7130-eb92-455d-800d-c60b9e3c492f', 2, 'MINA 33 3º 2ª L''''H', 'comprado', '2025-02-20', TRUE,
  33325.2, 6215.83, 1181.01, 5034.82, 0.0,
  503.48, TRUE, '2025-02-21', NULL, '2025-02-07', TRUE, NULL
)
ON CONFLICT (numero_operacion) DO UPDATE SET
  id = '6f9b7130-eb92-455d-800d-c60b9e3c492f',
  titulo = 'MINA 33 3º 2ª L''''H',
  estado = 'comprado',
  fecha_inicio = '2025-02-20',
  pago = TRUE,
  aportacion = 33325.2,
  retribucion = 6215.83,
  retencion = 1181.01,
  ingreso_banco = 5034.82,
  efectivo = 0.0,
  jasp_10_percent = 503.48,
  ja = TRUE,
  transfe = '2025-02-21',
  fecha_compra = NULL,
  fecha_venta = '2025-02-07',
  ocupado = TRUE,
  notas = NULL;

-- Property 3: MARCEL·LÍ ESQUIUS 45 BAJOS 2ª L''H
INSERT INTO public.propiedades (
  id, numero_operacion, titulo, estado, fecha_inicio, pago,
  aportacion, retribucion, retencion, ingreso_banco, efectivo,
  jasp_10_percent, ja, transfe, fecha_compra, fecha_venta, ocupado, notas
) VALUES (
  '6bc7292d-d65f-4546-96de-e2cd951cea45', 3, 'MARCEL·LÍ ESQUIUS 45 BAJOS 2ª L''''H', 'comprado', '2025-02-20', TRUE,
  35842.23, 7536.23, 1431.88, 4912.34, 1192.01,
  491.23, TRUE, '2025-02-21', NULL, '2025-02-12', TRUE, NULL
)
ON CONFLICT (numero_operacion) DO UPDATE SET
  id = '6bc7292d-d65f-4546-96de-e2cd951cea45',
  titulo = 'MARCEL·LÍ ESQUIUS 45 BAJOS 2ª L''''H',
  estado = 'comprado',
  fecha_inicio = '2025-02-20',
  pago = TRUE,
  aportacion = 35842.23,
  retribucion = 7536.23,
  retencion = 1431.88,
  ingreso_banco = 4912.34,
  efectivo = 1192.01,
  jasp_10_percent = 491.23,
  ja = TRUE,
  transfe = '2025-02-21',
  fecha_compra = NULL,
  fecha_venta = '2025-02-12',
  ocupado = TRUE,
  notas = NULL;

-- Property 4: SANT FRANCESC XAVIER 17 ENT 1 L''H
INSERT INTO public.propiedades (
  id, numero_operacion, titulo, estado, fecha_inicio, pago,
  aportacion, retribucion, retencion, ingreso_banco, efectivo,
  jasp_10_percent, ja, transfe, fecha_compra, fecha_venta, ocupado, notas
) VALUES (
  '2b25cabd-5b0f-4782-ad68-b4450de48718', 4, 'SANT FRANCESC XAVIER 17 ENT 1 L''''H', 'comprado', '2025-02-20', TRUE,
  27550.0, 8574.62, 1629.18, 2173.44, 4772.0,
  217.34, TRUE, '2025-02-21', NULL, '2025-02-18', TRUE, NULL
)
ON CONFLICT (numero_operacion) DO UPDATE SET
  id = '2b25cabd-5b0f-4782-ad68-b4450de48718',
  titulo = 'SANT FRANCESC XAVIER 17 ENT 1 L''''H',
  estado = 'comprado',
  fecha_inicio = '2025-02-20',
  pago = TRUE,
  aportacion = 27550.0,
  retribucion = 8574.62,
  retencion = 1629.18,
  ingreso_banco = 2173.44,
  efectivo = 4772.0,
  jasp_10_percent = 217.34,
  ja = TRUE,
  transfe = '2025-02-21',
  fecha_compra = NULL,
  fecha_venta = '2025-02-18',
  ocupado = TRUE,
  notas = NULL;

-- Property 5: SEVERO OCHOA 33 2º 2ª L''H
INSERT INTO public.propiedades (
  id, numero_operacion, titulo, estado, fecha_inicio, pago,
  aportacion, retribucion, retencion, ingreso_banco, efectivo,
  jasp_10_percent, ja, transfe, fecha_compra, fecha_venta, ocupado, notas
) VALUES (
  'd4b7d339-23f9-4b58-a5e9-c4a49628fa80', 5, 'SEVERO OCHOA 33 2º 2ª L''''H', 'comprado', '2025-02-20', TRUE,
  33480.0, 2596.2, 493.28, 2102.92, 0.0,
  210.29, TRUE, '2025-02-21', NULL, '2025-01-08', TRUE, NULL
)
ON CONFLICT (numero_operacion) DO UPDATE SET
  id = 'd4b7d339-23f9-4b58-a5e9-c4a49628fa80',
  titulo = 'SEVERO OCHOA 33 2º 2ª L''''H',
  estado = 'comprado',
  fecha_inicio = '2025-02-20',
  pago = TRUE,
  aportacion = 33480.0,
  retribucion = 2596.2,
  retencion = 493.28,
  ingreso_banco = 2102.92,
  efectivo = 0.0,
  jasp_10_percent = 210.29,
  ja = TRUE,
  transfe = '2025-02-21',
  fecha_compra = NULL,
  fecha_venta = '2025-01-08',
  ocupado = TRUE,
  notas = NULL;

-- Property 6: PARÍS 68 ESC 1 ENT 1ª L''H
INSERT INTO public.propiedades (
  id, numero_operacion, titulo, estado, fecha_inicio, pago,
  aportacion, retribucion, retencion, ingreso_banco, efectivo,
  jasp_10_percent, ja, transfe, fecha_compra, fecha_venta, ocupado, notas
) VALUES (
  '55c92c9d-6cdb-4ea5-928f-169e6430ac05', 6, 'PARÍS 68 ESC 1 ENT 1ª L''''H', 'comprado', '2024-05-21', TRUE,
  34474.45, 6740.73, 1280.74, 79.99, 5380.0,
  8.0, TRUE, '2025-02-21', NULL, '2025-01-15', TRUE, NULL
)
ON CONFLICT (numero_operacion) DO UPDATE SET
  id = '55c92c9d-6cdb-4ea5-928f-169e6430ac05',
  titulo = 'PARÍS 68 ESC 1 ENT 1ª L''''H',
  estado = 'comprado',
  fecha_inicio = '2024-05-21',
  pago = TRUE,
  aportacion = 34474.45,
  retribucion = 6740.73,
  retencion = 1280.74,
  ingreso_banco = 79.99,
  efectivo = 5380.0,
  jasp_10_percent = 8.0,
  ja = TRUE,
  transfe = '2025-02-21',
  fecha_compra = NULL,
  fecha_venta = '2025-01-15',
  ocupado = TRUE,
  notas = NULL;

-- Property 7: AV. ISABEL LA CATÓLICA 74 ESC 1 4º 2ª L''H
INSERT INTO public.propiedades (
  id, numero_operacion, titulo, estado, fecha_inicio, pago,
  aportacion, retribucion, retencion, ingreso_banco, efectivo,
  jasp_10_percent, ja, transfe, fecha_compra, fecha_venta, ocupado, notas
) VALUES (
  'ade9f56b-aa57-480c-a79d-a924afecfec2', 7, 'AV. ISABEL LA CATÓLICA 74 ESC 1 4º 2ª L''''H', 'comprado', '2025-04-17', TRUE,
  49313.2, 13114.1, 2491.68, 10278.42, 344.0,
  1027.84, TRUE, '2025-04-18', NULL, '2025-02-05', TRUE, NULL
)
ON CONFLICT (numero_operacion) DO UPDATE SET
  id = 'ade9f56b-aa57-480c-a79d-a924afecfec2',
  titulo = 'AV. ISABEL LA CATÓLICA 74 ESC 1 4º 2ª L''''H',
  estado = 'comprado',
  fecha_inicio = '2025-04-17',
  pago = TRUE,
  aportacion = 49313.2,
  retribucion = 13114.1,
  retencion = 2491.68,
  ingreso_banco = 10278.42,
  efectivo = 344.0,
  jasp_10_percent = 1027.84,
  ja = TRUE,
  transfe = '2025-04-18',
  fecha_compra = NULL,
  fecha_venta = '2025-02-05',
  ocupado = TRUE,
  notas = NULL;

-- Property 8: FONT 9 AT 2ª L''H
INSERT INTO public.propiedades (
  id, numero_operacion, titulo, estado, fecha_inicio, pago,
  aportacion, retribucion, retencion, ingreso_banco, efectivo,
  jasp_10_percent, ja, transfe, fecha_compra, fecha_venta, ocupado, notas
) VALUES (
  '21f25c23-ce1a-4a19-8794-db1f8df59189', 8, 'FONT 9 AT 2ª L''''H', 'comprado', '2025-04-17', TRUE,
  12740.7, 15410.77, 2928.05, 8222.36, 4260.36,
  822.24, TRUE, '2025-04-19', NULL, '2025-02-05', TRUE, NULL
)
ON CONFLICT (numero_operacion) DO UPDATE SET
  id = '21f25c23-ce1a-4a19-8794-db1f8df59189',
  titulo = 'FONT 9 AT 2ª L''''H',
  estado = 'comprado',
  fecha_inicio = '2025-04-17',
  pago = TRUE,
  aportacion = 12740.7,
  retribucion = 15410.77,
  retencion = 2928.05,
  ingreso_banco = 8222.36,
  efectivo = 4260.36,
  jasp_10_percent = 822.24,
  ja = TRUE,
  transfe = '2025-04-19',
  fecha_compra = NULL,
  fecha_venta = '2025-02-05',
  ocupado = TRUE,
  notas = NULL;

-- Property 9: RENCLUSA 62 4º 3ª L''H
INSERT INTO public.propiedades (
  id, numero_operacion, titulo, estado, fecha_inicio, pago,
  aportacion, retribucion, retencion, ingreso_banco, efectivo,
  jasp_10_percent, ja, transfe, fecha_compra, fecha_venta, ocupado, notas
) VALUES (
  '05b580bb-bb57-4402-82d8-4e9ca4447d01', 9, 'RENCLUSA 62 4º 3ª L''''H', 'comprado', '2025-04-17', TRUE,
  38952.25, 6434.73, 1222.6, 4972.13, 240.0,
  497.21, TRUE, '2025-04-20', NULL, '2024-11-29', TRUE, 'Es del 2024?'
)
ON CONFLICT (numero_operacion) DO UPDATE SET
  id = '05b580bb-bb57-4402-82d8-4e9ca4447d01',
  titulo = 'RENCLUSA 62 4º 3ª L''''H',
  estado = 'comprado',
  fecha_inicio = '2025-04-17',
  pago = TRUE,
  aportacion = 38952.25,
  retribucion = 6434.73,
  retencion = 1222.6,
  ingreso_banco = 4972.13,
  efectivo = 240.0,
  jasp_10_percent = 497.21,
  ja = TRUE,
  transfe = '2025-04-20',
  fecha_compra = NULL,
  fecha_venta = '2024-11-29',
  ocupado = TRUE,
  notas = 'Es del 2024?';

-- Property 10: AV. MIRAFLORES 34 2º 1ª L''H
INSERT INTO public.propiedades (
  id, numero_operacion, titulo, estado, fecha_inicio, pago,
  aportacion, retribucion, retencion, ingreso_banco, efectivo,
  jasp_10_percent, ja, transfe, fecha_compra, fecha_venta, ocupado, notas
) VALUES (
  '5193e27f-7652-43af-9a64-31090e3a252b', 10, 'AV. MIRAFLORES 34 2º 1ª L''''H', 'comprado', '2025-05-28', TRUE,
  36254.0, 19120.8, 3632.95, 10295.95, 5191.9,
  1029.6, TRUE, '2025-05-29', NULL, '2025-03-05', TRUE, NULL
)
ON CONFLICT (numero_operacion) DO UPDATE SET
  id = '5193e27f-7652-43af-9a64-31090e3a252b',
  titulo = 'AV. MIRAFLORES 34 2º 1ª L''''H',
  estado = 'comprado',
  fecha_inicio = '2025-05-28',
  pago = TRUE,
  aportacion = 36254.0,
  retribucion = 19120.8,
  retencion = 3632.95,
  ingreso_banco = 10295.95,
  efectivo = 5191.9,
  jasp_10_percent = 1029.6,
  ja = TRUE,
  transfe = '2025-05-29',
  fecha_compra = NULL,
  fecha_venta = '2025-03-05',
  ocupado = TRUE,
  notas = NULL;

-- Property 11: MONTSENY 133 PRAL 1ª L''H
INSERT INTO public.propiedades (
  id, numero_operacion, titulo, estado, fecha_inicio, pago,
  aportacion, retribucion, retencion, ingreso_banco, efectivo,
  jasp_10_percent, ja, transfe, fecha_compra, fecha_venta, ocupado, notas
) VALUES (
  '6f2e768e-92dc-4518-8379-ea17c8fd20a4', 11, 'MONTSENY 133 PRAL 1ª L''''H', 'comprado', '2025-02-05', TRUE,
  34324.0, 23047.27, 4378.98, 7664.29, 11004.0,
  766.43, TRUE, '2025-05-30', NULL, '2025-03-05', TRUE, NULL
)
ON CONFLICT (numero_operacion) DO UPDATE SET
  id = '6f2e768e-92dc-4518-8379-ea17c8fd20a4',
  titulo = 'MONTSENY 133 PRAL 1ª L''''H',
  estado = 'comprado',
  fecha_inicio = '2025-02-05',
  pago = TRUE,
  aportacion = 34324.0,
  retribucion = 23047.27,
  retencion = 4378.98,
  ingreso_banco = 7664.29,
  efectivo = 11004.0,
  jasp_10_percent = 766.43,
  ja = TRUE,
  transfe = '2025-05-30',
  fecha_compra = NULL,
  fecha_venta = '2025-03-05',
  ocupado = TRUE,
  notas = NULL;

-- Property 12: AV. DEL BOSC 28 4º 1ª L''H
INSERT INTO public.propiedades (
  id, numero_operacion, titulo, estado, fecha_inicio, pago,
  aportacion, retribucion, retencion, ingreso_banco, efectivo,
  jasp_10_percent, ja, transfe, fecha_compra, fecha_venta, ocupado, notas
) VALUES (
  '611b5e70-0444-4fc0-9935-c9f7a241a49a', 12, 'AV. DEL BOSC 28 4º 1ª L''''H', 'comprado', '2025-02-02', TRUE,
  31904.34, 12761.74, 2424.73, 4561.01, 5776.0,
  456.1, TRUE, '2025-08-09', NULL, '2025-03-13', TRUE, NULL
)
ON CONFLICT (numero_operacion) DO UPDATE SET
  id = '611b5e70-0444-4fc0-9935-c9f7a241a49a',
  titulo = 'AV. DEL BOSC 28 4º 1ª L''''H',
  estado = 'comprado',
  fecha_inicio = '2025-02-02',
  pago = TRUE,
  aportacion = 31904.34,
  retribucion = 12761.74,
  retencion = 2424.73,
  ingreso_banco = 4561.01,
  efectivo = 5776.0,
  jasp_10_percent = 456.1,
  ja = TRUE,
  transfe = '2025-08-09',
  fecha_compra = NULL,
  fecha_venta = '2025-03-13',
  ocupado = TRUE,
  notas = NULL;

-- Property 13: MARTÍ I BLASI 29 3º 2ª L''H
INSERT INTO public.propiedades (
  id, numero_operacion, titulo, estado, fecha_inicio, pago,
  aportacion, retribucion, retencion, ingreso_banco, efectivo,
  jasp_10_percent, ja, transfe, fecha_compra, fecha_venta, ocupado, notas
) VALUES (
  '2a91de8d-8277-464a-8c0a-29f7de6bfbed', 13, 'MARTÍ I BLASI 29 3º 2ª L''''H', 'comprado', '2024-11-13', TRUE,
  37159.91, 14351.05, 2726.7, 4400.35, 7224.0,
  440.04, TRUE, '2025-08-09', NULL, '2025-02-21', TRUE, NULL
)
ON CONFLICT (numero_operacion) DO UPDATE SET
  id = '2a91de8d-8277-464a-8c0a-29f7de6bfbed',
  titulo = 'MARTÍ I BLASI 29 3º 2ª L''''H',
  estado = 'comprado',
  fecha_inicio = '2024-11-13',
  pago = TRUE,
  aportacion = 37159.91,
  retribucion = 14351.05,
  retencion = 2726.7,
  ingreso_banco = 4400.35,
  efectivo = 7224.0,
  jasp_10_percent = 440.04,
  ja = TRUE,
  transfe = '2025-08-09',
  fecha_compra = NULL,
  fecha_venta = '2025-02-21',
  ocupado = TRUE,
  notas = NULL;

-- Property 14: AIGÜES DEL LLOBREGAT 118 ESC 1 3º 3ª L''H
INSERT INTO public.propiedades (
  id, numero_operacion, titulo, estado, fecha_inicio, pago,
  aportacion, retribucion, retencion, ingreso_banco, efectivo,
  jasp_10_percent, ja, transfe, fecha_compra, fecha_venta, ocupado, notas
) VALUES (
  'c699d3da-8275-4ed0-a96c-0c53485e8813', 14, 'AIGÜES DEL LLOBREGAT 118 ESC 1 3º 3ª L''''H', 'comprado', '2024-12-19', TRUE,
  27258.63, 4830.78, 917.85, 3912.03, 0.0,
  391.2, TRUE, '2025-08-09', NULL, '2025-03-05', TRUE, NULL
)
ON CONFLICT (numero_operacion) DO UPDATE SET
  id = 'c699d3da-8275-4ed0-a96c-0c53485e8813',
  titulo = 'AIGÜES DEL LLOBREGAT 118 ESC 1 3º 3ª L''''H',
  estado = 'comprado',
  fecha_inicio = '2024-12-19',
  pago = TRUE,
  aportacion = 27258.63,
  retribucion = 4830.78,
  retencion = 917.85,
  ingreso_banco = 3912.03,
  efectivo = 0.0,
  jasp_10_percent = 391.2,
  ja = TRUE,
  transfe = '2025-08-09',
  fecha_compra = NULL,
  fecha_venta = '2025-03-05',
  ocupado = TRUE,
  notas = NULL;

-- Property 15: GARROFERS 16 1º 2ª L''H
INSERT INTO public.propiedades (
  id, numero_operacion, titulo, estado, fecha_inicio, pago,
  aportacion, retribucion, retencion, ingreso_banco, efectivo,
  jasp_10_percent, ja, transfe, fecha_compra, fecha_venta, ocupado, notas
) VALUES (
  '34d9d98e-1fbf-41a6-9a06-528dd49abd3b', 15, 'GARROFERS 16 1º 2ª L''''H', 'comprado', '2024-12-17', TRUE,
  31151.8, 5721.51, 1087.09, 4634.42, 0.0,
  463.44, TRUE, '2025-08-09', NULL, '2025-03-05', TRUE, NULL
)
ON CONFLICT (numero_operacion) DO UPDATE SET
  id = '34d9d98e-1fbf-41a6-9a06-528dd49abd3b',
  titulo = 'GARROFERS 16 1º 2ª L''''H',
  estado = 'comprado',
  fecha_inicio = '2024-12-17',
  pago = TRUE,
  aportacion = 31151.8,
  retribucion = 5721.51,
  retencion = 1087.09,
  ingreso_banco = 4634.42,
  efectivo = 0.0,
  jasp_10_percent = 463.44,
  ja = TRUE,
  transfe = '2025-08-09',
  fecha_compra = NULL,
  fecha_venta = '2025-03-05',
  ocupado = TRUE,
  notas = NULL;

-- Property 16: LLORER 12 4º 4ª L''H
INSERT INTO public.propiedades (
  id, numero_operacion, titulo, estado, fecha_inicio, pago,
  aportacion, retribucion, retencion, ingreso_banco, efectivo,
  jasp_10_percent, ja, transfe, fecha_compra, fecha_venta, ocupado, notas
) VALUES (
  'be4ab625-55c8-42e7-8d8d-b5b48b1ee45a', 16, 'LLORER 12 4º 4ª L''''H', 'vendido', '2025-01-17', TRUE,
  27977.99, 11758.54, 2234.12, 4836.42, 4688.0,
  483.64, TRUE, '2025-11-10', NULL, '2025-03-19', TRUE, NULL
)
ON CONFLICT (numero_operacion) DO UPDATE SET
  id = 'be4ab625-55c8-42e7-8d8d-b5b48b1ee45a',
  titulo = 'LLORER 12 4º 4ª L''''H',
  estado = 'vendido',
  fecha_inicio = '2025-01-17',
  pago = TRUE,
  aportacion = 27977.99,
  retribucion = 11758.54,
  retencion = 2234.12,
  ingreso_banco = 4836.42,
  efectivo = 4688.0,
  jasp_10_percent = 483.64,
  ja = TRUE,
  transfe = '2025-11-10',
  fecha_compra = NULL,
  fecha_venta = '2025-03-19',
  ocupado = TRUE,
  notas = NULL;

-- Property 17: MAS 130 3º 2ª L''H
INSERT INTO public.propiedades (
  id, numero_operacion, titulo, estado, fecha_inicio, pago,
  aportacion, retribucion, retencion, ingreso_banco, efectivo,
  jasp_10_percent, ja, transfe, fecha_compra, fecha_venta, ocupado, notas
) VALUES (
  'e2c4932b-954b-4c5f-8d98-add6323e9ca0', 17, 'MAS 130 3º 2ª L''''H', 'vendido', '2025-01-13', TRUE,
  53627.4, 9574.56, 1819.17, 2759.39, 4996.0,
  275.94, TRUE, '2025-11-10', NULL, '2025-04-11', TRUE, NULL
)
ON CONFLICT (numero_operacion) DO UPDATE SET
  id = 'e2c4932b-954b-4c5f-8d98-add6323e9ca0',
  titulo = 'MAS 130 3º 2ª L''''H',
  estado = 'vendido',
  fecha_inicio = '2025-01-13',
  pago = TRUE,
  aportacion = 53627.4,
  retribucion = 9574.56,
  retencion = 1819.17,
  ingreso_banco = 2759.39,
  efectivo = 4996.0,
  jasp_10_percent = 275.94,
  ja = TRUE,
  transfe = '2025-11-10',
  fecha_compra = NULL,
  fecha_venta = '2025-04-11',
  ocupado = TRUE,
  notas = NULL;

-- Property 18: AMADEU VIVES 19 3º 1ª L''H
INSERT INTO public.propiedades (
  id, numero_operacion, titulo, estado, fecha_inicio, pago,
  aportacion, retribucion, retencion, ingreso_banco, efectivo,
  jasp_10_percent, ja, transfe, fecha_compra, fecha_venta, ocupado, notas
) VALUES (
  '6b5e771e-2def-466c-a591-6b7f4568663e', 18, 'AMADEU VIVES 19 3º 1ª L''''H', 'vendido', '2025-01-29', TRUE,
  36749.44, 13059.19, 2481.25, 4037.94, 6540.0,
  403.79, TRUE, '2025-11-10', NULL, '2025-04-11', TRUE, NULL
)
ON CONFLICT (numero_operacion) DO UPDATE SET
  id = '6b5e771e-2def-466c-a591-6b7f4568663e',
  titulo = 'AMADEU VIVES 19 3º 1ª L''''H',
  estado = 'vendido',
  fecha_inicio = '2025-01-29',
  pago = TRUE,
  aportacion = 36749.44,
  retribucion = 13059.19,
  retencion = 2481.25,
  ingreso_banco = 4037.94,
  efectivo = 6540.0,
  jasp_10_percent = 403.79,
  ja = TRUE,
  transfe = '2025-11-10',
  fecha_compra = NULL,
  fecha_venta = '2025-04-11',
  ocupado = TRUE,
  notas = NULL;

-- Property 19: AV. DEL BOSC 67-69 3º 3ª L''H
INSERT INTO public.propiedades (
  id, numero_operacion, titulo, estado, fecha_inicio, pago,
  aportacion, retribucion, retencion, ingreso_banco, efectivo,
  jasp_10_percent, ja, transfe, fecha_compra, fecha_venta, ocupado, notas
) VALUES (
  'e80f8cb8-84b4-4623-8fc0-117bf3fa8a8f', 19, 'AV. DEL BOSC 67-69 3º 3ª L''''H', 'vendido', '2025-04-23', TRUE,
  43174.67, 14883.47, 2827.86, 5653.61, 6402.0,
  565.36, TRUE, '2025-11-10', NULL, '2025-05-29', TRUE, NULL
)
ON CONFLICT (numero_operacion) DO UPDATE SET
  id = 'e80f8cb8-84b4-4623-8fc0-117bf3fa8a8f',
  titulo = 'AV. DEL BOSC 67-69 3º 3ª L''''H',
  estado = 'vendido',
  fecha_inicio = '2025-04-23',
  pago = TRUE,
  aportacion = 43174.67,
  retribucion = 14883.47,
  retencion = 2827.86,
  ingreso_banco = 5653.61,
  efectivo = 6402.0,
  jasp_10_percent = 565.36,
  ja = TRUE,
  transfe = '2025-11-10',
  fecha_compra = NULL,
  fecha_venta = '2025-05-29',
  ocupado = TRUE,
  notas = NULL;

-- Property 20: LLEVANT 43 ENT 2ª L''H
INSERT INTO public.propiedades (
  id, numero_operacion, titulo, estado, fecha_inicio, pago,
  aportacion, retribucion, retencion, ingreso_banco, efectivo,
  jasp_10_percent, ja, transfe, fecha_compra, fecha_venta, ocupado, notas
) VALUES (
  'fe5bafe1-4e2a-4534-9011-55a1ae7815b2', 20, 'LLEVANT 43 ENT 2ª L''''H', 'vendido', '2024-11-27', TRUE,
  38001.02, 4626.96, 879.12, 3747.84, -0.0,
  374.78, TRUE, '2025-11-10', NULL, '2025-05-30', TRUE, NULL
)
ON CONFLICT (numero_operacion) DO UPDATE SET
  id = 'fe5bafe1-4e2a-4534-9011-55a1ae7815b2',
  titulo = 'LLEVANT 43 ENT 2ª L''''H',
  estado = 'vendido',
  fecha_inicio = '2024-11-27',
  pago = TRUE,
  aportacion = 38001.02,
  retribucion = 4626.96,
  retencion = 879.12,
  ingreso_banco = 3747.84,
  efectivo = -0.0,
  jasp_10_percent = 374.78,
  ja = TRUE,
  transfe = '2025-11-10',
  fecha_compra = NULL,
  fecha_venta = '2025-05-30',
  ocupado = TRUE,
  notas = NULL;

-- Property 21: COLLSEROLA 57 4º 1ª L''H
INSERT INTO public.propiedades (
  id, numero_operacion, titulo, estado, fecha_inicio, pago,
  aportacion, retribucion, retencion, ingreso_banco, efectivo,
  jasp_10_percent, ja, transfe, fecha_compra, fecha_venta, ocupado, notas
) VALUES (
  '36ad172e-9be1-443f-b390-bc0728b12b34', 21, 'COLLSEROLA 57 4º 1ª L''''H', 'vendido', '2025-03-11', TRUE,
  15616.73, 20040.84, 3807.76, 10616.18, 5616.9,
  1061.62, TRUE, '2025-11-11', NULL, '2025-05-27', TRUE, NULL
)
ON CONFLICT (numero_operacion) DO UPDATE SET
  id = '36ad172e-9be1-443f-b390-bc0728b12b34',
  titulo = 'COLLSEROLA 57 4º 1ª L''''H',
  estado = 'vendido',
  fecha_inicio = '2025-03-11',
  pago = TRUE,
  aportacion = 15616.73,
  retribucion = 20040.84,
  retencion = 3807.76,
  ingreso_banco = 10616.18,
  efectivo = 5616.9,
  jasp_10_percent = 1061.62,
  ja = TRUE,
  transfe = '2025-11-11',
  fecha_compra = NULL,
  fecha_venta = '2025-05-27',
  ocupado = TRUE,
  notas = NULL;

-- Property 22: AV. CATALUNYA 105 4º 1ª L''H
INSERT INTO public.propiedades (
  id, numero_operacion, titulo, estado, fecha_inicio, pago,
  aportacion, retribucion, retencion, ingreso_banco, efectivo,
  jasp_10_percent, ja, transfe, fecha_compra, fecha_venta, ocupado, notas
) VALUES (
  'e59a25de-0462-40c8-952f-a4af5939b9a6', 22, 'AV. CATALUNYA 105 4º 1ª L''''H', 'vendido', '2025-02-06', TRUE,
  39950.0, 20851.32, 3961.75, 6037.57, 10852.0,
  603.76, TRUE, '2025-12-01', NULL, '2025-09-05', TRUE, NULL
)
ON CONFLICT (numero_operacion) DO UPDATE SET
  id = 'e59a25de-0462-40c8-952f-a4af5939b9a6',
  titulo = 'AV. CATALUNYA 105 4º 1ª L''''H',
  estado = 'vendido',
  fecha_inicio = '2025-02-06',
  pago = TRUE,
  aportacion = 39950.0,
  retribucion = 20851.32,
  retencion = 3961.75,
  ingreso_banco = 6037.57,
  efectivo = 10852.0,
  jasp_10_percent = 603.76,
  ja = TRUE,
  transfe = '2025-12-01',
  fecha_compra = NULL,
  fecha_venta = '2025-09-05',
  ocupado = TRUE,
  notas = NULL;

-- Property 23: LLORER 55 AT 1ª L''H
INSERT INTO public.propiedades (
  id, numero_operacion, titulo, estado, fecha_inicio, pago,
  aportacion, retribucion, retencion, ingreso_banco, efectivo,
  jasp_10_percent, ja, transfe, fecha_compra, fecha_venta, ocupado, notas
) VALUES (
  'dfe673ca-4a69-4a9f-b209-b0e608d1c392', 23, 'LLORER 55 AT 1ª L''''H', 'vendido', '2025-01-24', TRUE,
  27005.0, 12930.66, 2456.83, 4269.83, 6204.0,
  426.98, TRUE, '2026-01-05', NULL, '2025-10-06', TRUE, NULL
)
ON CONFLICT (numero_operacion) DO UPDATE SET
  id = 'dfe673ca-4a69-4a9f-b209-b0e608d1c392',
  titulo = 'LLORER 55 AT 1ª L''''H',
  estado = 'vendido',
  fecha_inicio = '2025-01-24',
  pago = TRUE,
  aportacion = 27005.0,
  retribucion = 12930.66,
  retencion = 2456.83,
  ingreso_banco = 4269.83,
  efectivo = 6204.0,
  jasp_10_percent = 426.98,
  ja = TRUE,
  transfe = '2026-01-05',
  fecha_compra = NULL,
  fecha_venta = '2025-10-06',
  ocupado = TRUE,
  notas = NULL;

-- Property 24: ILLES CANÀRIES 1 5º 4ª L''H
INSERT INTO public.propiedades (
  id, numero_operacion, titulo, estado, fecha_inicio, pago,
  aportacion, retribucion, retencion, ingreso_banco, efectivo,
  jasp_10_percent, ja, transfe, fecha_compra, fecha_venta, ocupado, notas
) VALUES (
  'fe880ef2-a530-435a-9b9f-a1a72b4f35c9', 24, 'ILLES CANÀRIES 1 5º 4ª L''''H', 'vendido', '2024-11-25', TRUE,
  29211.05, 11011.9, 2092.26, 1639.64, 7280.0,
  163.96, TRUE, '2026-01-05', NULL, '2025-10-30', TRUE, NULL
)
ON CONFLICT (numero_operacion) DO UPDATE SET
  id = 'fe880ef2-a530-435a-9b9f-a1a72b4f35c9',
  titulo = 'ILLES CANÀRIES 1 5º 4ª L''''H',
  estado = 'vendido',
  fecha_inicio = '2024-11-25',
  pago = TRUE,
  aportacion = 29211.05,
  retribucion = 11011.9,
  retencion = 2092.26,
  ingreso_banco = 1639.64,
  efectivo = 7280.0,
  jasp_10_percent = 163.96,
  ja = TRUE,
  transfe = '2026-01-05',
  fecha_compra = NULL,
  fecha_venta = '2025-10-30',
  ocupado = TRUE,
  notas = NULL;

-- Total records processed: 24
-- All 24 rows have been transformed and are ready for import
