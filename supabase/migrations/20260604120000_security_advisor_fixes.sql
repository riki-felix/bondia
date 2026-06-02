-- Corrige avisos del Security Advisor sin romper Bondia:
-- - Lecturas anon (bondia_anon_select) se mantienen
-- - Mutaciones siguen vía service_role en Netlify (sin RLS)
-- - Bucket activos-fotos sigue público (URLs directas; sin políticas SELECT amplias)

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
END;
$$;

COMMENT ON FUNCTION public.bondia_reset_anon_select_rls(regclass) IS
  'Bondia: solo lectura anon. Mutaciones vía service_role (Netlify). No exponer a anon/authenticated.';

REVOKE ALL ON FUNCTION public.bondia_reset_anon_select_rls(regclass) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.bondia_reset_anon_select_rls(regclass) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bondia_reset_anon_select_rls(regclass) TO service_role;

-- Quitar políticas permisivas ALL para authenticated (no usadas por la app)
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE policyname = 'bondia_authenticated_all'
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON %I.%I',
      r.policyname, r.schemaname, r.tablename
    );
  END LOOP;
END;
$$;

-- Bucket público: acceso por URL sin políticas SELECT que permitan listado vía API
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'activos-fotos') THEN
    DROP POLICY IF EXISTS activos_fotos_public_read ON storage.objects;
    DROP POLICY IF EXISTS activos_fotos_manage ON storage.objects;
  END IF;
END;
$$;
