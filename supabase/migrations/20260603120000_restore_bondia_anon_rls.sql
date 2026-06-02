-- Restaura lecturas con rol anon tras cambios del Security Advisor de Supabase.
-- Bondia usa PUBLIC_SUPABASE_ANON_KEY en páginas .astro (sin sesión).
-- Las mutaciones siguen en Netlify Functions (service_role, sin RLS).

CREATE OR REPLACE FUNCTION public.bondia_reset_anon_select_rls(target_table regclass)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pol record;
  tbl text := target_table::text;
  dot int := position('.' in tbl);
  sch text;
  tname text;
BEGIN
  IF dot > 0 THEN
    sch := split_part(tbl, '.', 1);
    tname := split_part(tbl, '.', 2);
  ELSE
    sch := 'public';
    tname := tbl;
  END IF;

  EXECUTE format('ALTER TABLE %s ENABLE ROW LEVEL SECURITY', target_table);

  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = sch AND tablename = tname
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %s', pol.policyname, target_table);
  END LOOP;

  EXECUTE format(
    'CREATE POLICY bondia_anon_select ON %s FOR SELECT TO anon USING (true)',
    target_table
  );

  EXECUTE format(
    'CREATE POLICY bondia_authenticated_all ON %s FOR ALL TO authenticated USING (true) WITH CHECK (true)',
    target_table
  );
END;
$$;

COMMENT ON FUNCTION public.bondia_reset_anon_select_rls(regclass) IS
  'Bondia: políticas RLS para lectura anon + CRUD authenticated (mutaciones vía service role).';

-- Tablas usadas por Bondia (Casa, Sanyus, Engine, cartera, ajustes, documentos)
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'propiedades',
    'liquidaciones',
    'metodos_pago',
    'feature_tasks',
    'documentos',
    'cartera_movimientos',
    'cartera_ajustes',
    'casa_gastos_categorias',
    'casa_ingresos_categorias',
    'casa_activos_categorias',
    'casa_gastos',
    'casa_ingresos',
    'casa_activos_v2',
    'casa_gastos_overrides',
    'casa_ingresos_overrides',
    'casa_areas',
    'casa_areas_categorias',
    'casa_activos_tag_catalog',
    'casa_activos_tags',
    'casa_activos_caracteristicas',
    'casa_activos_caracteristica_valores',
    'sanyus_gastos_categorias',
    'sanyus_ingresos_categorias',
    'sanyus_activos_categorias',
    'sanyus_gastos',
    'sanyus_ingresos',
    'sanyus_activos_v2',
    'sanyus_gastos_overrides',
    'sanyus_ingresos_overrides',
    'sanyus_areas',
    'sanyus_areas_categorias',
    'sanyus_activos_tag_catalog',
    'sanyus_activos_tags',
    'sanyus_activos_caracteristicas',
    'sanyus_activos_caracteristica_valores'
  ];
BEGIN
  FOREACH t IN ARRAY tables
  LOOP
    IF EXISTS (
      SELECT 1
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relname = t AND c.relkind = 'r'
    ) THEN
      PERFORM public.bondia_reset_anon_select_rls(format('public.%I', t)::regclass);
    END IF;
  END LOOP;
END;
$$;

-- Storage: fotos de activos (bucket público; lectura anon)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'activos-fotos') THEN
    DROP POLICY IF EXISTS activos_fotos_public_read ON storage.objects;
    DROP POLICY IF EXISTS activos_fotos_manage ON storage.objects;
    CREATE POLICY activos_fotos_public_read ON storage.objects
      FOR SELECT TO anon, authenticated
      USING (bucket_id = 'activos-fotos');
    CREATE POLICY activos_fotos_manage ON storage.objects
      FOR ALL TO authenticated
      USING (bucket_id = 'activos-fotos')
      WITH CHECK (bucket_id = 'activos-fotos');
  END IF;
END;
$$;
