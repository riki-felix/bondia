-- Import: Casa gastos data – ejercicio 2026
-- Depends on: 20260331000000_create_casa.sql, 20260331100000_seed_casa_gastos_categorias.sql

-- ─── Gastos ──────────────────────────────────────────────────

INSERT INTO public.casa_gastos (concepto, categoria_id, frecuencia, fecha_inicio, fecha_fin, importe, ejercicio, slug)
VALUES
    -- Alquiler
    ('AGAF almacén',
        (SELECT id FROM public.casa_gastos_categorias WHERE slug = 'alquiler'),
        'mensual', NULL, '2026-12-31', 573.00, 2026, 'agaf-almacen-2026'),

    -- Familia
    ('Laura madre',
        (SELECT id FROM public.casa_gastos_categorias WHERE slug = 'familia'),
        'puntual', '2026-06-01', '2026-06-30', 270.00, 2026, 'laura-madre-2026'),

    -- Educación
    ('Salesians Izan',
        (SELECT id FROM public.casa_gastos_categorias WHERE slug = 'educacion'),
        'mensual', NULL, '2026-06-30', 250.00, 2026, 'salesians-izan-2026'),

    ('IFP Laura',
        (SELECT id FROM public.casa_gastos_categorias WHERE slug = 'educacion'),
        'mensual', '2026-02-01', '2026-06-30', 232.00, 2026, 'ifp-laura-2026'),

    -- Gym
    ('Barrefit Laura',
        (SELECT id FROM public.casa_gastos_categorias WHERE slug = 'gym'),
        'mensual', '2026-02-01', NULL, 76.00, 2026, 'barrefit-laura-2026'),

    -- Seguro (mensual durante 3 años)
    ('Seguro coche CaixaBank',
        (SELECT id FROM public.casa_gastos_categorias WHERE slug = 'seguro'),
        'mensual', NULL, NULL, 60.00, 2026, 'seguro-coche-caixabank-2026'),

    -- Renting
    ('Renting tel. Izan',
        (SELECT id FROM public.casa_gastos_categorias WHERE slug = 'renting'),
        'mensual', NULL, '2026-06-30', 38.00, 2026, 'renting-tel-izan-2026'),

    ('Renting tel. Laura',
        (SELECT id FROM public.casa_gastos_categorias WHERE slug = 'renting'),
        'mensual', NULL, NULL, 30.00, 2026, 'renting-tel-laura-2026'),

    ('Renting tel. Carlo',
        (SELECT id FROM public.casa_gastos_categorias WHERE slug = 'renting'),
        'mensual', NULL, NULL, 30.00, 2026, 'renting-tel-carlo-2026'),

    -- Inversión
    ('Parking Izan (ahorro)',
        (SELECT id FROM public.casa_gastos_categorias WHERE slug = 'inversion'),
        'mensual', NULL, NULL, 85.00, 2026, 'parking-izan-ahorro-2026'),

    -- TV
    ('Movistar TV',
        (SELECT id FROM public.casa_gastos_categorias WHERE slug = 'tv'),
        'mensual', NULL, NULL, 35.00, 2026, 'movistar-tv-2026'),

    ('Netflix',
        (SELECT id FROM public.casa_gastos_categorias WHERE slug = 'tv'),
        'mensual', NULL, NULL, 14.00, 2026, 'netflix-2026'),

    ('SkyShowtime',
        (SELECT id FROM public.casa_gastos_categorias WHERE slug = 'tv'),
        'mensual', NULL, NULL, 4.00, 2026, 'skyshowtime-2026'),

    -- Tech
    ('Apple+',
        (SELECT id FROM public.casa_gastos_categorias WHERE slug = 'tech'),
        'mensual', NULL, NULL, 35.00, 2026, 'apple-plus-2026'),

    ('Claude Pro',
        (SELECT id FROM public.casa_gastos_categorias WHERE slug = 'tech'),
        'mensual', '2026-03-01', NULL, 24.00, 2026, 'claude-pro-2026'),

    ('Google mails LTW',
        (SELECT id FROM public.casa_gastos_categorias WHERE slug = 'tech'),
        'mensual', NULL, NULL, 20.00, 2026, 'google-mails-ltw-2026'),

    ('Renting tecnológico CaixaBank',
        (SELECT id FROM public.casa_gastos_categorias WHERE slug = 'tech'),
        'mensual', NULL, NULL, 38.00, 2026, 'renting-tecnologico-caixabank-2026')
ON CONFLICT (slug) DO NOTHING;

