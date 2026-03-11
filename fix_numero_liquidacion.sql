-- Fix numero_liquidacion to be sequential (ordered by fecha_liquidacion, propiedad_id)
WITH numbered AS (
  SELECT id,
         ROW_NUMBER() OVER (ORDER BY fecha_liquidacion, propiedad_id) AS rn
  FROM liquidaciones
)
UPDATE liquidaciones
SET numero_liquidacion = numbered.rn
FROM numbered
WHERE liquidaciones.id = numbered.id;
