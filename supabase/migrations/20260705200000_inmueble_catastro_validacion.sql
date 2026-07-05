-- Plantilla inmueble: estado de validación Catastro (Casa + Sanyus)

INSERT INTO public.casa_activos_caracteristicas (nombre, slug, categoria_id, plantilla_inmueble)
VALUES
  ('Catastro referencia validada', 'catastro_referencia_validada', NULL, true),
  ('Catastro validado en', 'catastro_validado_at', NULL, true)
ON CONFLICT (slug) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  plantilla_inmueble = true;

INSERT INTO public.sanyus_activos_caracteristicas (nombre, slug, categoria_id, plantilla_inmueble)
VALUES
  ('Catastro referencia validada', 'catastro_referencia_validada', NULL, true),
  ('Catastro validado en', 'catastro_validado_at', NULL, true)
ON CONFLICT (slug) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  plantilla_inmueble = true;
