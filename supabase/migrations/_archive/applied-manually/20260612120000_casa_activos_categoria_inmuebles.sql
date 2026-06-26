-- Categoría fija «Inmuebles» en Casa (paridad con Sanyus) + asignación a activos marcados

INSERT INTO public.casa_activos_categorias (nombre, slug, favorito)
VALUES ('Inmuebles', 'inmuebles', false)
ON CONFLICT (slug) DO NOTHING;

UPDATE public.casa_activos_v2 a
SET categoria_id = c.id
FROM public.casa_activos_categorias c
WHERE c.slug = 'inmuebles'
  AND a.es_inmueble = true
  AND a.categoria_id IS DISTINCT FROM c.id;

SELECT public.bondia_reset_anon_select_rls('public.casa_activos_categorias');
SELECT public.bondia_reset_anon_select_rls('public.casa_activos_v2');
