-- Restaura liquidaciones.numero_operacion (Nº OP manual) desde histórico SANYUS
-- (Excel compra-venta-2.xlsx). No modifica propiedades.numero_operacion (ID inversión).

WITH mapping (ope, titulo) AS (
  VALUES
    -- Hoja 2025
    (42, 'AV. ISABEL LA CATÓLICA 74 ESC 1 4º 2ª L''H'),
    (35, 'RENCLUSA 62 4º 3ª L''H'),
    (52, 'AV. DEL BOSC 28 4º 1ª L''H'),
    (44, 'MARTÍ I BLASI 29 3º 2ª L''H'),
    (48, 'AIGÜES DEL LLOBREGAT 118 ESC 1 3º 3ª L''H'),
    (47, 'GARROFERS 16 1º 2ª L''H'),
    (53, 'LLORER 12 4º 4ª L''H'),
    (50, 'MAS 130 3º 2ª L''H'),
    (58, 'AMADEU VIVES 19 3º 1ª L''H'),
    (62, 'AV. DEL BOSC 67-69 3º 3ª L''H'),
    (46, 'LLEVANT 43 ENT 2ª L''H'),
    (60, 'COLLSEROLA 57 4º 1ª L''H'),
    (55, 'AV. CATALUNYA 105 4º 1ª L''H'),
    (54, 'LLORER 55 AT 1ª L''H'),
    (45, 'ILLES CANÀRIES 1 5º 4ª L''H'),
    -- Hoja 2026
    (22, 'COLLSEROLA 91 SOB AT 2ª L''H'),
    (28, 'TREBALL 2 1º 1ª L''H'),
    (30, 'AV. MIRAFLORES 14 3º 1ª L''H'),
    (26, 'ANTIGA TRAVESSERA 5 3º 1ª L''H'),
    (20, 'MARE DE DÉU DE NÚRIA 23 ENT 1ª L''H'),
    (18, 'PARÍS 72 AT 2ª L''H'),
    (24, 'AIGÜES DEL LLOBREGAT 131 BJOS 1ª L''H'),
    (27, 'ABEDUL 6 4º 1ª L''H'),
    (32, 'ROSES 8 3º 1ª L''H'),
    (31, 'AV. PONENT 30 3º 1ª L''H'),
    (43, 'ENGINYER MONCUNILL 36 4º 4ª L''H')
)
UPDATE public.liquidaciones l
SET numero_operacion = m.ope
FROM public.propiedades p
JOIN mapping m ON m.titulo = p.titulo
WHERE l.propiedad_id = p.id
  AND p.tipo = 'inversion'
  AND (l.numero_operacion IS DISTINCT FROM m.ope);

-- Comprobación (ejecutar aparte si quieres verificar):
-- SELECT p.titulo, p.numero_operacion AS id_inversion, l.numero_operacion AS n_op
-- FROM liquidaciones l
-- JOIN propiedades p ON p.id = l.propiedad_id
-- WHERE p.tipo = 'inversion'
-- ORDER BY l.numero_operacion NULLS LAST, p.numero_operacion;
