-- Capital invertido por ejercicio (importe incremental anual; acumulado en app).

CREATE TABLE IF NOT EXISTS public.bondia_invertido_ejercicio (
  ejercicio INTEGER PRIMARY KEY,
  importe NUMERIC(12, 2) NOT NULL CHECK (importe > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.bondia_invertido_ejercicio IS
  'Capital nuevo invertido por ejercicio fiscal; el balance acumulado se calcula en Informes.';
COMMENT ON COLUMN public.bondia_invertido_ejercicio.importe IS
  'Importe aportado en ese ejercicio (incremental, no el acumulado).';

SELECT public.bondia_reset_anon_select_rls('public.bondia_invertido_ejercicio'::regclass);
