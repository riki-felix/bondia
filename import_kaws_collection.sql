-- ============================================================
-- Import KAWS Collection → casa_activos_v2
-- Category: Arte y Coleccionables (24d0654e-ecdf-4595-be21-0c8e6500e7e6)
-- Tag: Kaws (316e87e3-25ae-49da-a46d-f4bfb7304bc7)
-- Characteristic Tamaño: 591f2531-50e8-48b7-bcbf-79b2e9749c97
-- Characteristic Unidades: f8e1f0ee-3d2c-4820-b0b2-85af0fe1e835
-- ============================================================

-- ─── 1. Create section tags ─────────────────────────────────
INSERT INTO activos_tags (id, nombre, slug, color) VALUES
  ('a0000001-0000-0000-0000-000000000001', 'Toys',            'toys',            '#f97316'),
  ('a0000001-0000-0000-0000-000000000002', 'Clothing',        'clothing',        '#8b5cf6'),
  ('a0000001-0000-0000-0000-000000000003', 'Other',           'other',           '#06b6d4'),
  ('a0000001-0000-0000-0000-000000000004', 'Prints',          'prints',          '#ec4899'),
  ('a0000001-0000-0000-0000-000000000005', 'Magazines/Books', 'magazines-books', '#84cc16'),
  ('a0000001-0000-0000-0000-000000000006', 'Shoes',           'shoes',           '#f59e0b')
ON CONFLICT (id) DO NOTHING;

-- ─── 2. Helper: variables ────────────────────────────────────
-- cat_id  = 24d0654e-ecdf-4595-be21-0c8e6500e7e6
-- tag_kaws = 316e87e3-25ae-49da-a46d-f4bfb7304bc7
-- tag_toys = a0000001-0000-0000-0000-000000000001
-- tag_clothing = a0000001-0000-0000-0000-000000000002
-- tag_other = a0000001-0000-0000-0000-000000000003
-- tag_prints = a0000001-0000-0000-0000-000000000004
-- tag_magazines = a0000001-0000-0000-0000-000000000005
-- tag_shoes = a0000001-0000-0000-0000-000000000006
-- carac_tamano = 591f2531-50e8-48b7-bcbf-79b2e9749c97
-- carac_unidades = f8e1f0ee-3d2c-4820-b0b2-85af0fe1e835

-- ─── 3. Insert activos ──────────────────────────────────────
-- Using a DO block so we can use variables and capture generated IDs

DO $$
DECLARE
  cat_id UUID := '24d0654e-ecdf-4595-be21-0c8e6500e7e6';
  tag_kaws UUID := '316e87e3-25ae-49da-a46d-f4bfb7304bc7';
  tag_toys UUID := 'a0000001-0000-0000-0000-000000000001';
  tag_clothing UUID := 'a0000001-0000-0000-0000-000000000002';
  tag_other UUID := 'a0000001-0000-0000-0000-000000000003';
  tag_prints UUID := 'a0000001-0000-0000-0000-000000000004';
  tag_magazines UUID := 'a0000001-0000-0000-0000-000000000005';
  tag_shoes UUID := 'a0000001-0000-0000-0000-000000000006';
  carac_tamano UUID := '591f2531-50e8-48b7-bcbf-79b2e9749c97';
  carac_unidades UUID := 'f8e1f0ee-3d2c-4820-b0b2-85af0fe1e835';
  aid UUID;
BEGIN

-- ═════════════════════════════════════════════════════════════
-- TOYS
-- ═════════════════════════════════════════════════════════════

-- Bunny Accomplice/Black
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Bunny Accomplice/Black', cat_id, '', 'bunny-accomplice-black') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_toys);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '23cm'), (aid, carac_unidades, '1');

-- Bunny Accomplice/Pink
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Bunny Accomplice/Pink', cat_id, '', 'bunny-accomplice-pink') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_toys);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '23cm'), (aid, carac_unidades, '1');

-- Chum (Micheline)/Yellow
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Chum (Micheline)/Yellow', cat_id, '', 'chum-micheline-yellow') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_toys);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '33cm'), (aid, carac_unidades, '1');

-- Chum (Micheline)/White
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Chum (Micheline)/White', cat_id, '', 'chum-micheline-white') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_toys);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '33cm'), (aid, carac_unidades, '1');

-- Chum (Micheline)/Black
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Chum (Micheline)/Black', cat_id, '', 'chum-micheline-black') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_toys);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '33cm'), (aid, carac_unidades, '1');