-- ─── Overrides (meses con importe distinto a la base) ────────

INSERT INTO public.casa_gastos_overrides (gasto_id, ejercicio, mes, importe)
VALUES
    -- Salesians Izan: Mar = 249 (base 250)
    ((SELECT id FROM public.casa_gastos WHERE slug = 'salesians-izan-2026'), 2026, 3, 249.00),

    -- Seguro coche CaixaBank: Ene = 28 (base 60)
    ((SELECT id FROM public.casa_gastos WHERE slug = 'seguro-coche-caixabank-2026'), 2026, 1, 28.00),

    -- Movistar TV: Ene = 40 (base 35)
    ((SELECT id FROM public.casa_gastos WHERE slug = 'movistar-tv-2026'), 2026, 1, 40.00),

    -- Movistar TV: Mar = 25 (base 35)
    ((SELECT id FROM public.casa_gastos WHERE slug = 'movistar-tv-2026'), 2026, 3, 25.00)
ON CONFLICT (gasto_id, ejercicio, mes) DO NOTHING;

-- ─── Gastos (2ª tanda: seguros, IBI, comunidad, gym) ────────

INSERT INTO public.casa_gastos (concepto, categoria_id, frecuencia, fecha_inicio, fecha_fin, importe, ejercicio, slug)
VALUES
    -- Seguros
    ('Moto Honda Laura',
        (SELECT id FROM public.casa_gastos_categorias WHERE slug = 'seguro'),
        'anual', NULL, NULL, 510.00, 2026, 'moto-honda-laura-2026'),

    ('Moto Carlo Pelayo',
        (SELECT id FROM public.casa_gastos_categorias WHERE slug = 'seguro'),
        'anual', '2026-05-01', NULL, 510.00, 2026, 'moto-carlo-pelayo-2026'),

    ('FIATC personal',
        (SELECT id FROM public.casa_gastos_categorias WHERE slug = 'seguro'),
        'semestral', '2026-04-01', NULL, 267.00, 2026, 'fiatc-personal-2026'),

    ('AXA Vida Carlo',
        (SELECT id FROM public.casa_gastos_categorias WHERE slug = 'seguro'),
        'anual', '2026-02-01', NULL, 198.00, 2026, 'axa-vida-carlo-2026'),

    ('ARAG',
        (SELECT id FROM public.casa_gastos_categorias WHERE slug = 'seguro'),
        'anual', NULL, NULL, 26.00, 2026, 'arag-2026'),

    ('Securitas Direct',
        (SELECT id FROM public.casa_gastos_categorias WHERE slug = 'seguro'),
        'trimestral', NULL, NULL, 44.00, 2026, 'securitas-direct-2026'),

    -- IBI (trimestral desde Feb: meses 2, 5, 8, 11)
    ('IBI Alaba 61',
        (SELECT id FROM public.casa_gastos_categorias WHERE slug = 'ibi'),
        'trimestral', '2026-02-01', NULL, 128.00, 2026, 'ibi-alaba-61-2026'),

    ('IBI Arc Sant Pau',
        (SELECT id FROM public.casa_gastos_categorias WHERE slug = 'ibi'),
        'trimestral', '2026-02-01', NULL, 128.00, 2026, 'ibi-arc-sant-pau-2026'),

    ('IBI Parkings x2',
        (SELECT id FROM public.casa_gastos_categorias WHERE slug = 'ibi'),
        'trimestral', '2026-02-01', NULL, 25.00, 2026, 'ibi-parkings-x2-2026'),

    -- Comunidad (trimestral desde Ene: meses 1, 4, 7, 10)
    ('Alaba 61',
        (SELECT id FROM public.casa_gastos_categorias WHERE slug = 'comunidad'),
        'trimestral', NULL, NULL, 527.00, 2026, 'comunidad-alaba-61-2026'),

    ('Arc Sant Pau FATIR',
        (SELECT id FROM public.casa_gastos_categorias WHERE slug = 'comunidad'),
        'trimestral', NULL, NULL, 217.00, 2026, 'comunidad-arc-sant-pau-2026'),

    ('Parkings Alaba x2',
        (SELECT id FROM public.casa_gastos_categorias WHERE slug = 'comunidad'),
        'trimestral', NULL, NULL, 78.00, 2026, 'comunidad-parkings-alaba-2026'),

    -- Gym (anual, pago en junio)
    ('Gym Carlo',
        (SELECT id FROM public.casa_gastos_categorias WHERE slug = 'gym'),
        'anual', '2026-06-01', NULL, 624.00, 2026, 'gym-carlo-2026'),

    ('Gym Izan',
        (SELECT id FROM public.casa_gastos_categorias WHERE slug = 'gym'),
        'anual', '2026-06-01', NULL, 624.00, 2026, 'gym-izan-2026')
