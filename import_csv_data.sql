-- =============================================================
-- AUTO-GENERATED SQL from "Sin título 3.csv"
-- Generated: 2026-03-11 18:19
-- =============================================================
-- FRESH IMPORT: Deletes all existing data first.
-- Skipped: RETENCIÓN, EFECTIVO, JASP (GENERATED ALWAYS in DB).
-- Skipped: NOTAS (not imported).
-- Liquidaciones: retencion, neto, efectivo are GENERATED ALWAYS.
-- =============================================================

BEGIN;

-- ─── Step 0: Delete existing data (fresh import) ───
DELETE FROM aportaciones;
DELETE FROM liquidaciones;
DELETE FROM propiedades;

-- ─── Step 1: Insert properties ───
INSERT INTO propiedades (
  numero_operacion, titulo, estado, fecha_ingreso,
  pago, aportacion, retribucion, ingreso_banco,
  transfe, fecha_compra, fecha_venta,
  ocupado, liquidacion, tipo
) VALUES
  (1, 'MAS 112 BAJOS 2ª L''H', 'comprado', '2024-05-21', true, 26237.90, 12761.84, 5085.09, '2025-02-21', NULL, '2025-02-03', false, true, 'inversion'),
  (2, 'MINA 33 3º 2ª L''H', 'comprado', '2025-02-20', true, 33325.20, 6215.83, 5034.82, '2025-02-21', NULL, '2025-02-07', false, true, 'inversion'),
  (3, 'MARCEL·LÍ ESQUIUS 45 BAJOS 2ª L''H', 'comprado', '2025-02-20', true, 35842.23, 7536.23, 4912.34, '2025-02-21', NULL, '2025-02-12', false, true, 'inversion'),
  (4, 'SANT FRANCESC XAVIER 17 ENT 1 L''H', 'comprado', '2025-02-20', true, 27550.00, 8574.62, 2173.44, '2025-02-21', NULL, '2025-02-18', false, true, 'inversion'),
  (5, 'SEVERO OCHOA 33 2º 2ª L''H', 'comprado', '2025-02-20', true, 33480.00, 2596.20, 2102.92, '2025-02-21', NULL, '2025-01-08', false, true, 'inversion'),
  (6, 'PARÍS 68 ESC 1 ENT 1ª L''H', 'comprado', '2024-05-21', true, 34474.45, 6740.73, 79.99, '2025-02-21', NULL, '2025-01-15', false, true, 'inversion'),
  (7, 'AV. ISABEL LA CATÓLICA 74 ESC 1 4º 2ª L''H', 'comprado', '2025-04-17', true, 49313.20, 13114.10, 10278.42, '2025-04-18', NULL, '2025-02-05', false, true, 'inversion'),
  (8, 'FONT 9 AT 2ª L''H', 'comprado', '2025-04-17', true, 12740.70, 15410.77, 8222.36, '2025-04-19', NULL, '2025-02-05', false, true, 'inversion'),
  (9, 'RENCLUSA 62 4º 3ª L''H', 'comprado', '2025-04-17', true, 38952.25, 6434.73, 4972.13, '2025-04-20', NULL, '2024-11-29', false, true, 'inversion'),
  (10, 'AV. MIRAFLORES 34 2º 1ª L''H', 'comprado', '2025-05-28', true, 36254.00, 19120.80, 10295.95, '2025-05-29', NULL, '2025-03-05', false, true, 'inversion'),
  (11, 'MONTSENY 133 PRAL 1ª L''H', 'comprado', '2025-02-05', true, 34324.00, 23047.27, 7664.29, '2025-05-30', NULL, '2025-03-05', false, true, 'inversion'),
  (12, 'AV. DEL BOSC 28 4º 1ª L''H', 'comprado', '2025-02-02', true, 31904.34, 12761.74, 4561.01, '2025-08-09', NULL, '2025-03-13', false, true, 'inversion'),
  (13, 'MARTÍ I BLASI 29 3º 2ª L''H', 'comprado', '2024-11-13', true, 37159.91, 14351.05, 4400.35, '2025-08-09', NULL, '2025-02-21', false, true, 'inversion'),
  (14, 'AIGÜES DEL LLOBREGAT 118 ESC 1 3º 3ª L''H', 'comprado', '2024-12-19', true, 27258.63, 4830.78, 3912.03, '2025-08-09', NULL, '2025-03-05', false, true, 'inversion'),
  (15, 'GARROFERS 16 1º 2ª L''H', 'comprado', '2024-12-17', true, 31151.80, 5721.51, 4634.42, '2025-08-09', NULL, '2025-03-05', false, true, 'inversion'),
  (16, 'LLORER 12 4º 4ª L''H', 'vendido', '2025-01-17', true, 27977.99, 11758.54, 4836.42, '2025-11-10', NULL, '2025-03-19', false, true, 'inversion'),
  (17, 'MAS 130 3º 2ª L''H', 'vendido', '2025-01-13', true, 53627.40, 9574.56, 2759.39, '2025-11-10', NULL, '2025-04-11', false, true, 'inversion'),
  (18, 'AMADEU VIVES 19 3º 1ª L''H', 'vendido', '2025-01-29', true, 36749.44, 13059.19, 4037.94, '2025-11-10', NULL, '2025-04-11', false, true, 'inversion'),
  (19, 'AV. DEL BOSC 67-69 3º 3ª L''H', 'vendido', '2025-04-23', true, 43174.67, 14883.47, 5653.61, '2025-11-10', NULL, '2025-05-29', false, true, 'inversion'),
  (20, 'LLEVANT 43 ENT 2ª L''H', 'vendido', '2024-11-27', true, 38001.02, 4626.96, 3747.84, '2025-11-10', NULL, '2025-05-30', false, true, 'inversion'),
  (21, 'COLLSEROLA 57 4º 1ª L''H', 'vendido', '2025-03-11', true, 15616.73, 20040.84, 10616.18, '2025-11-11', NULL, '2025-05-27', false, true, 'inversion'),
  (22, 'AV. CATALUNYA 105 4º 1ª L''H', 'vendido', '2025-02-06', true, 39950.00, 20851.32, 6037.57, '2025-12-01', NULL, '2025-09-05', false, true, 'inversion'),
  (23, 'LLORER 55 AT 1ª L''H', 'vendido', '2025-01-24', true, 27005.00, 12930.66, 4269.83, '2026-01-05', NULL, '2025-10-06', false, true, 'inversion'),
  (24, 'ILLES CANÀRIES 1 5º 4ª L''H', 'vendido', '2024-11-25', true, 29211.05, 11011.90, 1639.64, '2026-01-05', NULL, '2025-10-30', false, true, 'inversion');