-- Chum (Micheline)/Red
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Chum (Micheline)/Red', cat_id, 'Broken feets', 'chum-micheline-red') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_toys);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '33cm'), (aid, carac_unidades, '1');

-- Chum (Micheline)/See through
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Chum (Micheline)/See through', cat_id, 'Broken feets', 'chum-micheline-see-through') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_toys);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '33cm'), (aid, carac_unidades, '1');

-- Companion (Mickey Legs)/Black
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Companion (Mickey Legs)/Black', cat_id, '', 'companion-mickey-legs-black') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_toys);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '20cm'), (aid, carac_unidades, '2');

-- Companion (Mickey Legs)/Grey
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Companion (Mickey Legs)/Grey', cat_id, '', 'companion-mickey-legs-grey') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_toys);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '20cm'), (aid, carac_unidades, '1');

-- Companion (Mickey Legs)/Brown
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Companion (Mickey Legs)/Brown', cat_id, '', 'companion-mickey-legs-brown') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_toys);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '20cm'), (aid, carac_unidades, '1');

-- Companion/Light Grey
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Companion/Light Grey', cat_id, '', 'companion-light-grey') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_toys);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '16inches/40cm'), (aid, carac_unidades, '2');

-- Companion/Brown
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Companion/Brown', cat_id, '', 'companion-brown') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_toys);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '16inches/40cm'), (aid, carac_unidades, '3');

-- Companion/Glow in the Dark
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Companion/Glow in the Dark', cat_id, '', 'companion-glow-in-the-dark') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_toys);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '16inches/40cm'), (aid, carac_unidades, '2');

-- Companion/Black
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Companion/Black', cat_id, '', 'companion-black') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_toys);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '16inches/40cm'), (aid, carac_unidades, '1');

-- Companion/Disected Grey
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Companion/Disected Grey', cat_id, '', 'companion-disected-grey') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_toys);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '16inches/40cm'), (aid, carac_unidades, '3');

-- Companion/Disected black
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Companion/Disected Black', cat_id, '', 'companion-disected-black') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_toys);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '16inches/40cm'), (aid, carac_unidades, '1');

-- Darth Vather
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Darth Vather', cat_id, '', 'darth-vather') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_toys);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '28cm'), (aid, carac_unidades, '1');

-- Hasheem (Afro)
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Hasheem (Afro)', cat_id, '', 'hasheem-afro') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_toys);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '20cm'), (aid, carac_unidades, '1');

-- Kaws Bendy/Pink
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Kaws Bendy/Pink', cat_id, '', 'kaws-bendy-pink') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_toys);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '38cm'), (aid, carac_unidades, '1');

-- Kaws Bendy/Black
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Kaws Bendy/Black', cat_id, '', 'kaws-bendy-black') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_toys);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '38cm'), (aid, carac_unidades, '1');

-- Kaws Bendy/Green
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Kaws Bendy/Green', cat_id, '', 'kaws-bendy-green') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_toys);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '38cm'), (aid, carac_unidades, '1');

-- Kaws Bendy/Blue
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Kaws Bendy/Blue', cat_id, '', 'kaws-bendy-blue') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_toys);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '38cm'), (aid, carac_unidades, '1');

-- Kaws Bendy/Yellow
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Kaws Bendy/Yellow', cat_id, '', 'kaws-bendy-yellow') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_toys);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '38cm'), (aid, carac_unidades, '1');

-- Kaws Mad Ectic Medicom silver
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Kaws Mad Ectic Medicom silver', cat_id, '', 'kaws-mad-ectic-medicom-silver') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_toys);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '400% (28cm)'), (aid, carac_unidades, '1');

-- Kaws x Bape Elephant
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Kaws x Bape Elephant', cat_id, '', 'kaws-x-bape-elephant') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_toys);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '10cm'), (aid, carac_unidades, '1');

-- Kaws x Bape Lion
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Kaws x Bape Lion', cat_id, '', 'kaws-x-bape-lion') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_toys);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '10cm'), (aid, carac_unidades, '1');

-- Kaws x Bape Monkey/White
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Kaws x Bape Monkey/White', cat_id, '', 'kaws-x-bape-monkey-white') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_toys);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '10cm'), (aid, carac_unidades, '1');

-- Kaws x Bape Monkey/Green
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Kaws x Bape Monkey/Green', cat_id, '', 'kaws-x-bape-monkey-green') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_toys);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '10cm'), (aid, carac_unidades, '1');

