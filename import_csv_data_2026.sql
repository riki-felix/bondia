-- =============================================================
-- AUTO-GENERATED SQL from "Activos 2026-Tabla 1.csv"
-- Generated: 2026-03-11 18:29
-- =============================================================
-- ADDITIVE IMPORT: Appends to existing data (offset +24).
-- "Bloqueado" → sin_estado, "En proceso" → negociacion.
-- Settlements only for JA=VERDADERO rows (IDs 1-7).
-- Skipped rows without ID (totals, Floridablanca, MAS 114).
-- Row 3: date "28/11/202" interpreted as 2025-11-28.
-- Rows 6-7: date "13/1/26" interpreted as 2026-01-13.
-- =============================================================

BEGIN;

-- ─── Step 1: Insert properties ───
INSERT INTO propiedades (
  numero_operacion, titulo, estado, fecha_ingreso,
  pago, aportacion, retribucion, ingreso_banco,
  transfe, fecha_compra, fecha_venta,
  ocupado, liquidacion, tipo
) VALUES
  (25, 'COLLSEROLA 91 SOB AT 2ª L''H', 'vendido', '2025-03-28', true, 51418.58, 1657.39, 4519.28, '2026-01-05', NULL, '2025-10-28', false, true, 'inversion'),
  (26, 'TREBALL 2 1º 1ª L''H', 'vendido', '2025-04-16', true, 65870.96, 8419.24, 5703.58, '2026-01-05', NULL, '2025-11-03', false, true, 'inversion'),
  (27, 'AV. MIRAFLORES 14 3º 1ª L''H', 'vendido', '2025-06-18', true, 68594.70, 11422.91, 1440.56, '2026-01-12', NULL, '2025-11-28', false, true, 'inversion'),
  (28, 'ANTIGA TRAVESSERA 5 3º 1ª L''H', 'vendido', '2025-06-13', true, 71926.77, 5258.59, 4259.46, '2026-01-12', NULL, '2025-11-12', false, true, 'inversion'),
  (29, 'MARE DE DÉU DE NÚRIA 23 ENT 1ª L''H', 'vendido', '2025-05-21', true, 49386.32, 9082.95, 5565.19, '2026-01-12', NULL, '2025-11-17', false, true, 'inversion'),
  (30, 'PARÍS 72 AT 2ª L''H', 'vendido', '2025-05-05', true, 42645.40, 16786.21, 6336.83, '2026-01-13', NULL, '2025-12-12', false, true, 'inversion'),
  (31, 'AIGÜES DEL LLOBREGAT 131 BJOS 1ª L''H', 'vendido', '2025-06-11', true, 80794.84, 14520.16, 4605.31, '2026-01-13', NULL, '2025-12-17', false, true, 'inversion'),
  (32, 'MARTÍ I JULIÀ', 'sin_estado', '2022-08-10', false, 4200.00, 0, 0.00, NULL, NULL, NULL, false, false, 'inversion'),
  (33, 'ROSES 8 3º 1ª L''H', 'vendido', '2025-12-16', false, 52839.81, 0, 0.00, NULL, NULL, NULL, false, false, 'inversion'),
  (34, 'ALEGRIA 32 1º 2ª L''H', 'negociacion', '2025-04-09', false, 0, 0, 0.00, NULL, NULL, NULL, false, false, 'inversion'),
  (35, 'ABEDUL 6 4º 1ª L''H', 'negociacion', '2025-06-11', false, 54844.90, 0, 0.00, NULL, NULL, NULL, true, false, 'inversion'),
  (36, 'AV. PONENT 30 3º 1ª L''H', 'comprado', '2025-12-24', false, 50961.25, 0, 0.00, NULL, NULL, NULL, false, false, 'inversion'),
  (37, 'TEIDE 86 2º 4ª L''H', 'comprado', '2025-11-11', false, 9915.00, 0, 0.00, NULL, NULL, NULL, false, false, 'inversion'),
  (38, 'PIERA 7 AT 1ª L''H', 'negociacion', '2026-01-02', false, 12380.00, 0, 0.00, NULL, NULL, NULL, false, false, 'inversion'),
  (39, 'ENGINYER MONCUNILL 36 4º 4ª L''H', 'negociacion', '2026-01-08', false, 47183.27, 0, 0.00, NULL, NULL, NULL, false, false, 'inversion'),
  (40, 'ESTEVE GRAU 22 AT 2ª L''H', 'comprado', '2026-02-02', false, 500.00, 0, 0, NULL, NULL, NULL, false, false, 'inversion');

