-- Activos Casa tipo Inmueble: flag en activo + plantilla de características (igual que Sanyus)

ALTER TABLE public.casa_activos_v2
  ADD COLUMN IF NOT EXISTS es_inmueble BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_casa_activos_v2_es_inmueble
  ON public.casa_activos_v2 (es_inmueble)
  WHERE es_inmueble = true;

ALTER TABLE public.casa_activos_caracteristicas
  ADD COLUMN IF NOT EXISTS plantilla_inmueble BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS casa_activos_caracteristicas_slug_key
  ON public.casa_activos_caracteristicas (slug);

-- Plantilla: campos de Propiedades Engine no cubiertos por activos base
INSERT INTO public.casa_activos_caracteristicas (nombre, slug, categoria_id, plantilla_inmueble)
VALUES
  ('Origen', 'origen', NULL, true),
  ('Dirección', 'direccion', NULL, true),
  ('Precio venta (€)', 'precio_venta', NULL, true),
  ('Superficie (m²)', 'superficie_m2', NULL, true),
  ('Año construcción', 'anio_construccion', NULL, true),
  ('Ref. Catastral', 'numero_catastro', NULL, true),
  ('Estado', 'estado', NULL, true),
  ('Ocupado', 'ocupado', NULL, true),
  ('Inicio operación', 'fecha_ingreso', NULL, true),
  ('Fecha venta', 'fecha_venta', NULL, true),
  ('Participación Carlos (%)', 'participacion_carlos', NULL, true),
  ('Participación Laura (%)', 'participacion_laura', NULL, true),
  ('Participación Izan (%)', 'participacion_izan', NULL, true)
ON CONFLICT (slug) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  plantilla_inmueble = true;

COMMENT ON COLUMN public.casa_activos_v2.es_inmueble IS 'Activo Casa marcado como inmueble (independiente de categoría)';
COMMENT ON COLUMN public.casa_activos_caracteristicas.plantilla_inmueble IS 'Campo fijo de plantilla inmueble; no eliminable desde UI';

SELECT public.bondia_reset_anon_select_rls('public.casa_activos_v2');
SELECT public.bondia_reset_anon_select_rls('public.casa_activos_caracteristicas');