ON CONFLICT (slug) DO NOTHING;

-- ─── Overrides (2ª tanda) ────────────────────────────────────

INSERT INTO public.casa_gastos_overrides (gasto_id, ejercicio, mes, importe)
VALUES
    -- Securitas Direct: Ene = 86 (base 44)
    ((SELECT id FROM public.casa_gastos WHERE slug = 'securitas-direct-2026'), 2026, 1, 86.00),

    -- IBI Arc Sant Pau: Feb = 120 (base 128, ajuste 1r trimestre)
    ((SELECT id FROM public.casa_gastos WHERE slug = 'ibi-arc-sant-pau-2026'), 2026, 2, 120.00),

    -- IBI Parkings x2: Feb = 21 (base 25, ajuste 1r trimestre)
    ((SELECT id FROM public.casa_gastos WHERE slug = 'ibi-parkings-x2-2026'), 2026, 2, 21.00)
ON CONFLICT (gasto_id, ejercicio, mes) DO NOTHING;

-- ─── Gastos (3ª tanda: variables) ────────────────────────────

INSERT INTO public.casa_gastos (concepto, categoria_id, frecuencia, importe, ejercicio, slug)
VALUES
    ('Supermercados',
        (SELECT id FROM public.casa_gastos_categorias WHERE slug = 'supermercado'),
        'variable', 0, 2026, 'supermercados-2026'),

    ('Mercado tradicional+pan',
        (SELECT id FROM public.casa_gastos_categorias WHERE slug = 'mercado'),
        'variable', 0, 2026, 'mercado-tradicional-2026'),

    ('Restaurantes+cenas',
        (SELECT id FROM public.casa_gastos_categorias WHERE slug = 'restaurante'),
        'variable', 0, 2026, 'restaurantes-cenas-2026'),

    ('Cafés+bakeries',
        (SELECT id FROM public.casa_gastos_categorias WHERE slug = 'cafe'),
        'variable', 0, 2026, 'cafes-bakeries-2026'),

    ('Ropa y moda',
        (SELECT id FROM public.casa_gastos_categorias WHERE slug = 'ropa'),
        'variable', 0, 2026, 'ropa-moda-2026'),

    ('PayPal+Amazon compras',
        (SELECT id FROM public.casa_gastos_categorias WHERE slug = 'online'),
        'variable', 0, 2026, 'paypal-amazon-2026'),

    ('Farmacia+salud',
        (SELECT id FROM public.casa_gastos_categorias WHERE slug = 'salud'),
        'variable', 0, 2026, 'farmacia-salud-2026'),

    ('Gasolina+parking',
        (SELECT id FROM public.casa_gastos_categorias WHERE slug = 'transporte'),
        'variable', 0, 2026, 'gasolina-parking-2026'),

    ('Hogar+Nespresso',
        (SELECT id FROM public.casa_gastos_categorias WHERE slug = 'hogar'),
        'variable', 0, 2026, 'hogar-nespresso-2026'),

    ('Lotería+libros+ocio',
        (SELECT id FROM public.casa_gastos_categorias WHERE slug = 'ocio'),
        'variable', 0, 2026, 'loteria-libros-ocio-2026'),

    ('Bizums enviados',
        (SELECT id FROM public.casa_gastos_categorias WHERE slug = 'bizum'),
        'variable', 0, 2026, 'bizums-enviados-2026')
ON CONFLICT (slug) DO NOTHING;

-- ─── Overrides (3ª tanda: Ene-Mar variables) ────────────────

