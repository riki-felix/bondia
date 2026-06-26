-- Objetivos configurables (solo el valor es editable en UI; tipos fijos en código)

CREATE TABLE IF NOT EXISTS public.bondia_objetivos (
  id TEXT PRIMARY KEY,
  etiqueta TEXT NOT NULL,
  valor NUMERIC(12, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.bondia_objetivos (id, etiqueta, valor)
VALUES ('beneficio_medio_operacion', 'Beneficio medio por operación', NULL)
ON CONFLICT (id) DO NOTHING;

SELECT public.bondia_reset_anon_select_rls('public.bondia_objetivos'::regclass);

COMMENT ON TABLE public.bondia_objetivos IS
  'Objetivos de negocio: etiqueta fija en app; solo valor es editable en Ajustes.';