-- ─── Step 2: Insert settlements (one per property) ───
-- retencion, neto, efectivo are GENERATED ALWAYS — not included.

-- Op 1: MAS 112 BAJOS 2ª L'H
INSERT INTO liquidaciones (propiedad_id, fecha_liquidacion, numero_liquidacion, aportacion, retribucion, transferencia, fecha_transferencia, liquidado, ejercicio) VALUES ((SELECT id FROM propiedades WHERE numero_operacion = 1), '2025-02-21', 1, 26237.90, 12761.84, 5085.09, '2025-02-21', true, 2025);

-- Op 2: MINA 33 3º 2ª L'H
INSERT INTO liquidaciones (propiedad_id, fecha_liquidacion, numero_liquidacion, aportacion, retribucion, transferencia, fecha_transferencia, liquidado, ejercicio) VALUES ((SELECT id FROM propiedades WHERE numero_operacion = 2), '2025-02-21', 1, 33325.20, 6215.83, 5034.82, '2025-02-21', true, 2025);

-- Op 3: MARCEL·LÍ ESQUIUS 45 BAJOS 2ª L'H
INSERT INTO liquidaciones (propiedad_id, fecha_liquidacion, numero_liquidacion, aportacion, retribucion, transferencia, fecha_transferencia, liquidado, ejercicio) VALUES ((SELECT id FROM propiedades WHERE numero_operacion = 3), '2025-02-21', 1, 35842.23, 7536.23, 4912.34, '2025-02-21', true, 2025);

-- Op 4: SANT FRANCESC XAVIER 17 ENT 1 L'H
INSERT INTO liquidaciones (propiedad_id, fecha_liquidacion, numero_liquidacion, aportacion, retribucion, transferencia, fecha_transferencia, liquidado, ejercicio) VALUES ((SELECT id FROM propiedades WHERE numero_operacion = 4), '2025-02-21', 1, 27550.00, 8574.62, 2173.44, '2025-02-21', true, 2025);