INSERT INTO public.casa_gastos_overrides (gasto_id, ejercicio, mes, importe)
VALUES
    -- Supermercados
    ((SELECT id FROM public.casa_gastos WHERE slug = 'supermercados-2026'), 2026, 1, 633.00),
    ((SELECT id FROM public.casa_gastos WHERE slug = 'supermercados-2026'), 2026, 2, 738.00),
    ((SELECT id FROM public.casa_gastos WHERE slug = 'supermercados-2026'), 2026, 3, 601.00),
    -- Mercado tradicional+pan
    ((SELECT id FROM public.casa_gastos WHERE slug = 'mercado-tradicional-2026'), 2026, 1, 235.00),
    ((SELECT id FROM public.casa_gastos WHERE slug = 'mercado-tradicional-2026'), 2026, 2, 340.00),
    ((SELECT id FROM public.casa_gastos WHERE slug = 'mercado-tradicional-2026'), 2026, 3, 270.00),
    -- Restaurantes+cenas
    ((SELECT id FROM public.casa_gastos WHERE slug = 'restaurantes-cenas-2026'), 2026, 1, 603.00),
    ((SELECT id FROM public.casa_gastos WHERE slug = 'restaurantes-cenas-2026'), 2026, 2, 745.00),
    ((SELECT id FROM public.casa_gastos WHERE slug = 'restaurantes-cenas-2026'), 2026, 3, 492.00),
    -- Cafés+bakeries
    ((SELECT id FROM public.casa_gastos WHERE slug = 'cafes-bakeries-2026'), 2026, 1, 182.00),
    ((SELECT id FROM public.casa_gastos WHERE slug = 'cafes-bakeries-2026'), 2026, 2, 97.00),
    ((SELECT id FROM public.casa_gastos WHERE slug = 'cafes-bakeries-2026'), 2026, 3, 86.00),
    -- Ropa y moda
    ((SELECT id FROM public.casa_gastos WHERE slug = 'ropa-moda-2026'), 2026, 1, 685.00),
    ((SELECT id FROM public.casa_gastos WHERE slug = 'ropa-moda-2026'), 2026, 2, 268.00),
    ((SELECT id FROM public.casa_gastos WHERE slug = 'ropa-moda-2026'), 2026, 3, 68.00),
    -- PayPal+Amazon compras
    ((SELECT id FROM public.casa_gastos WHERE slug = 'paypal-amazon-2026'), 2026, 1, 580.00),
    ((SELECT id FROM public.casa_gastos WHERE slug = 'paypal-amazon-2026'), 2026, 2, 497.00),
    ((SELECT id FROM public.casa_gastos WHERE slug = 'paypal-amazon-2026'), 2026, 3, 272.00),
    -- Farmacia+salud
    ((SELECT id FROM public.casa_gastos WHERE slug = 'farmacia-salud-2026'), 2026, 1, 91.00),
    ((SELECT id FROM public.casa_gastos WHERE slug = 'farmacia-salud-2026'), 2026, 2, 126.00),
    ((SELECT id FROM public.casa_gastos WHERE slug = 'farmacia-salud-2026'), 2026, 3, 24.00),
    -- Gasolina+parking
    ((SELECT id FROM public.casa_gastos WHERE slug = 'gasolina-parking-2026'), 2026, 1, 71.00),
    ((SELECT id FROM public.casa_gastos WHERE slug = 'gasolina-parking-2026'), 2026, 2, 31.00),
    ((SELECT id FROM public.casa_gastos WHERE slug = 'gasolina-parking-2026'), 2026, 3, 21.00),
    -- Hogar+Nespresso
    ((SELECT id FROM public.casa_gastos WHERE slug = 'hogar-nespresso-2026'), 2026, 1, 117.00),
    ((SELECT id FROM public.casa_gastos WHERE slug = 'hogar-nespresso-2026'), 2026, 2, 145.00),
    ((SELECT id FROM public.casa_gastos WHERE slug = 'hogar-nespresso-2026'), 2026, 3, 124.00),
    -- Lotería+libros+ocio
    ((SELECT id FROM public.casa_gastos WHERE slug = 'loteria-libros-ocio-2026'), 2026, 1, 73.00),
    ((SELECT id FROM public.casa_gastos WHERE slug = 'loteria-libros-ocio-2026'), 2026, 2, 166.00),
    ((SELECT id FROM public.casa_gastos WHERE slug = 'loteria-libros-ocio-2026'), 2026, 3, 152.00),
    -- Bizums enviados
    ((SELECT id FROM public.casa_gastos WHERE slug = 'bizums-enviados-2026'), 2026, 1, 137.00),
    ((SELECT id FROM public.casa_gastos WHERE slug = 'bizums-enviados-2026'), 2026, 2, 123.00),
    ((SELECT id FROM public.casa_gastos WHERE slug = 'bizums-enviados-2026'), 2026, 3, 152.00)
ON CONFLICT (gasto_id, ejercicio, mes) DO NOTHING;

-- ─── Gastos (4ª tanda: PayPal + Eventos) ─────────────────────