-- ─── Step 2: Insert settlements (JA=VERDADERO only) ───
-- retencion, neto, efectivo are GENERATED ALWAYS — not included.

-- Op 25 (CSV 1): COLLSEROLA 91 SOB AT 2ª L'H
INSERT INTO liquidaciones (propiedad_id, fecha_liquidacion, numero_liquidacion, aportacion, retribucion, transferencia, fecha_transferencia, liquidado, ejercicio) VALUES ((SELECT id FROM propiedades WHERE numero_operacion = 25), '2026-01-05', 1, 51418.58, 1657.39, 4519.28, '2026-01-05', true, 2026);

-- Op 26 (CSV 2): TREBALL 2 1º 1ª L'H
INSERT INTO liquidaciones (propiedad_id, fecha_liquidacion, numero_liquidacion, aportacion, retribucion, transferencia, fecha_transferencia, liquidado, ejercicio) VALUES ((SELECT id FROM propiedades WHERE numero_operacion = 26), '2026-01-05', 2, 65870.96, 8419.24, 5703.58, '2026-01-05', true, 2026);

-- Op 27 (CSV 3): AV. MIRAFLORES 14 3º 1ª L'H
INSERT INTO liquidaciones (propiedad_id, fecha_liquidacion, numero_liquidacion, aportacion, retribucion, transferencia, fecha_transferencia, liquidado, ejercicio) VALUES ((SELECT id FROM propiedades WHERE numero_operacion = 27), '2026-01-12', 3, 68594.70, 11422.91, 1440.56, '2026-01-12', true, 2026);

-- Op 28 (CSV 4): ANTIGA TRAVESSERA 5 3º 1ª L'H
INSERT INTO liquidaciones (propiedad_id, fecha_liquidacion, numero_liquidacion, aportacion, retribucion, transferencia, fecha_transferencia, liquidado, ejercicio) VALUES ((SELECT id FROM propiedades WHERE numero_operacion = 28), '2026-01-12', 4, 71926.77, 5258.59, 4259.46, '2026-01-12', true, 2026);

-- Op 29 (CSV 5): MARE DE DÉU DE NÚRIA 23 ENT 1ª L'H
INSERT INTO liquidaciones (propiedad_id, fecha_liquidacion, numero_liquidacion, aportacion, retribucion, transferencia, fecha_transferencia, liquidado, ejercicio) VALUES ((SELECT id FROM propiedades WHERE numero_operacion = 29), '2026-01-12', 5, 49386.32, 9082.95, 5565.19, '2026-01-12', true, 2026);

-- Op 30 (CSV 6): PARÍS 72 AT 2ª L'H
INSERT INTO liquidaciones (propiedad_id, fecha_liquidacion, numero_liquidacion, aportacion, retribucion, transferencia, fecha_transferencia, liquidado, ejercicio) VALUES ((SELECT id FROM propiedades WHERE numero_operacion = 30), '2026-01-13', 6, 42645.40, 16786.21, 6336.83, '2026-01-13', true, 2026);

-- Op 31 (CSV 7): AIGÜES DEL LLOBREGAT 131 BJOS 1ª L'H
INSERT INTO liquidaciones (propiedad_id, fecha_liquidacion, numero_liquidacion, aportacion, retribucion, transferencia, fecha_transferencia, liquidado, ejercicio) VALUES ((SELECT id FROM propiedades WHERE numero_operacion = 31), '2026-01-13', 7, 80794.84, 14520.16, 4605.31, '2026-01-13', true, 2026);

COMMIT;