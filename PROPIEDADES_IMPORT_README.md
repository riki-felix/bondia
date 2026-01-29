# Propiedades Import Guide

This directory contains files for importing property data from "Sin título 3.csv" into the `propiedades` table.

## Files

- **Sin título 3.csv**: CSV file with property data
- **generar_propiedades_import.py**: Python script to generate SQL import statements from CSV
- **propiedades_import.sql**: Generated SQL file ready to execute
- **test_propiedades_import.py**: Test script to validate transformations
- **propiedades_schema.sql**: Database schema definition

## CSV Column Mappings

The script maps CSV columns to database columns as follows:

| CSV Column       | Database Column  | Transformation                                    |
|------------------|------------------|---------------------------------------------------|
| ID               | id               | Direct mapping (UUID)                             |
| NOMBRE           | titulo           | Property title/name                               |
| ESTADO           | estado           | Status (e.g., Comprado, Vendido, Reformando)      |
| FECHA INICIO     | fecha_inicio     | Start date (ISO format)                           |
| PAGO             | pago             | Boolean (Realizado → TRUE, empty → FALSE)         |
| APORTACIÓN       | aportacion       | Numeric (€25.000,00 → 25000.0)                    |
| Retribución      | retribucion      | Numeric (€35.000,00 → 35000.0)                    |
| INGRESO BANCO    | ingreso_banco    | Numeric (€28.000,00 → 28000.0)                    |
| JA               | ja               | Boolean (VERDADERO → TRUE, empty → FALSE)         |
| TRANSFE          | transfe          | Transfer date (ISO format)                        |
| FECHA COMPRA     | fecha_compra     | Purchase date (ISO format)                        |
| FECHA VENTA      | fecha_venta      | Sale date (ISO format, nullable)                  |

## Calculated Columns

The script automatically calculates these fields:

- **retencion**: 19% of Retribución (tax retention)
- **efectivo**: Retribución - Retención - Ingreso Banco (cash amount)
- **jasp_10_percent**: 10% of Ingreso Banco

## Data Transformations

The script performs these transformations:

1. **Numeric values**: Converts European format (€25.000,00) to SQL decimal (25000.0)
   - Removes € symbol
   - Removes thousand separator (.)
   - Replaces decimal separator (,) with (.)

2. **Boolean values**:
   - PAGO field: Realizado → TRUE, empty/other → FALSE
   - JA field: VERDADERO → TRUE, empty/other → FALSE

3. **Dates**: Converts to ISO format (YYYY-MM-DD)

## Usage

### 1. Prepare your CSV file

The CSV file "Sin título 3.csv" should be in the repository root. The file should have the following columns:

```csv
ID,NOMBRE,ESTADO,FECHA INICIO,PAGO,APORTACIÓN,Retribución,INGRESO BANCO,JA,TRANSFE,FECHA COMPRA,FECHA VENTA
```

### 2. Generate SQL

Run the Python script:

```bash
python3 generar_propiedades_import.py
```

This will generate `propiedades_import.sql` with INSERT statements for all properties.

### 3. Run Tests

Validate the transformations:

```bash
python3 test_propiedades_import.py
```

This will verify:
- Money value transformations
- Boolean transformations (PAGO and JA fields)
- Calculated fields (retencion, efectivo, jasp_10_percent)
- SQL file structure

### 4. Execute SQL

Execute the generated SQL file in your database:

```bash
psql -d your_database -f propiedades_import.sql
```

Or through your database management tool (e.g., Supabase SQL Editor).

## ON CONFLICT Handling

The generated SQL uses `ON CONFLICT (id) DO UPDATE SET` to:
- Insert new records if the ID doesn't exist
- Update existing records if the ID already exists

This makes the script safe to run multiple times - it will update existing properties with new data from the CSV.

## Requirements

- Python 3.6+
- pandas library (`pip install pandas`)

## Example CSV Format

```csv
ID,NOMBRE,ESTADO,FECHA INICIO,PAGO,APORTACIÓN,Retribución,INGRESO BANCO,JA,TRANSFE,FECHA COMPRA,FECHA VENTA
4b98ab74-3ed3-4a9a-853d-c7a4917bffd3,Abedul 6,Comprado,2023-01-15,Realizado,"25.000,00 €","35.000,00 €","28.000,00 €",VERDADERO,2023-02-01,2023-01-20,
084c7152-d631-48a3-ab3d-1f9b5349dfdf,Aigües del Ll 118,Vendido,2023-03-10,,"30.000,00 €","45.000,00 €","36.000,00 €",,2023-04-05,2023-03-15,2024-01-20
```

## Example Calculations

For the first property (Abedul 6):
- Retribución: €35.000,00 → 35000.0
- Retencion (19% of retribucion): 35000.0 × 0.19 = 6650.0
- Ingreso Banco: €28.000,00 → 28000.0
- Efectivo: 35000.0 - 6650.0 - 28000.0 = 350.0
- Jasp 10%: 28000.0 × 0.10 = 2800.0

## Notes

- Empty cells in CSV will be converted to NULL in SQL
- The script handles quoted values properly
- All monetary values use European number format in CSV (€25.000,00)
- Boolean fields: "Realizado" for PAGO, "VERDADERO" for JA
- The column name mapping correctly uses `titulo` (not `nombre`) to match the database schema
