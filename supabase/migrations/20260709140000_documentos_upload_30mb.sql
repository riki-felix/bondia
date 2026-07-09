-- Límite de 30 MB por archivo en el bucket de documentos privados
UPDATE storage.buckets
SET file_size_limit = 31457280
WHERE id = 'bondia-documentos';
