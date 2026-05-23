-- Tags y características de activos: solo Casa (datos existentes se conservan en Casa)

ALTER TABLE IF EXISTS activos_tags RENAME TO casa_activos_tag_catalog;

ALTER TABLE IF EXISTS activos_caracteristicas RENAME TO casa_activos_caracteristicas;

-- Sanyus deja de usar tags y características
DROP TABLE IF EXISTS sanyus_activos_tags;
DROP TABLE IF EXISTS sanyus_activos_caracteristica_valores;

COMMENT ON TABLE casa_activos_tag_catalog IS 'Definiciones de tags para activos de Casa';
COMMENT ON TABLE casa_activos_caracteristicas IS 'Definiciones de características para activos de Casa';
