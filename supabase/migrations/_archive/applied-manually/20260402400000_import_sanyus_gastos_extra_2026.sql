-- Import: Sanyus gastos adicionales – ejercicio 2026
-- Depends on: 20260402300000_import_sanyus_gastos_2026.sql

-- ─── Categorías nuevas ───────────────────────────────────────

INSERT INTO public.sanyus_gastos_categorias (nombre, slug)
VALUES
    ('Mantenimiento', 'mantenimiento'),
    ('Tecnología', 'tecnologia'),
    ('Gestoría', 'gestoria'),
    ('Limpieza', 'limpieza'),
    ('Aprendizaje', 'aprendizaje'),
    ('Compra Activos', 'compra-activos')
ON CONFLICT (slug) DO NOTHING;

-- ─── Gastos puntuales (variable con overrides) ───────────────

INSERT INTO public.sanyus_gastos (concepto, categoria_id, frecuencia, importe, ejercicio, slug)
VALUES
    -- Mantenimiento
    ('IMPEGA puertas Sort+Torrassa',
        (SELECT id FROM public.sanyus_gastos_categorias WHERE slug = 'mantenimiento'),
        'variable', 0, 2026, 'impega-puertas-sort-torrassa-2026'),

    ('Altas luz 2 pisos',
        (SELECT id FROM public.sanyus_gastos_categorias WHERE slug = 'mantenimiento'),
        'variable', 0, 2026, 'altas-luz-2-pisos-2026'),

    -- Tecnología
    ('NAS+disco Maxon/Amazon',
        (SELECT id FROM public.sanyus_gastos_categorias WHERE slug = 'tecnologia'),
        'variable', 0, 2026, 'nas-disco-maxon-amazon-2026'),

    ('Web Bon Dia Ricardo',
        (SELECT id FROM public.sanyus_gastos_categorias WHERE slug = 'tecnologia'),
        'variable', 0, 2026, 'web-bon-dia-ricardo-2026'),

    -- Gestoría
    ('Borrell contratos',
        (SELECT id FROM public.sanyus_gastos_categorias WHERE slug = 'gestoria'),
        'variable', 0, 2026, 'borrell-contratos-2026'),

    -- Limpieza
    ('Limpieza Airbnb extra',
        (SELECT id FROM public.sanyus_gastos_categorias WHERE slug = 'limpieza'),
        'variable', 0, 2026, 'limpieza-airbnb-extra-2026'),

    -- Compra Activos (inversiones)
    ('Compra piso nuevo 1 (+gastos)',
        (SELECT id FROM public.sanyus_gastos_categorias WHERE slug = 'compra-activos'),
        'variable', 0, 2026, 'compra-piso-nuevo-1-2026'),

    ('Compra piso nuevo 2 (+gastos)',
        (SELECT id FROM public.sanyus_gastos_categorias WHERE slug = 'compra-activos'),
        'variable', 0, 2026, 'compra-piso-nuevo-2-2026')
ON CONFLICT (slug) DO NOTHING;

-- ─── Gasto mensual ──────────────────────────────────────────

INSERT INTO public.sanyus_gastos (concepto, categoria_id, frecuencia, fecha_inicio, fecha_fin, importe, ejercicio, slug)
VALUES
    -- Aprendizaje: Tutorías desde abril
    ('Tutorías',
        (SELECT id FROM public.sanyus_gastos_categorias WHERE slug = 'aprendizaje'),
        'mensual', '2026-04-01', NULL, 100.00, 2026, 'tutorias-2026')
ON CONFLICT (slug) DO NOTHING;

-- ─── Overrides ───────────────────────────────────────────────

INSERT INTO public.sanyus_gastos_overrides (gasto_id, ejercicio, mes, importe)
VALUES
    -- IMPEGA puertas Sort+Torrassa: Mar = 1227, Abr = 163
    ((SELECT id FROM public.sanyus_gastos WHERE slug = 'impega-puertas-sort-torrassa-2026'), 2026, 3, 1227.00),
    ((SELECT id FROM public.sanyus_gastos WHERE slug = 'impega-puertas-sort-torrassa-2026'), 2026, 4, 163.00),
    -- Altas luz 2 pisos: May = 600
    ((SELECT id FROM public.sanyus_gastos WHERE slug = 'altas-luz-2-pisos-2026'), 2026, 5, 600.00),
    -- NAS+disco Maxon/Amazon: May = 400
    ((SELECT id FROM public.sanyus_gastos WHERE slug = 'nas-disco-maxon-amazon-2026'), 2026, 5, 400.00),
    -- Web Bon Dia Ricardo: Mar = 1210
    ((SELECT id FROM public.sanyus_gastos WHERE slug = 'web-bon-dia-ricardo-2026'), 2026, 3, 1210.00),
    -- Borrell contratos: Feb = 314, Mar = 103
    ((SELECT id FROM public.sanyus_gastos WHERE slug = 'borrell-contratos-2026'), 2026, 2, 314.00),
    ((SELECT id FROM public.sanyus_gastos WHERE slug = 'borrell-contratos-2026'), 2026, 3, 103.00),
    -- Limpieza Airbnb extra: Abr = 100
    ((SELECT id FROM public.sanyus_gastos WHERE slug = 'limpieza-airbnb-extra-2026'), 2026, 4, 100.00),
    -- Compra piso nuevo 1 (+gastos): Sep = 100.000
    ((SELECT id FROM public.sanyus_gastos WHERE slug = 'compra-piso-nuevo-1-2026'), 2026, 9, 100000.00),
    -- Compra piso nuevo 2 (+gastos): Oct = 100.000
    ((SELECT id FROM public.sanyus_gastos WHERE slug = 'compra-piso-nuevo-2-2026'), 2026, 10, 100000.00)
ON CONFLICT (gasto_id, ejercicio, mes) DO NOTHING;
