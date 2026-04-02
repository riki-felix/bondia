-- Import: Sanyus ingresos data – ejercicio 2026
-- Depends on: 20260402000000_create_sanyus.sql

-- ─── Categoría ───────────────────────────────────────────────

INSERT INTO public.sanyus_ingresos_categorias (nombre, slug)
VALUES ('Alquiler', 'alquiler')
ON CONFLICT (slug) DO NOTHING;

-- ─── Ingresos ────────────────────────────────────────────────

INSERT INTO public.sanyus_ingresos (concepto, categoria_id, frecuencia, fecha_inicio, fecha_fin, importe, ejercicio, slug)
VALUES
    -- Airbnb: mensual todo el año, base 2500 (variaciones Ene-Mar como overrides)
    ('Airbnb (Mare de Déu del Port)',
        (SELECT id FROM public.sanyus_ingresos_categorias WHERE slug = 'alquiler'),
        'mensual', NULL, NULL, 2500.00, 2026, 'airbnb-mare-deu-port-2026'),

    -- Miriam: mensual todo el año excepto marzo (override mes 3 = 0)
    ('Miriam (Sort 31)',
        (SELECT id FROM public.sanyus_ingresos_categorias WHERE slug = 'alquiler'),
        'mensual', NULL, NULL, 775.00, 2026, 'miriam-sort-31-2026'),

    -- Ronda Torrassa: mensual desde marzo
    ('Ronda Torrassa 22',
        (SELECT id FROM public.sanyus_ingresos_categorias WHERE slug = 'alquiler'),
        'mensual', '2026-03-01', NULL, 850.00, 2026, 'ronda-torrassa-22-2026'),

    -- Llobregat: mensual desde julio
    ('Llobregat',
        (SELECT id FROM public.sanyus_ingresos_categorias WHERE slug = 'alquiler'),
        'mensual', '2026-07-01', NULL, 800.00, 2026, 'llobregat-2026'),

    -- Piso nuevo 1: mensual desde octubre
    ('Piso nuevo 1',
        (SELECT id FROM public.sanyus_ingresos_categorias WHERE slug = 'alquiler'),
        'mensual', '2026-10-01', NULL, 800.00, 2026, 'piso-nuevo-1-2026'),

    -- Piso nuevo 2: mensual desde octubre
    ('Piso nuevo 2',
        (SELECT id FROM public.sanyus_ingresos_categorias WHERE slug = 'alquiler'),
        'mensual', '2026-10-01', NULL, 800.00, 2026, 'piso-nuevo-2-2026')
ON CONFLICT (slug) DO NOTHING;

-- ─── Overrides (meses con importe distinto a la base) ────────

INSERT INTO public.sanyus_ingresos_overrides (ingreso_id, ejercicio, mes, importe)
VALUES
    -- Airbnb: Ene = 2600 (base 2500)
    ((SELECT id FROM public.sanyus_ingresos WHERE slug = 'airbnb-mare-deu-port-2026'), 2026, 1, 2600.00),
    -- Airbnb: Feb = 2519 (base 2500)
    ((SELECT id FROM public.sanyus_ingresos WHERE slug = 'airbnb-mare-deu-port-2026'), 2026, 2, 2519.00),
    -- Airbnb: Mar = 336 (base 2500)
    ((SELECT id FROM public.sanyus_ingresos WHERE slug = 'airbnb-mare-deu-port-2026'), 2026, 3, 336.00),
    -- Miriam: Mar = 0 (sin ingreso en marzo)
    ((SELECT id FROM public.sanyus_ingresos WHERE slug = 'miriam-sort-31-2026'), 2026, 3, 0.00)
ON CONFLICT (ingreso_id, ejercicio, mes) DO NOTHING;
