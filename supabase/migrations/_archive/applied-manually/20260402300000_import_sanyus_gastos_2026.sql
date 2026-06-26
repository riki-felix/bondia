-- Import: Sanyus gastos data – ejercicio 2026
-- Depends on: 20260402000000_create_sanyus.sql

-- ─── Categorías ──────────────────────────────────────────────

INSERT INTO public.sanyus_gastos_categorias (nombre, slug)
VALUES
    ('Gestión', 'gestion'),
    ('Seguro', 'seguro'),
    ('Luz', 'luz'),
    ('Agua', 'agua'),
    ('Internet', 'internet'),
    ('Móvil', 'movil'),
    ('Tech', 'tech'),
    ('Comunidad', 'comunidad'),
    ('IBI', 'ibi'),
    ('Financiero', 'financiero'),
    ('Otro', 'otro')
ON CONFLICT (slug) DO NOTHING;

-- ─── Gastos mensuales (todo el año) ──────────────────────────

INSERT INTO public.sanyus_gastos (concepto, categoria_id, frecuencia, fecha_inicio, fecha_fin, importe, ejercicio, slug)
VALUES
    -- Gestión
    ('Mercedes FHA gestora',
        (SELECT id FROM public.sanyus_gastos_categorias WHERE slug = 'gestion'),
        'mensual', NULL, NULL, 620.00, 2026, 'mercedes-fha-gestora-2026'),

    -- Seguro
    ('Segurcaixa pisos',
        (SELECT id FROM public.sanyus_gastos_categorias WHERE slug = 'seguro'),
        'mensual', NULL, NULL, 281.00, 2026, 'segurcaixa-pisos-2026'),

    -- Luz
    ('Endesa/Octopus pisos',
        (SELECT id FROM public.sanyus_gastos_categorias WHERE slug = 'luz'),
        'mensual', NULL, NULL, 80.00, 2026, 'endesa-octopus-pisos-2026'),

    -- Agua
    ('Culligan loft',
        (SELECT id FROM public.sanyus_gastos_categorias WHERE slug = 'agua'),
        'mensual', NULL, NULL, 43.00, 2026, 'culligan-loft-2026'),

    -- Internet
    ('Adamo loft',
        (SELECT id FROM public.sanyus_gastos_categorias WHERE slug = 'internet'),
        'mensual', NULL, NULL, 72.00, 2026, 'adamo-loft-2026'),

    -- Móvil
    ('Digi CB',
        (SELECT id FROM public.sanyus_gastos_categorias WHERE slug = 'movil'),
        'mensual', NULL, NULL, 21.00, 2026, 'digi-cb-2026'),

    -- Tech
    ('AWS',
        (SELECT id FROM public.sanyus_gastos_categorias WHERE slug = 'tech'),
        'mensual', NULL, NULL, 35.00, 2026, 'aws-2026'),

    -- Financiero
    ('V.Negocios',
        (SELECT id FROM public.sanyus_gastos_categorias WHERE slug = 'financiero'),
        'mensual', NULL, NULL, 70.00, 2026, 'v-negocios-2026')
ON CONFLICT (slug) DO NOTHING;

-- ─── Overrides (mensuales todo el año) ───────────────────────

INSERT INTO public.sanyus_gastos_overrides (gasto_id, ejercicio, mes, importe)
VALUES
    -- Mercedes FHA gestora: Ene = 622, Feb = 621, Mar = 0 (sin cargo)
    ((SELECT id FROM public.sanyus_gastos WHERE slug = 'mercedes-fha-gestora-2026'), 2026, 1, 622.00),
    ((SELECT id FROM public.sanyus_gastos WHERE slug = 'mercedes-fha-gestora-2026'), 2026, 2, 621.00),
    ((SELECT id FROM public.sanyus_gastos WHERE slug = 'mercedes-fha-gestora-2026'), 2026, 3, 0.00),
    -- Endesa/Octopus pisos: Ene = 90, Feb = 165, Mar = 60
    ((SELECT id FROM public.sanyus_gastos WHERE slug = 'endesa-octopus-pisos-2026'), 2026, 1, 90.00),
    ((SELECT id FROM public.sanyus_gastos WHERE slug = 'endesa-octopus-pisos-2026'), 2026, 2, 165.00),
    ((SELECT id FROM public.sanyus_gastos WHERE slug = 'endesa-octopus-pisos-2026'), 2026, 3, 60.00),
    -- Culligan loft: Feb = 46
    ((SELECT id FROM public.sanyus_gastos WHERE slug = 'culligan-loft-2026'), 2026, 2, 46.00),
    -- Adamo loft: Ene = 79, Feb = 74
    ((SELECT id FROM public.sanyus_gastos WHERE slug = 'adamo-loft-2026'), 2026, 1, 79.00),
    ((SELECT id FROM public.sanyus_gastos WHERE slug = 'adamo-loft-2026'), 2026, 2, 74.00),
    -- AWS: Mar = 32
    ((SELECT id FROM public.sanyus_gastos WHERE slug = 'aws-2026'), 2026, 3, 32.00),
    -- V.Negocios: Ene = 195, Mar = 1653
    ((SELECT id FROM public.sanyus_gastos WHERE slug = 'v-negocios-2026'), 2026, 1, 195.00),
    ((SELECT id FROM public.sanyus_gastos WHERE slug = 'v-negocios-2026'), 2026, 3, 1653.00)