-- Kaws x Bape Star/Orange
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Kaws x Bape Star/Orange', cat_id, '', 'kaws-x-bape-star-orange') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_toys);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '10cm'), (aid, carac_unidades, '1');

-- Kaws x Bape Star/Purple
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Kaws x Bape Star/Purple', cat_id, '', 'kaws-x-bape-star-purple') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_toys);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '10cm'), (aid, carac_unidades, '1');

-- Kaws x Bape Star/White
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Kaws x Bape Star/White', cat_id, '', 'kaws-x-bape-star-white') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_toys);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '10cm'), (aid, carac_unidades, '1');

-- Kaws x Bape Star/Green
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Kaws x Bape Star/Green', cat_id, '', 'kaws-x-bape-star-green') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_toys);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '10cm'), (aid, carac_unidades, '1');

-- Kaws x Bape Star/Silver
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Kaws x Bape Star/Silver', cat_id, '', 'kaws-x-bape-star-silver') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_toys);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '10cm'), (aid, carac_unidades, '1');

-- Kaws x Bearbrick Medicom/ GreyDisected
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Kaws x Bearbrick Medicom/Grey Disected', cat_id, '', 'kaws-x-bearbrick-medicom-grey-disected') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_toys);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '400% (28cm)'), (aid, carac_unidades, '2');

-- Kaws x Bearbrick Medicom/Light Grey
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Kaws x Bearbrick Medicom/Light Grey', cat_id, '', 'kaws-x-bearbrick-medicom-light-grey') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_toys);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '400% (28cm)'), (aid, carac_unidades, '1');

-- Kaws x Bearbrick Medicom/Black Disected
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Kaws x Bearbrick Medicom/Black Disected', cat_id, '', 'kaws-x-bearbrick-medicom-black-disected') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_toys);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '400% (28cm)'), (aid, carac_unidades, '1');

-- Kaws x Bearbrick Medicom/Black Wood
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Kaws x Bearbrick Medicom/Black Wood', cat_id, '', 'kaws-x-bearbrick-medicom-black-wood') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_toys);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '400% (28cm)'), (aid, carac_unidades, '1');

-- Kaws x Bearbrick Medicom/Wood
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Kaws x Bearbrick Medicom/Wood', cat_id, '', 'kaws-x-bearbrick-medicom-wood') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_toys);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '400% (28cm)'), (aid, carac_unidades, '1');

-- Kaws x Bearbrick Medicom/ Blue pack
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Kaws x Bearbrick Medicom/Blue pack', cat_id, '', 'kaws-x-bearbrick-medicom-blue-pack') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_toys);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '400% (28cm)/100%'), (aid, carac_unidades, '1');

-- Kaws x Bearbrick Medicom/Blue Teeth
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Kaws x Bearbrick Medicom/Blue Teeth', cat_id, '', 'kaws-x-bearbrick-medicom-blue-teeth') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_toys);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '1000%'), (aid, carac_unidades, '1');

-- Kaws x Bearbrick Medicom/Disected Grey 1000%
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Kaws x Bearbrick Medicom/Disected Grey 1000%', cat_id, '', 'kaws-x-bearbrick-medicom-disected-grey-1000') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_toys);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '1000%'), (aid, carac_unidades, '1');

-- Kaws x Bearbrick Medicom/Disected Black 1000%
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Kaws x Bearbrick Medicom/Disected Black 1000%', cat_id, '', 'kaws-x-bearbrick-medicom-disected-black-1000') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_toys);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '1000%'), (aid, carac_unidades, '1');

-- Kaws Bearbrick 1000%
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Kaws Bearbrick 1000%', cat_id, '', 'kaws-bearbrick-1000') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_toys);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '1000%'), (aid, carac_unidades, '3');

-- Four Feet Companion Big/Grey
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Four Feet Companion Big/Grey', cat_id, '', 'four-feet-companion-big-grey') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_toys);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '52inc (132,1cm)'), (aid, carac_unidades, '1');

-- Four Feet Companion big/Brown
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Four Feet Companion Big/Brown', cat_id, '', 'four-feet-companion-big-brown') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_toys);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '52inc (132,1cm)'), (aid, carac_unidades, '1');

-- Four Feet Companion/Black Disected
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Four Feet Companion/Black Disected', cat_id, '', 'four-feet-companion-black-disected') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_toys);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '52inc (132,1cm)'), (aid, carac_unidades, '1');

-- Kaws x Bearbrick Medicom/ Disected Black 400%
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Kaws x Bearbrick Medicom/Disected Black 400%', cat_id, '', 'kaws-x-bearbrick-medicom-disected-black-400') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_toys);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '400%'), (aid, carac_unidades, '1');

