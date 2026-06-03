-- Ficha de configuración Modelo 184 (Sanyus CB — comunidad de bienes)

CREATE TABLE IF NOT EXISTS public.sanyus_modelo184_config (
  id TEXT PRIMARY KEY DEFAULT 'default' CHECK (id = 'default'),
  tipo_entidad TEXT NOT NULL DEFAULT 'comunidad_bienes',
  nif TEXT NOT NULL DEFAULT '',
  denominacion TEXT NOT NULL DEFAULT 'Sanyus CB',
  domicilio TEXT NOT NULL DEFAULT '',
  municipio TEXT NOT NULL DEFAULT '',
  provincia TEXT NOT NULL DEFAULT '',
  codigo_postal TEXT NOT NULL DEFAULT '',
  carlos_nif TEXT NOT NULL DEFAULT '',
  laura_nif TEXT NOT NULL DEFAULT '',
  izan_nif TEXT NOT NULL DEFAULT '',
  notas TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.sanyus_modelo184_config (id, denominacion, tipo_entidad)
VALUES ('default', 'Sanyus CB', 'comunidad_bienes')
ON CONFLICT (id) DO NOTHING;

SELECT public.bondia_reset_anon_select_rls('public.sanyus_modelo184_config'::regclass);

COMMENT ON TABLE public.sanyus_modelo184_config IS
  'Datos identificativos entidad y partícipes para Modelo 184 AEAT (fila única default).';