INSERT INTO public.casa_gastos (concepto, categoria_id, frecuencia, fecha_inicio, fecha_fin, importe, ejercicio, slug)
VALUES
    -- PayPal – variables
    ('Celebrate Vitamins omega3',
        (SELECT id FROM public.casa_gastos_categorias WHERE slug = 'paypal'),
        'variable', NULL, NULL, 0, 2026, 'celebrate-vitamins-omega3-2026'),

    ('Gosbi Petfood perro',
        (SELECT id FROM public.casa_gastos_categorias WHERE slug = 'paypal'),
        'variable', NULL, NULL, 0, 2026, 'gosbi-petfood-perro-2026'),

    ('Shein/Infinite Styles',
        (SELECT id FROM public.casa_gastos_categorias WHERE slug = 'paypal'),
        'variable', NULL, NULL, 0, 2026, 'shein-infinite-styles-2026'),

    ('Kervlan Lab farmacia',
        (SELECT id FROM public.casa_gastos_categorias WHERE slug = 'paypal'),
        'variable', NULL, NULL, 0, 2026, 'kervlan-lab-farmacia-2026'),

    -- PayPal – puntuales
    ('Ugreen tech',
        (SELECT id FROM public.casa_gastos_categorias WHERE slug = 'paypal'),
        'puntual', '2026-02-01', '2026-02-28', 358.00, 2026, 'ugreen-tech-2026'),

    ('Noirfonce ropa',
        (SELECT id FROM public.casa_gastos_categorias WHERE slug = 'paypal'),
        'puntual', '2026-02-01', '2026-02-28', 100.00, 2026, 'noirfonce-ropa-2026'),

    ('Cleon Peterson arte',
        (SELECT id FROM public.casa_gastos_categorias WHERE slug = 'paypal'),
        'puntual', '2026-01-01', '2026-01-31', 279.00, 2026, 'cleon-peterson-arte-2026'),

    ('DHL Express',
        (SELECT id FROM public.casa_gastos_categorias WHERE slug = 'paypal'),
        'puntual', '2026-01-01', '2026-01-31', 106.00, 2026, 'dhl-express-2026'),

    ('HHV vinyl/ropa',
        (SELECT id FROM public.casa_gastos_categorias WHERE slug = 'paypal'),
        'puntual', '2026-01-01', '2026-01-31', 97.00, 2026, 'hhv-vinyl-ropa-2026'),

    -- Eventos
    ('Reyes (enero)',
        (SELECT id FROM public.casa_gastos_categorias WHERE slug = 'evento'),
        'anual', NULL, NULL, 500.00, 2026, 'reyes-enero-2026'),

    ('Cumple Izan',
        (SELECT id FROM public.casa_gastos_categorias WHERE slug = 'evento'),
        'anual', '2026-10-01', NULL, 700.00, 2026, 'cumple-izan-2026'),

    ('Vacaciones verano',
        (SELECT id FROM public.casa_gastos_categorias WHERE slug = 'evento'),
        'anual', '2026-08-01', NULL, 2000.00, 2026, 'vacaciones-verano-2026'),

    ('Navidades',
        (SELECT id FROM public.casa_gastos_categorias WHERE slug = 'evento'),
        'anual', '2026-12-01', NULL, 1500.00, 2026, 'navidades-2026')
ON CONFLICT (slug) DO NOTHING;

-- ─── Overrides (4ª tanda) ────────────────────────────────────

INSERT INTO public.casa_gastos_overrides (gasto_id, ejercicio, mes, importe)
VALUES
    -- Celebrate Vitamins omega3: Mar = 141
    ((SELECT id FROM public.casa_gastos WHERE slug = 'celebrate-vitamins-omega3-2026'), 2026, 3, 141.00),
    -- Gosbi Petfood perro: Mar = 110
    ((SELECT id FROM public.casa_gastos WHERE slug = 'gosbi-petfood-perro-2026'), 2026, 3, 110.00),
    -- Shein/Infinite Styles: Ene = 10, Feb = 21
    ((SELECT id FROM public.casa_gastos WHERE slug = 'shein-infinite-styles-2026'), 2026, 1, 10.00),
    ((SELECT id FROM public.casa_gastos WHERE slug = 'shein-infinite-styles-2026'), 2026, 2, 21.00),
    -- Kervlan Lab farmacia: Ene = 54
    ((SELECT id FROM public.casa_gastos WHERE slug = 'kervlan-lab-farmacia-2026'), 2026, 1, 54.00)
ON CONFLICT (gasto_id, ejercicio, mes) DO NOTHING;