-- Kaws X Hajime Sorayama – No Future Companion/Black
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Kaws X Hajime Sorayama - No Future Companion/Black', cat_id, '', 'kaws-x-hajime-sorayama-no-future-companion-black') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_toys);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '40cm'), (aid, carac_unidades, '1');

-- Kaws X Hajime Sorayama – No Future Companion/Silver
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Kaws X Hajime Sorayama - No Future Companion/Silver', cat_id, '', 'kaws-x-hajime-sorayama-no-future-companion-silver') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_toys);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '40cm'), (aid, carac_unidades, '1');

-- Kaws x Kubrick Bus Stop/Black
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Kaws x Kubrick Bus Stop/Black', cat_id, '', 'kaws-x-kubrick-bus-stop-black') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_toys);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '21cm'), (aid, carac_unidades, '1');

-- Kaws x Kubrick Bus Stop/Blue
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Kaws x Kubrick Bus Stop/Blue', cat_id, '', 'kaws-x-kubrick-bus-stop-blue') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_toys);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '21cm'), (aid, carac_unidades, '1');

-- Kaws x Kubrick Bus Stop/Purple
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Kaws x Kubrick Bus Stop/Purple', cat_id, '', 'kaws-x-kubrick-bus-stop-purple') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_toys);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '21cm'), (aid, carac_unidades, '1');

-- Kaws x Kubrick Bus Stop/Silver
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Kaws x Kubrick Bus Stop/Silver', cat_id, '', 'kaws-x-kubrick-bus-stop-silver') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_toys);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '21cm'), (aid, carac_unidades, '1');

-- Kaws x Pushead/Glow in the Dark
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Kaws x Pushead/Glow in the Dark', cat_id, '', 'kaws-x-pushead-glow-in-the-dark') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_toys);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '28cm'), (aid, carac_unidades, '4');

-- Kaws x Pushead/Black
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Kaws x Pushead/Black', cat_id, '', 'kaws-x-pushead-black') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_toys);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '28cm'), (aid, carac_unidades, '2');

-- Kaws x Pushead/Silver
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Kaws x Pushead/Silver', cat_id, '', 'kaws-x-pushead-silver') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_toys);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '28cm'), (aid, carac_unidades, '1');

-- Kaws x Pushead/Green
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Kaws x Pushead/Green', cat_id, '', 'kaws-x-pushead-green') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_toys);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '28cm'), (aid, carac_unidades, '1');

-- Original Fake Cat Teeth Bank/Orange
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Original Fake Cat Teeth Bank/Orange', cat_id, '', 'original-fake-cat-teeth-bank-orange') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_toys);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '10cm'), (aid, carac_unidades, '1');

-- Original Fake Cat Teeth Bank/Black
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Original Fake Cat Teeth Bank/Black', cat_id, '', 'original-fake-cat-teeth-bank-black') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_toys);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '10cm'), (aid, carac_unidades, '1');

-- Original Fake Cat Teeth Bank/Green
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Original Fake Cat Teeth Bank/Green', cat_id, '', 'original-fake-cat-teeth-bank-green') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_toys);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '10cm'), (aid, carac_unidades, '1');

-- Original Fake Cat Teeth Bank/Blue
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Original Fake Cat Teeth Bank/Blue', cat_id, '', 'original-fake-cat-teeth-bank-blue') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_toys);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '10cm'), (aid, carac_unidades, '1');

-- Original Fake x Bounty Hunter/Green
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Original Fake x Bounty Hunter/Green', cat_id, '', 'original-fake-x-bounty-hunter-green') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_toys);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '16cm'), (aid, carac_unidades, '7');

-- Original Fake x Bounty Hunter/Black
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Original Fake x Bounty Hunter/Black', cat_id, '', 'original-fake-x-bounty-hunter-black') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_toys);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '16cm'), (aid, carac_unidades, '1');

-- Original Fake x Bounty Hunter/White
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Original Fake x Bounty Hunter/White', cat_id, '', 'original-fake-x-bounty-hunter-white') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_toys);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '16cm'), (aid, carac_unidades, '1');

-- Original Fake x Bounty Hunter/Black White
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Original Fake x Bounty Hunter/Black White', cat_id, '', 'original-fake-x-bounty-hunter-black-white') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_toys);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '16cm'), (aid, carac_unidades, '1');

