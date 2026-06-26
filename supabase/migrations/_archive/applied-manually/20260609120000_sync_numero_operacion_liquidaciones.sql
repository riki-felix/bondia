-- ANULADA: esta migración sobrescribía liquidaciones.numero_operacion (Nº OP manual)
-- con propiedades.numero_operacion (ID de inversión). No ejecutar.
--
-- Si ya se aplicó en producción, recuperar vía backup/PITR de Supabase o reintroducir a mano.
-- Ver docs: https://supabase.com/docs/guides/platform/backups

SELECT 1;
