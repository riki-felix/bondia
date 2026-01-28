# Property Status Import Guide

This directory contains files for importing property status data from CSV into the `propiedades` table.

## Files

- **property_status.csv**: Sample CSV file with property status data
- **generar_import_property_status.py**: Python script to generate SQL import statements from CSV
- **import_property_status.sql**: Generated SQL file ready to execute

## CSV Column Mappings

The script maps CSV columns to database columns as follows:

| CSV Column       | Database Column  | Transformation                                    |
|------------------|------------------|---------------------------------------------------|
| ID               | id               | Direct mapping (UUID)                             |
| NOMBRE           | nombre           | Property name                                     |
| ESTADO           | estado           | Status (lowercased)                               |
| FECHA INICIO     | fecha_inicio     | Start date (ISO format)                           |
| PAGO             | pago             | Boolean (VERDADERO → TRUE)                        |
| APORTACIÓN       | aportacion       | Numeric (€25.000,00 → 25000.0)                    |
| Retribución      | retribucion      | Numeric (€35.000,00 → 35000.0)                    |
| INGRESO BANCO    | ingreso_banco    | Numeric (€28.000,00 → 28000.0)                    |
| JA               | ja               | Boolean (VERDADERO → TRUE)                        |
| TRANSFE          | transfe          | Transfer date (ISO format)                        |
| FECHA COMPRA     | fecha_compra     | Purchase date (ISO format)                        |
| FECHA VENTA      | fecha_venta      | Sale date (ISO format, nullable)                  |
| OCUPADO          | ocupado          | Boolean (Libre → TRUE) **Note: Per requirements, the `ocupado` field is TRUE when property is "Libre" (available)**                  |

## Calculated Columns

The script automatically calculates these fields:

- **retencion**: 19% of Retribución
- **efectivo**: Retribución - Retención - Ingreso Banco
- **jasp_10_percent**: 10% of Ingreso Banco

## Data Transformations

The script performs these transformations:

1. **Numeric values**: Converts European format (€25.000,00) to SQL decimal (25000.0)
   - Removes € symbol
   - Removes thousand separator (.)
   - Replaces decimal separator (,) with (.)

2. **Boolean values**:
   - VERDADERO → TRUE
   - Empty/other → FALSE
   - Libre (in OCUPADO field) → TRUE **Note: Per requirements, `ocupado` is TRUE when property is available ("Libre")**

3. **Dates**: Converts to ISO format (YYYY-MM-DD)

4. **Text**: Lowercases estado field

## Usage

### 1. Prepare your CSV file

Create or update `property_status.csv` with your property data. Use the sample file as a template.

### 2. Generate SQL

Run the Python script:

```bash
python3 generar_import_property_status.py
```

This will generate `import_property_status.sql`.

### 3. Execute SQL

Execute the generated SQL file in your database:

```bash
psql -d your_database -f import_property_status.sql
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
ID,NOMBRE,ESTADO,FECHA INICIO,PAGO,APORTACIÓN,Retribución,INGRESO BANCO,JA,TRANSFE,FECHA COMPRA,FECHA VENTA,OCUPADO
4b98ab74-3ed3-4a9a-853d-c7a4917bffd3,Abedul 6,Comprado,2023-01-15,VERDADERO,"25.000,00 €","35.000,00 €","28.000,00 €",VERDADERO,2023-02-01,2023-01-20,,Ocupado
```

## Notes

- Empty cells in CSV will be converted to NULL in SQL
- The script handles quoted values properly
- All monetary values use European number format in CSV (€25.000,00)
- Boolean fields accept VERDADERO or Libre (for ocupado field)
- The `ocupado` field has specific semantics: it is TRUE when the CSV says "Libre" (available), per the requirements