-- Original Fake x Bounty Hunter/Grey
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Original Fake x Bounty Hunter/Grey', cat_id, '', 'original-fake-x-bounty-hunter-grey') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_toys);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '16cm'), (aid, carac_unidades, '1');

-- Original Fake x Bounty Hunter/Red
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Original Fake x Bounty Hunter/Red', cat_id, '', 'original-fake-x-bounty-hunter-red') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_toys);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '16cm'), (aid, carac_unidades, '1');

-- Pinocchio and Jimmy Cricket Disney
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Pinocchio and Jimmy Cricket Disney', cat_id, '', 'pinocchio-and-jimmy-cricket-disney') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_toys);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '25cm'), (aid, carac_unidades, '1');

-- Kaws Blitz (Rocket)/Blue
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Kaws Blitz (Rocket)/Blue', cat_id, '', 'kaws-blitz-rocket-blue') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_toys);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '14cm'), (aid, carac_unidades, '1');

-- Kaws Blitz (Rocket)/See through
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Kaws Blitz (Rocket)/See through', cat_id, '', 'kaws-blitz-rocket-see-through') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_toys);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '14cm'), (aid, carac_unidades, '1');

-- Kaws Blitz (Rocket)/Green
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Kaws Blitz (Rocket)/Green', cat_id, '', 'kaws-blitz-rocket-green') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_toys);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '14cm'), (aid, carac_unidades, '1');

-- Bearbrick x Kaws/grey 400%
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Bearbrick x Kaws/Grey', cat_id, '', 'bearbrick-x-kaws-grey') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_toys);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '400% (28cm)'), (aid, carac_unidades, '1');

-- Kaws Jpp (Sobukun)/Yellow
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Kaws Jpp (Sobukun)/Yellow', cat_id, '', 'kaws-jpp-sobukun-yellow') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_toys);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '20cm'), (aid, carac_unidades, '1');

-- Kaws Jpp (Sobukun)/Black
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Kaws Jpp (Sobukun)/Black', cat_id, '', 'kaws-jpp-sobukun-black') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_toys);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '20cm'), (aid, carac_unidades, '1');

-- Tweety/Black
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Tweety/Black', cat_id, '', 'tweety-black') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_toys);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '23cm'), (aid, carac_unidades, '1');

-- Tweety/Yellow
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Tweety/Yellow', cat_id, '', 'tweety-yellow') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_toys);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '23cm'), (aid, carac_unidades, '1');

-- The Twins/Pink
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('The Twins/Pink', cat_id, '', 'the-twins-pink') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_toys);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '20cm'), (aid, carac_unidades, '1');

-- The Twins/Glitter black
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('The Twins/Glitter Black', cat_id, '', 'the-twins-glitter-black') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_toys);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '20cm'), (aid, carac_unidades, '1');

-- The Twins/Brown
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('The Twins/Brown', cat_id, '', 'the-twins-brown') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_toys);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '20cm'), (aid, carac_unidades, '1');

-- Undercover Jun Takashi x Kaws Bear/White
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Undercover Jun Takashi x Kaws Bear/White', cat_id, '', 'undercover-jun-takashi-x-kaws-bear-white') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_toys);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '20cm'), (aid, carac_unidades, '1');

-- Undercover Jun Takashi x Kaws Bear/Black
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Undercover Jun Takashi x Kaws Bear/Black', cat_id, '', 'undercover-jun-takashi-x-kaws-bear-black') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_toys);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '20cm'), (aid, carac_unidades, '1');

-- Kaws Warm regards bar/Brown
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Kaws Warm Regards Bar/Brown', cat_id, '', 'kaws-warm-regards-bar-brown') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_toys);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '16cm'), (aid, carac_unidades, '1');

-- Wonderwall/Brown
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Wonderwall/Brown', cat_id, '', 'wonderwall-brown') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_toys);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '20cm'), (aid, carac_unidades, '1');

-- Wonderwall/Black
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Wonderwall/Black', cat_id, '', 'wonderwall-black') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_toys);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '20cm'), (aid, carac_unidades, '1');

-- Zooth the dog/White
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Zooth the dog/White', cat_id, '', 'zooth-the-dog-white') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_toys);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '20x20cm'), (aid, carac_unidades, '1');

-- Zooth the dog/Black
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Zooth the dog/Black', cat_id, '', 'zooth-the-dog-black') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_toys);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '20x20cm'), (aid, carac_unidades, '1');

-- Bearbrick Small/Blue
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Bearbrick Small/Blue', cat_id, '', 'bearbrick-small-blue') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_toys);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '100%'), (aid, carac_unidades, '1');