-- Op 5: SEVERO OCHOA 33 2º 2ª L'H
INSERT INTO liquidaciones (propiedad_id, fecha_liquidacion, numero_liquidacion, aportacion, retribucion, transferencia, fecha_transferencia, liquidado, ejercicio) VALUES ((SELECT id FROM propiedades WHERE numero_operacion = 5), '2025-02-21', 1, 33480.00, 2596.20, 2102.92, '2025-02-21', true, 2025);

-- Op 6: PARÍS 68 ESC 1 ENT 1ª L'H
INSERT INTO liquidaciones (propiedad_id, fecha_liquidacion, numero_liquidacion, aportacion, retribucion, transferencia, fecha_transferencia, liquidado, ejercicio) VALUES ((SELECT id FROM propiedades WHERE numero_operacion = 6), '2025-02-21', 1, 34474.45, 6740.73, 79.99, '2025-02-21', true, 2025);

-- Op 7: AV. ISABEL LA CATÓLICA 74 ESC 1 4º 2ª L'H
INSERT INTO liquidaciones (propiedad_id, fecha_liquidacion, numero_liquidacion, aportacion, retribucion, transferencia, fecha_transferencia, liquidado, ejercicio) VALUES ((SELECT id FROM propiedades WHERE numero_operacion = 7), '2025-04-18', 1, 49313.20, 13114.10, 10278.42, '2025-04-18', true, 2025);

-- Op 8: FONT 9 AT 2ª L'H
INSERT INTO liquidaciones (propiedad_id, fecha_liquidacion, numero_liquidacion, aportacion, retribucion, transferencia, fecha_transferencia, liquidado, ejercicio) VALUES ((SELECT id FROM propiedades WHERE numero_operacion = 8), '2025-04-19', 1, 12740.70, 15410.77, 8222.36, '2025-04-19', true, 2025);

-- Op 9: RENCLUSA 62 4º 3ª L'H
INSERT INTO liquidaciones (propiedad_id, fecha_liquidacion, numero_liquidacion, aportacion, retribucion, transferencia, fecha_transferencia, liquidado, ejercicio) VALUES ((SELECT id FROM propiedades WHERE numero_operacion = 9), '2025-04-20', 1, 38952.25, 6434.73, 4972.13, '2025-04-20', true, 2025);

-- Op 10: AV. MIRAFLORES 34 2º 1ª L'H
INSERT INTO liquidaciones (propiedad_id, fecha_liquidacion, numero_liquidacion, aportacion, retribucion, transferencia, fecha_transferencia, liquidado, ejercicio) VALUES ((SELECT id FROM propiedades WHERE numero_operacion = 10), '2025-05-29', 1, 36254.00, 19120.80, 10295.95, '2025-05-29', true, 2025);

-- Op 11: MONTSENY 133 PRAL 1ª L'H
INSERT INTO liquidaciones (propiedad_id, fecha_liquidacion, numero_liquidacion, aportacion, retribucion, transferencia, fecha_transferencia, liquidado, ejercicio) VALUES ((SELECT id FROM propiedades WHERE numero_operacion = 11), '2025-05-30', 1, 34324.00, 23047.27, 7664.29, '2025-05-30', true, 2025);

-- Op 12: AV. DEL BOSC 28 4º 1ª L'H
INSERT INTO liquidaciones (propiedad_id, fecha_liquidacion, numero_liquidacion, aportacion, retribucion, transferencia, fecha_transferencia, liquidado, ejercicio) VALUES ((SELECT id FROM propiedades WHERE numero_operacion = 12), '2025-08-09', 1, 31904.34, 12761.74, 4561.01, '2025-08-09', true, 2025);

-- Op 13: MARTÍ I BLASI 29 3º 2ª L'H
INSERT INTO liquidaciones (propiedad_id, fecha_liquidacion, numero_liquidacion, aportacion, retribucion, transferencia, fecha_transferencia, liquidado, ejercicio) VALUES ((SELECT id FROM propiedades WHERE numero_operacion = 13), '2025-08-09', 1, 37159.91, 14351.05, 4400.35, '2025-08-09', true, 2025);

-- Op 14: AIGÜES DEL LLOBREGAT 118 ESC 1 3º 3ª L'H
INSERT INTO liquidaciones (propiedad_id, fecha_liquidacion, numero_liquidacion, aportacion, retribucion, transferencia, fecha_transferencia, liquidado, ejercicio) VALUES ((SELECT id FROM propiedades WHERE numero_operacion = 14), '2025-08-09', 1, 27258.63, 4830.78, 3912.03, '2025-08-09', true, 2025);