ON CONFLICT (gasto_id, ejercicio, mes) DO NOTHING;

-- ─── Gastos mensuales (año parcial) ──────────────────────────

INSERT INTO public.sanyus_gastos (concepto, categoria_id, frecuencia, fecha_inicio, fecha_fin, importe, ejercicio, slug)
VALUES
    -- Mercedes 15% Airbnb: desde marzo
    ('Mercedes 15% Airbnb',
        (SELECT id FROM public.sanyus_gastos_categorias WHERE slug = 'gestion'),
        'mensual', '2026-03-01', NULL, 375.00, 2026, 'mercedes-15-airbnb-2026'),

    -- Comunidad Mare de Déu del Port: desde marzo
    ('Comunidad Mare de Déu del Port',
        (SELECT id FROM public.sanyus_gastos_categorias WHERE slug = 'comunidad'),
        'mensual', '2026-03-01', NULL, 55.00, 2026, 'comunidad-mare-deu-port-2026'),

    -- Comunidad Sort 31: desde marzo
    ('Comunidad Sort 31',
        (SELECT id FROM public.sanyus_gastos_categorias WHERE slug = 'comunidad'),
        'mensual', '2026-03-01', NULL, 30.00, 2026, 'comunidad-sort-31-2026'),

    -- Comunidad Ronda Torrassa: desde febrero
    ('Comunidad Ronda Torrassa',
        (SELECT id FROM public.sanyus_gastos_categorias WHERE slug = 'comunidad'),
        'mensual', '2026-02-01', NULL, 35.00, 2026, 'comunidad-ronda-torrassa-2026'),

    -- Comunidad Llobregat: desde febrero, base 50 (alternancia par/impar)
    ('Comunidad Llobregat',
        (SELECT id FROM public.sanyus_gastos_categorias WHERE slug = 'comunidad'),
        'mensual', '2026-02-01', NULL, 50.00, 2026, 'comunidad-llobregat-2026')
ON CONFLICT (slug) DO NOTHING;

-- ─── Overrides (año parcial) ─────────────────────────────────

INSERT INTO public.sanyus_gastos_overrides (gasto_id, ejercicio, mes, importe)
VALUES
    -- Mercedes 15% Airbnb: Mar = 355 (base 375)
    ((SELECT id FROM public.sanyus_gastos WHERE slug = 'mercedes-15-airbnb-2026'), 2026, 3, 355.00),
    -- Llobregat comunidad: meses impares = 46 (base 50)
    ((SELECT id FROM public.sanyus_gastos WHERE slug = 'comunidad-llobregat-2026'), 2026, 3, 46.00),
    ((SELECT id FROM public.sanyus_gastos WHERE slug = 'comunidad-llobregat-2026'), 2026, 5, 46.00),
    ((SELECT id FROM public.sanyus_gastos WHERE slug = 'comunidad-llobregat-2026'), 2026, 7, 46.00),
    ((SELECT id FROM public.sanyus_gastos WHERE slug = 'comunidad-llobregat-2026'), 2026, 9, 46.00),
    ((SELECT id FROM public.sanyus_gastos WHERE slug = 'comunidad-llobregat-2026'), 2026, 11, 46.00)
ON CONFLICT (gasto_id, ejercicio, mes) DO NOTHING;

-- ─── Gastos periódicos (no mensuales) ────────────────────────

