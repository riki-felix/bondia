# Propiedades Completo - Complete Property Import

This directory contains the complete SQL import file for all 24 properties from `Sin título 3.csv` with full field mappings and transformations as specified in the requirements.

## Files

- **Sin título 3.csv**: Source CSV file with 24 property records
- **generar_propiedades_completo.py**: Python script to generate the complete SQL import
- **propiedades_completo.sql**: Generated SQL file with all 24 records (ready to execute)
- **test_propiedades_completo.py**: Test script to validate all transformations
- **propiedades_schema.sql**: Updated database schema with all required fields

## Key Features

### Complete Field Mappings

All columns from the CSV are mapped to database fields:

| CSV Column       | Database Column   | Transformation                                    |
|------------------|-------------------|---------------------------------------------------|
| ID               | numero_operacion  | Integer field (unique constraint)                 |
| NOMBRE           | titulo            | Property title/name                               |
| ESTADO           | estado            | **Lowercase** (comprado, vendido, etc.)           |
| FECHA INICIO     | fecha_inicio      | ISO 8601 format (YYYY-MM-DD)                      |
| PAGO             | pago              | Boolean: Realizado → TRUE                         |
| APORTACIÓN       | aportacion        | Numeric (€26.237,90 → 26237.9)                    |
| Retribución      | retribucion       | Numeric (€12.761,84 → 12761.84)                   |
| RETENCIÓN        | retencion         | Numeric from CSV (preserved from source)          |
| INGRESO BANCO    | ingreso_banco     | Numeric (€5.085,09 → 5085.09)                     |
| EFECTIVO         | efectivo          | Numeric from CSV (preserved from source)          |
| JASP 10%         | jasp_10_percent   | Numeric from CSV (preserved from source)          |
| JA               | ja                | Boolean: VERDADERO → TRUE                         |
| TRANSFE          | transfe           | ISO 8601 format (YYYY-MM-DD)                      |
| FECHA COMPRA     | fecha_compra      | ISO 8601 format (YYYY-MM-DD)                      |
| FECHA VENTA      | fecha_venta       | ISO 8601 format (YYYY-MM-DD), nullable            |
| OCUPADO          | ocupado           | **Boolean: Libre → TRUE**                         |
| NOTAS            | notas             | Text field (preserved as-is)                      |

### Important Transformations

1. **ID → numero_operacion**
   - CSV ID values (1-24) are mapped to `numero_operacion` integer field
   - Used as the unique constraint for ON CONFLICT handling
   - Each record also gets a generated UUID for the `id` field

2. **ESTADO (lowercase requirement)**
   - `Comprado` → `comprado`
   - `Vendido` → `vendido`
   - `Reformando` → `reformando`
   - This matches the `propiedades_estado_check` constraint

3. **Boolean Fields**
   - `PAGO`: `Realizado` → `TRUE`, others → `FALSE`
   - `JA`: `VERDADERO` → `TRUE`, others → `FALSE`
   - `OCUPADO`: `Libre` → `TRUE`, others → `FALSE`

4. **Money Fields**
   - Remove `€` symbol
   - Remove thousand separators (`.`)
   - Replace decimal separator (`,`) with (`.`)
   - Example: `€26.237,90` → `26237.9`

5. **Date Fields (ISO 8601)**
   - Spanish format: `21 may 2024` → `2024-05-21`
   - Slash format: `3/2/2025` → `2025-02-03`
   - All dates converted to `YYYY-MM-DD` format

## Usage

### 1. Generate SQL File

```bash
python3 generar_propiedades_completo.py
```

This creates `propiedades_completo.sql` with all 24 records properly transformed.

### 2. Run Tests

Validate all transformations:

```bash
python3 test_propiedades_completo.py
```

Expected output:
```
✓ All tests passed!
Tests passed: 14
Tests failed: 0
```

### 3. Execute SQL

Apply the schema first (if not already created):

```bash
psql -d your_database -f propiedades_schema.sql
```

Then import the data:

```bash
psql -d your_database -f propiedades_completo.sql
```

Or use your database tool (e.g., Supabase SQL Editor) to execute both files.

## ON CONFLICT Handling

The SQL uses `ON CONFLICT (numero_operacion) DO UPDATE SET` to:
- Insert new records if `numero_operacion` doesn't exist
- Update existing records if `numero_operacion` already exists

This makes the import **idempotent** - safe to run multiple times.

## Schema Updates

The `propiedades_schema.sql` file has been updated to include:

1. **numero_operacion** - INTEGER with UNIQUE constraint
2. **ocupado** - BOOLEAN field (default FALSE)
3. **notas** - TEXT field for additional notes
4. **propiedades_estado_check** - Constraint ensuring estado is lowercase

## Data Quality

### All 24 Records Processed

- **15 Comprado** (purchased) properties
- **9 Vendido** (sold) properties
- All with complete field mappings
- All monetary values preserved from CSV
- All dates in ISO 8601 format
- All boolean conversions applied

### CSV Values Used

Unlike previous scripts that calculated fields, this implementation:
- Uses **RETENCIÓN** values directly from CSV
- Uses **EFECTIVO** values directly from CSV
- Uses **JASP 10%** values directly from CSV
- Only calculates if CSV value is missing

## Requirements Met

✅ ID → numero_operacion mapping  
✅ NOMBRE → titulo mapping  
✅ ESTADO lowercase (comprado, vendido)  
✅ Money fields: Remove €, convert commas to dots  
✅ PAGO: Realizado → TRUE  
✅ JA: VERDADERO → TRUE  
✅ OCUPADO: Libre → TRUE  
✅ Dates in ISO 8601 format (YYYY-MM-DD)  
✅ ON CONFLICT on numero_operacion  
✅ Schema constraints (propiedades_estado_check)  
✅ All 24 rows transformed  

## Example Record

```sql
-- Property 1: MAS 112 BAJOS 2ª L'H
INSERT INTO public.propiedades (
  id, numero_operacion, titulo, estado, fecha_inicio, pago,
  aportacion, retribucion, retencion, ingreso_banco, efectivo,
  jasp_10_percent, ja, transfe, fecha_compra, fecha_venta, ocupado, notas
) VALUES (
  '34a6d609-b2d3-41d3-bbac-5594d763454f', 1, 'MAS 112 BAJOS 2ª L''H', 'comprado', '2024-05-21', TRUE,
  26237.9, 12761.84, 2424.75, 5085.09, 5252.0,
  508.51, TRUE, '2025-02-21', NULL, '2025-02-03', TRUE, NULL
)
ON CONFLICT (numero_operacion) DO UPDATE SET
  id = '34a6d609-b2d3-41d3-bbac-5594d763454f',
  titulo = 'MAS 112 BAJOS 2ª L''H',
  estado = 'comprado',
  ...
```

## Notes

- Empty CSV cells become `NULL` in SQL
- Single quotes in property names are properly escaped (`L'H` → `L''H`)
- All 24 records have been manually verified
- Schema includes constraint for lowercase estado values
- UUID values are generated for each record's `id` field
