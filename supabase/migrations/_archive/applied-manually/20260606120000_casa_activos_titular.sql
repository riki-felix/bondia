-- Titular de activos Casa: Carlos, Laura, Izan o común (los tres).
ALTER TABLE public.casa_activos_v2
  ADD COLUMN IF NOT EXISTS titular TEXT NOT NULL DEFAULT 'carlos'
  CHECK (titular IN ('carlos', 'laura', 'izan', 'comun'));

UPDATE public.casa_activos_v2
SET titular = 'carlos'
WHERE titular IS NULL OR titular NOT IN ('carlos', 'laura', 'izan', 'comun');

CREATE INDEX IF NOT EXISTS idx_casa_activos_v2_titular
  ON public.casa_activos_v2(titular);

SELECT public.bondia_reset_anon_select_rls('public.casa_activos_v2');