-- Bearbrick Small/Grey
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Bearbrick Small/Grey', cat_id, '', 'bearbrick-small-grey') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_toys);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '100%'), (aid, carac_unidades, '1');

-- NEW MEDHECTIC KAWS x Miffy kaws fc doll rabbit 2001
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Kaws x Miffy FC Doll Rabbit 2001 (Medhectic)', cat_id, '', 'kaws-x-miffy-fc-doll-rabbit-2001') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_toys);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '10cm'), (aid, carac_unidades, '1');

-- ═════════════════════════════════════════════════════════════
-- CLOTHING
-- ═════════════════════════════════════════════════════════════

-- Michelline Tee/Red
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Michelline Tee/Red', cat_id, '', 'michelline-tee-red') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_clothing);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, 'M'), (aid, carac_unidades, '1');

-- Bathing Ape Jacket/Black
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Bathing Ape Jacket/Black', cat_id, '', 'bathing-ape-jacket-black') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_clothing);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, 'M'), (aid, carac_unidades, '1');

-- Goretex Jacket/Black
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Goretex Jacket/Black', cat_id, '', 'goretex-jacket-black') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_clothing);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, 'XL'), (aid, carac_unidades, '1');

-- Levis x Kaws Denim Jacket
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Levis x Kaws Denim Jacket', cat_id, '', 'levis-x-kaws-denim-jacket') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_clothing);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '42'), (aid, carac_unidades, '1');

-- Levis Jeans x Kaws
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Levis Jeans x Kaws', cat_id, '', 'levis-jeans-x-kaws') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_clothing);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '42'), (aid, carac_unidades, '2');

-- ═════════════════════════════════════════════════════════════
-- OTHER
-- ═════════════════════════════════════════════════════════════

-- Burton Snow Boards x Kaws
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Burton Snow Boards x Kaws', cat_id, '', 'burton-snow-boards-x-kaws') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_other);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '153-157'), (aid, carac_unidades, '1');

-- Kaws Ashtray
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Kaws Ashtray', cat_id, '', 'kaws-ashtray') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_other);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '10cm'), (aid, carac_unidades, '1');

-- Dos Equis Beer/Orange
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Dos Equis Beer/Orange', cat_id, '', 'dos-equis-beer-orange') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_other);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '15cm'), (aid, carac_unidades, '1');

-- Real Skateboards x Kaws/Blue
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Real Skateboards x Kaws/Blue', cat_id, '', 'real-skateboards-x-kaws-blue') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_other);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '80cm'), (aid, carac_unidades, '1');

-- Real Skateboards x Kaws/Yellow
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Real Skateboards x Kaws/Yellow', cat_id, '', 'real-skateboards-x-kaws-yellow') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_other);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '80cm'), (aid, carac_unidades, '1');

-- Pillow Original Fake "O"/Blue
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Pillow Original Fake "O"/Blue', cat_id, '', 'pillow-original-fake-o-blue') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_other);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_unidades, '2');

-- Pillow Original Fake "O"/Grey
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Pillow Original Fake "O"/Grey', cat_id, '', 'pillow-original-fake-o-grey') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_other);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_unidades, '1');

-- Kat Teeth Pin/Green
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Kat Teeth Pin/Green', cat_id, '', 'kat-teeth-pin-green') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_other);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_unidades, '1');

-- Set of pins/Multi color
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Set of Pins/Multi Color', cat_id, '', 'set-of-pins-multi-color') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_other);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_unidades, '2');

-- Original Fake Scarf/Grey
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Original Fake Scarf/Grey', cat_id, '', 'original-fake-scarf-grey') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_other);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '1,20m'), (aid, carac_unidades, '1');

-- Original Fake Scarf/Red
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Original Fake Scarf/Red', cat_id, '', 'original-fake-scarf-red') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_other);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '1,20m'), (aid, carac_unidades, '1');

-- Crossed bones pillow/Grey
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Crossed Bones Pillow/Grey', cat_id, '', 'crossed-bones-pillow-grey') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_other);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '40x23cm'), (aid, carac_unidades, '1');

-- Crossed bones pillow/Brown
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Crossed Bones Pillow/Brown', cat_id, '', 'crossed-bones-pillow-brown') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_other);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '40x23cm'), (aid, carac_unidades, '1');

-- Crossed bones pillow/Baby blue
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Crossed Bones Pillow/Baby Blue', cat_id, '', 'crossed-bones-pillow-baby-blue') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_other);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '40x23cm'), (aid, carac_unidades, '1');