-- Op 15: GARROFERS 16 1º 2ª L'H
INSERT INTO liquidaciones (propiedad_id, fecha_liquidacion, numero_liquidacion, aportacion, retribucion, transferencia, fecha_transferencia, liquidado, ejercicio) VALUES ((SELECT id FROM propiedades WHERE numero_operacion = 15), '2025-08-09', 1, 31151.80, 5721.51, 4634.42, '2025-08-09', true, 2025);

-- Op 16: LLORER 12 4º 4ª L'H
INSERT INTO liquidaciones (propiedad_id, fecha_liquidacion, numero_liquidacion, aportacion, retribucion, transferencia, fecha_transferencia, liquidado, ejercicio) VALUES ((SELECT id FROM propiedades WHERE numero_operacion = 16), '2025-11-10', 1, 27977.99, 11758.54, 4836.42, '2025-11-10', true, 2025);

-- Op 17: MAS 130 3º 2ª L'H
INSERT INTO liquidaciones (propiedad_id, fecha_liquidacion, numero_liquidacion, aportacion, retribucion, transferencia, fecha_transferencia, liquidado, ejercicio) VALUES ((SELECT id FROM propiedades WHERE numero_operacion = 17), '2025-11-10', 1, 53627.40, 9574.56, 2759.39, '2025-11-10', true, 2025);

-- Op 18: AMADEU VIVES 19 3º 1ª L'H
INSERT INTO liquidaciones (propiedad_id, fecha_liquidacion, numero_liquidacion, aportacion, retribucion, transferencia, fecha_transferencia, liquidado, ejercicio) VALUES ((SELECT id FROM propiedades WHERE numero_operacion = 18), '2025-11-10', 1, 36749.44, 13059.19, 4037.94, '2025-11-10', true, 2025);

-- Op 19: AV. DEL BOSC 67-69 3º 3ª L'H
INSERT INTO liquidaciones (propiedad_id, fecha_liquidacion, numero_liquidacion, aportacion, retribucion, transferencia, fecha_transferencia, liquidado, ejercicio) VALUES ((SELECT id FROM propiedades WHERE numero_operacion = 19), '2025-11-10', 1, 43174.67, 14883.47, 5653.61, '2025-11-10', true, 2025);

-- Op 20: LLEVANT 43 ENT 2ª L'H
INSERT INTO liquidaciones (propiedad_id, fecha_liquidacion, numero_liquidacion, aportacion, retribucion, transferencia, fecha_transferencia, liquidado, ejercicio) VALUES ((SELECT id FROM propiedades WHERE numero_operacion = 20), '2025-11-10', 1, 38001.02, 4626.96, 3747.84, '2025-11-10', true, 2025);

-- Op 21: COLLSEROLA 57 4º 1ª L'H
INSERT INTO liquidaciones (propiedad_id, fecha_liquidacion, numero_liquidacion, aportacion, retribucion, transferencia, fecha_transferencia, liquidado, ejercicio) VALUES ((SELECT id FROM propiedades WHERE numero_operacion = 21), '2025-11-11', 1, 15616.73, 20040.84, 10616.18, '2025-11-11', true, 2025);

-- Op 22: AV. CATALUNYA 105 4º 1ª L'H
INSERT INTO liquidaciones (propiedad_id, fecha_liquidacion, numero_liquidacion, aportacion, retribucion, transferencia, fecha_transferencia, liquidado, ejercicio) VALUES ((SELECT id FROM propiedades WHERE numero_operacion = 22), '2025-12-01', 1, 39950.00, 20851.32, 6037.57, '2025-12-01', true, 2025);

-- Op 23: LLORER 55 AT 1ª L'H
INSERT INTO liquidaciones (propiedad_id, fecha_liquidacion, numero_liquidacion, aportacion, retribucion, transferencia, fecha_transferencia, liquidado, ejercicio) VALUES ((SELECT id FROM propiedades WHERE numero_operacion = 23), '2026-01-05', 1, 27005.00, 12930.66, 4269.83, '2026-01-05', true, 2026);

-- Op 24: ILLES CANÀRIES 1 5º 4ª L'H
INSERT INTO liquidaciones (propiedad_id, fecha_liquidacion, numero_liquidacion, aportacion, retribucion, transferencia, fecha_transferencia, liquidado, ejercicio) VALUES ((SELECT id FROM propiedades WHERE numero_operacion = 24), '2026-01-05', 1, 29211.05, 11011.90, 1639.64, '2026-01-05', true, 2026);

COMMIT;