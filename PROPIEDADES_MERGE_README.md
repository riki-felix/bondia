# Propiedades Merge Script

This directory contains files for merging the propiedades table schema with CSV data.

## Files

- **propiedades_schema.sql**: SQL schema definition for the propiedades table
- **Sin título 3.csv**: Source CSV file with property data
- **generar_propiedades_merged.py**: Python script to merge schema and CSV data
- **propiedades_merged.csv**: Output CSV file with transformed data

## Column Mappings

The script maps CSV columns to database columns with the following transformations:

| Schema Column     | CSV Column            | Transformation                                   |
|-------------------|-----------------------|--------------------------------------------------|
| id                | ID                    | Direct mapping (UUID)                            |
| titulo            | NOMBRE                | Direct mapping                                   |
| estado            | ESTADO                | Direct mapping                                   |
| fecha_inicio      | FECHA INICIO          | Convert to timestamp (YYYY-MM-DD)                |
| pago              | PAGO                  | Convert `Realizado` to TRUE, otherwise FALSE     |
| aportacion        | APORTACIÓN            | Numeric cleaned (remove €, commas)               |
| retribucion       | Retribución           | Numeric cleaned (remove €, commas)               |
| retencion         | Calculated            | retribucion × 0.19                               |
| ingreso_banco     | INGRESO BANCO         | Numeric cleaned (remove €, commas)               |
| efectivo          | Calculated            | retribucion - retencion - ingreso_banco          |
| jasp_10_percent   | Calculated            | ingreso_banco × 0.10                             |
| ja                | JA                    | Convert `VERDADERO` to TRUE, otherwise FALSE     |
| transfe           | TRANSFE               | Convert to timestamp (YYYY-MM-DD)                |
| fecha_compra      | FECHA COMPRA          | Convert to timestamp (YYYY-MM-DD)                |
| fecha_venta       | FECHA VENTA           | Convert to timestamp (YYYY-MM-DD)                |

## Data Transformations

### Numeric Values
Converts European money format to decimal numbers:
- Input: `€25.000,00` or `25.000,00 €`
- Output: `25000.0`

Steps:
1. Remove € symbol
2. Remove thousand separator (.)
3. Replace decimal separator (,) with (.)

### Boolean Values
- **PAGO**: `Realizado` → `TRUE`, otherwise `FALSE`
- **JA**: `VERDADERO` → `TRUE`, otherwise `FALSE`

### Date Values
Converts dates to ISO format (YYYY-MM-DD):
- Supported formats: YYYY-MM-DD, DD/MM/YYYY, YYYY/MM/DD, DD-MM-YYYY
- Empty values become empty strings

### Calculated Fields

1. **retencion**: Tax retention = retribucion × 0.19
2. **efectivo**: Cash amount = retribucion - retencion - ingreso_banco
3. **jasp_10_percent**: 10% of bank deposit = ingreso_banco × 0.10

## Usage

### 1. Prepare your source CSV file

Update `Sin título 3.csv` with your property data following this format:

```csv
ID,NOMBRE,ESTADO,FECHA INICIO,PAGO,APORTACIÓN,Retribución,INGRESO BANCO,JA,TRANSFE,FECHA COMPRA,FECHA VENTA
uuid,Property Name,Comprado,2023-01-15,Realizado,"25.000,00 €","35.000,00 €","28.000,00 €",VERDADERO,2023-02-01,2023-01-20,
```

### 2. Generate merged CSV

Run the Python script:

```bash
python3 generar_propiedades_merged.py
```

This will generate `propiedades_merged.csv` with all transformations applied.

### 3. Review the output

The script will:
- Read the source CSV
- Apply all column mappings
- Perform data transformations
- Calculate derived fields
- Generate a new CSV file ready for import

## Requirements

- Python 3.6+
- pandas library (`pip install pandas`)

## Example

**Input (Sin título 3.csv):**
```csv
ID,NOMBRE,ESTADO,FECHA INICIO,PAGO,APORTACIÓN,Retribución,INGRESO BANCO,JA,TRANSFE,FECHA COMPRA,FECHA VENTA
4b98ab74-3ed3-4a9a-853d-c7a4917bffd3,Abedul 6,Comprado,2023-01-15,Realizado,"25.000,00 €","35.000,00 €","28.000,00 €",VERDADERO,2023-02-01,2023-01-20,
```

**Output (propiedades_merged.csv):**
```csv
id,titulo,estado,fecha_inicio,pago,aportacion,retribucion,retencion,ingreso_banco,efectivo,jasp_10_percent,ja,transfe,fecha_compra,fecha_venta
4b98ab74-3ed3-4a9a-853d-c7a4917bffd3,Abedul 6,Comprado,2023-01-15,True,25000.0,35000.0,6650.0,28000.0,350.0,2800.0,True,2023-02-01,2023-01-20,
```

## Notes

- Empty cells in CSV will be converted to empty strings in the output
- All monetary values use European number format in input (€25.000,00)
- Boolean fields accept specific keywords: `Realizado` for pago, `VERDADERO` for ja
- The output CSV can be imported into the database using standard CSV import tools