-- Companion pillows/Baby blue
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Companion Pillows/Baby Blue', cat_id, '', 'companion-pillows-baby-blue') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_other);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '40x23cm'), (aid, carac_unidades, '1');

-- Companion pillows/Grey
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Companion Pillows/Grey', cat_id, '', 'companion-pillows-grey') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_other);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '40x23cm'), (aid, carac_unidades, '1');

-- Companion pillows/Pink
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Companion Pillows/Pink', cat_id, '', 'companion-pillows-pink') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_other);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '40x23cm'), (aid, carac_unidades, '1');

-- Round teeth pillows/Red
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Round Teeth Pillows/Red', cat_id, '', 'round-teeth-pillows-red') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_other);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '30cm'), (aid, carac_unidades, '3');

-- Round teeth pillows/Black
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Round Teeth Pillows/Black', cat_id, '', 'round-teeth-pillows-black') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_other);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '30cm'), (aid, carac_unidades, '1');

-- Original Fake Halloween Decorations
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Original Fake Halloween Decorations', cat_id, '', 'original-fake-halloween-decorations') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_other);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '1,20m'), (aid, carac_unidades, '1');

-- Black Rugg
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Black Rugg', cat_id, '', 'black-rugg') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_other);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '68x50cm'), (aid, carac_unidades, '2');

-- Kaws pezz/Grey
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Kaws Pezz/Grey', cat_id, '', 'kaws-pezz-grey') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_other);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '8cm'), (aid, carac_unidades, '1');

-- KAWS OriginalFake x Medicom Bunny Keychain
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Kaws OriginalFake x Medicom Bunny Keychain', cat_id, '', 'kaws-originalfake-x-medicom-bunny-keychain') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_other);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '2in'), (aid, carac_unidades, '2');

-- KAWS OriginalFake x Medicom Companion Keychain
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Kaws OriginalFake x Medicom Companion Keychain', cat_id, '', 'kaws-originalfake-x-medicom-companion-keychain') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_other);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '2in'), (aid, carac_unidades, '11');

-- KAWS OriginalFake x Medicom Chum Keychain
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Kaws OriginalFake x Medicom Chum Keychain', cat_id, '', 'kaws-originalfake-x-medicom-chum-keychain') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_other);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '2in'), (aid, carac_unidades, '1');

-- Kaws mouse pad/Blue
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Kaws Mouse Pad/Blue', cat_id, '', 'kaws-mouse-pad-blue') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_other);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_unidades, '2');

-- Kaws envelope/Yellow
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Kaws Envelope/Yellow', cat_id, '', 'kaws-envelope-yellow') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_other);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_unidades, '1');

-- Tarot by Kaws
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Tarot by Kaws', cat_id, '', 'tarot-by-kaws') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_other);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_unidades, '4');

-- Kaws x incase x Arketip laptop cases/Black
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Kaws x Incase x Arketip Laptop Cases/Black', cat_id, '', 'kaws-x-incase-x-arketip-laptop-cases-black') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_other);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_unidades, '2');

-- Ape sounds CD x Kaws
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Ape Sounds CD x Kaws', cat_id, '', 'ape-sounds-cd-x-kaws') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_other);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_unidades, '1');

-- Tse Tese Sun Glasses x Original Fake
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Tse Tese Sun Glasses x Original Fake', cat_id, '', 'tse-tese-sun-glasses-x-original-fake') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_other);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '15cm'), (aid, carac_unidades, '1');

-- ═════════════════════════════════════════════════════════════
-- PRINTS
-- ═════════════════════════════════════════════════════════════

-- Disected Companion Print/Screenprint on paper
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Disected Companion Print', cat_id, 'Screenprint on paper', 'disected-companion-print') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_prints);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '20 x 20 in. (50.8 x 50.8 cm)'), (aid, carac_unidades, '1');

-- Print Chum vs Astroboy
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Print Chum vs Astroboy', cat_id, 'Screenprint on paper', 'print-chum-vs-astroboy') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_prints);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '35 1/8 x 24 7/8 in. (89.2 x 63.2 cm)'), (aid, carac_unidades, '1');

-- Medicom 50% Bearbrick ~ Original Fake Kaws Choro Q car/Brown
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Medicom 50% Bearbrick ~ Original Fake Kaws Choro Q Car/Brown', cat_id, '', 'medicom-50-bearbrick-original-fake-kaws-choro-q-car-brown') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_prints);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '3cm'), (aid, carac_unidades, '1');

