CREATE TABLE IF NOT EXISTS public.bondia_mercado_referencia (
  slug TEXT PRIMARY KEY,
  fuente TEXT NOT NULL CHECK (fuente IN ('mitma', 'idealista')),
  territorio_key TEXT NOT NULL,
  etiqueta TEXT NOT NULL,
  euro_m2 NUMERIC NOT NULL,
  periodo TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.bondia_mercado_referencia (slug, fuente, territorio_key, etiqueta, euro_m2, periodo)
VALUES
  ('mitma:espana', 'mitma', 'ESPANA', 'España', 3685.6, '2025'),
  ('mitma:BARCELONA', 'mitma', 'BARCELONA', 'Barcelona (prov.)', 3207.7, '2026-T1'),
  ('mitma:MADRID', 'mitma', 'MADRID', 'Madrid (CA)', 4047.5, '2026-T1'),
  ('idealista:BARCELONA', 'idealista', 'BARCELONA', 'Barcelona (prov.)', 2900, 'caché'),
  ('idealista:MADRID', 'idealista', 'MADRID', 'Madrid (CA)', 3208, 'caché')
ON CONFLICT (slug) DO NOTHING;

SELECT public.bondia_reset_anon_select_rls('public.bondia_mercado_referencia'::regclass);

COMMENT ON TABLE public.bondia_mercado_referencia IS
  'Referencias €/m² de mercado (MITMA valor tasado, Idealista oferta) para Informes';