INSERT INTO public.sanyus_gastos (concepto, categoria_id, frecuencia, fecha_inicio, fecha_fin, importe, ejercicio, slug)
VALUES
    -- FIATC pisos: semestral desde abril (Abr, Oct)
    ('FIATC pisos',
        (SELECT id FROM public.sanyus_gastos_categorias WHERE slug = 'seguro'),
        'semestral', '2026-04-01', NULL, 267.00, 2026, 'fiatc-pisos-2026'),

    -- IBI Zona Franca: trimestral desde marzo (Mar, Jun, Sep, Dic)
    ('IBI Zona Franca',
        (SELECT id FROM public.sanyus_gastos_categorias WHERE slug = 'ibi'),
        'trimestral', '2026-03-01', NULL, 70.00, 2026, 'ibi-zona-franca-2026'),

    -- IBI Llobregat: trimestral desde marzo
    ('IBI Llobregat',
        (SELECT id FROM public.sanyus_gastos_categorias WHERE slug = 'ibi'),
        'trimestral', '2026-03-01', NULL, 34.00, 2026, 'ibi-llobregat-2026'),

    -- IBI Sort: trimestral desde marzo
    ('IBI Sort',
        (SELECT id FROM public.sanyus_gastos_categorias WHERE slug = 'ibi'),
        'trimestral', '2026-03-01', NULL, 60.00, 2026, 'ibi-sort-2026')
ON CONFLICT (slug) DO NOTHING;

-- ─── Gastos variables ────────────────────────────────────────

INSERT INTO public.sanyus_gastos (concepto, categoria_id, frecuencia, importe, ejercicio, slug)
VALUES
    -- Aigues BCN pisos: bimensual irregular, modelado como variable
    ('Aigues BCN pisos',
        (SELECT id FROM public.sanyus_gastos_categorias WHERE slug = 'agua'),
        'variable', 0, 2026, 'aigues-bcn-pisos-2026'),

    -- Smartconta: cobros puntuales en el año
    ('Smartconta',
        (SELECT id FROM public.sanyus_gastos_categorias WHERE slug = 'agua'),
        'variable', 0, 2026, 'smartconta-2026'),

    -- Llobregat derramas: bimensual Abr-Ago
    ('Llobregat derramas',
        (SELECT id FROM public.sanyus_gastos_categorias WHERE slug = 'comunidad'),
        'variable', 0, 2026, 'llobregat-derramas-2026'),

    -- Admin depósito: ~trimestral
    ('Admin depósito',
        (SELECT id FROM public.sanyus_gastos_categorias WHERE slug = 'otro'),
        'variable', 0, 2026, 'admin-deposito-2026')
ON CONFLICT (slug) DO NOTHING;

-- ─── Overrides (variables) ───────────────────────────────────

INSERT INTO public.sanyus_gastos_overrides (gasto_id, ejercicio, mes, importe)
VALUES
    -- Aigues BCN pisos
    ((SELECT id FROM public.sanyus_gastos WHERE slug = 'aigues-bcn-pisos-2026'), 2026, 1, 56.00),
    ((SELECT id FROM public.sanyus_gastos WHERE slug = 'aigues-bcn-pisos-2026'), 2026, 2, 84.00),
    ((SELECT id FROM public.sanyus_gastos WHERE slug = 'aigues-bcn-pisos-2026'), 2026, 3, 59.00),
    ((SELECT id FROM public.sanyus_gastos WHERE slug = 'aigues-bcn-pisos-2026'), 2026, 5, 75.00),
    ((SELECT id FROM public.sanyus_gastos WHERE slug = 'aigues-bcn-pisos-2026'), 2026, 7, 75.00),
    ((SELECT id FROM public.sanyus_gastos WHERE slug = 'aigues-bcn-pisos-2026'), 2026, 9, 75.00),
    ((SELECT id FROM public.sanyus_gastos WHERE slug = 'aigues-bcn-pisos-2026'), 2026, 11, 75.00),
    -- Smartconta
    ((SELECT id FROM public.sanyus_gastos WHERE slug = 'smartconta-2026'), 2026, 1, 22.00),
    ((SELECT id FROM public.sanyus_gastos WHERE slug = 'smartconta-2026'), 2026, 2, 44.00),
    ((SELECT id FROM public.sanyus_gastos WHERE slug = 'smartconta-2026'), 2026, 12, 43.00),
    -- Llobregat derramas: Abr, Jun, Ago
    ((SELECT id FROM public.sanyus_gastos WHERE slug = 'llobregat-derramas-2026'), 2026, 4, 46.00),
    ((SELECT id FROM public.sanyus_gastos WHERE slug = 'llobregat-derramas-2026'), 2026, 6, 46.00),
    ((SELECT id FROM public.sanyus_gastos WHERE slug = 'llobregat-derramas-2026'), 2026, 8, 46.00),
    -- Admin depósito: Ene, Jul, Oct
    ((SELECT id FROM public.sanyus_gastos WHERE slug = 'admin-deposito-2026'), 2026, 1, 14.00),
    ((SELECT id FROM public.sanyus_gastos WHERE slug = 'admin-deposito-2026'), 2026, 7, 14.00),
    ((SELECT id FROM public.sanyus_gastos WHERE slug = 'admin-deposito-2026'), 2026, 10, 14.00)
ON CONFLICT (gasto_id, ejercicio, mes) DO NOTHING;