-- Medicom 50% Bearbrick ~ Original Fake Kaws Choro Q car/Grey
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Medicom 50% Bearbrick ~ Original Fake Kaws Choro Q Car/Grey', cat_id, '', 'medicom-50-bearbrick-original-fake-kaws-choro-q-car-grey') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_prints);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, '50%'), (aid, carac_unidades, '1');

-- Undercover prints
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Undercover Prints', cat_id, '', 'undercover-prints') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_prints);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, 'DinA3'), (aid, carac_unidades, '4');

-- ═════════════════════════════════════════════════════════════
-- MAGAZINES/BOOKS
-- ═════════════════════════════════════════════════════════════

-- Magazine Monster Children Kaws cover
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Magazine Monster Children Kaws Cover', cat_id, '', 'magazine-monster-children-kaws-cover') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_magazines);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_unidades, '1');

-- Arketip Book
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Arketip Book', cat_id, '', 'arketip-book') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_magazines);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_unidades, '1');

-- Arketip Issue 11
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Arketip Issue 11', cat_id, '', 'arketip-issue-11') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_magazines);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_unidades, '1');

-- Kaws Exposed
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Kaws Exposed', cat_id, '', 'kaws-exposed') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_magazines);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_unidades, '1');

-- Giant Robot Issue 35
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Giant Robot Issue 35', cat_id, '', 'giant-robot-issue-35') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_magazines);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_unidades, '3');

-- KAWS ARKITIP MAGAZINE & MAGNET. ISSUE NO. 0020. 918/1000. MINT CONDITION
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Kaws Arkitip Magazine & Magnet Issue No. 0020 (918/1000)', cat_id, 'Mint condition', 'kaws-arkitip-magazine-magnet-issue-0020') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_magazines);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_unidades, '1');

-- Juxtapoz Special Street Art Issue
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Juxtapoz Special Street Art Issue', cat_id, '', 'juxtapoz-special-street-art-issue') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_magazines);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_unidades, '1');

-- Anpq Vol2 Number1
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Anpq Vol2 Number1', cat_id, '', 'anpq-vol2-number1') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_magazines);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_unidades, '1');

-- Kaws C10, Kimpsons Book
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Kaws C10, Kimpsons Book', cat_id, '', 'kaws-c10-kimpsons-book') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_magazines);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_unidades, '1');

-- Original Fake 2010 Catalog
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Original Fake 2010 Catalog', cat_id, '', 'original-fake-2010-catalog') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_magazines);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_unidades, '1');

-- Jalouse magazine Issue 103
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Jalouse Magazine Issue 103', cat_id, '', 'jalouse-magazine-issue-103') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_magazines);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_unidades, '1');

-- Ape Sounds CD
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Ape Sounds CD', cat_id, '', 'ape-sounds-cd') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_magazines);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_unidades, '1');

-- Cream Issue 02
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Cream Issue 02', cat_id, '', 'cream-issue-02') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_magazines);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_unidades, '1');

-- Super7 Issue 14
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Super7 Issue 14', cat_id, '', 'super7-issue-14') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_magazines);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_unidades, '1');

-- ID magazine Issue 289
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('ID Magazine Issue 289', cat_id, '', 'id-magazine-issue-289') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_magazines);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_unidades, '2');

-- Milk Issue 252
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Milk Issue 252', cat_id, '', 'milk-issue-252') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_magazines);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_unidades, '1');

-- Made Magazine + CD
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Made Magazine + CD', cat_id, '', 'made-magazine-cd') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_magazines);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_unidades, '1');

-- ═════════════════════════════════════════════════════════════
-- SHOES
-- ═════════════════════════════════════════════════════════════

-- Visvim Slip On Kaws
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Visvim Slip On Kaws', cat_id, 'Used', 'visvim-slip-on-kaws') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_shoes);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, 'US12'), (aid, carac_unidades, '1');

-- Bapesta x Kaws Teeth
INSERT INTO casa_activos_v2 (nombre, categoria_id, notas, slug)
VALUES ('Bapesta x Kaws Teeth', cat_id, 'Used', 'bapesta-x-kaws-teeth') RETURNING id INTO aid;
INSERT INTO casa_activos_tags (activo_id, tag_id) VALUES (aid, tag_kaws), (aid, tag_shoes);
INSERT INTO casa_activos_caracteristica_valores (activo_id, caracteristica_id, valor) VALUES (aid, carac_tamano, 'US12'), (aid, carac_unidades, '1');

END $$;
