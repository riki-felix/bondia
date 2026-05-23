-- Plantilla inmueble: participación Carlos, Laura, Izan (%)

INSERT INTO public.sanyus_activos_caracteristicas (nombre, slug, categoria_id, plantilla_inmueble)
VALUES
  ('Participación Carlos (%)', 'participacion_carlos', NULL, true),
  ('Participación Laura (%)', 'participacion_laura', NULL, true),
  ('Participación Izan (%)', 'participacion_izan', NULL, true)
ON CONFLICT (slug) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  plantilla_inmueble = true;
