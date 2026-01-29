#!/usr/bin/env python3
"""
Script to merge propiedades table schema with CSV data
Transforms data according to the specified column mappings and creates a new CSV file
"""
import pandas as pd
import re
import sys
from pathlib import Path
from datetime import datetime

# ============= CONFIG =============
INPUT_CSV = "Sin título 3.csv"
OUTPUT_CSV = "propiedades_merged.csv"

def clean_money_value(value):
    """
    Convert money string to decimal number:
    - Remove € symbol
    - Handle European format: . as thousand separator, , as decimal separator
    - Convert to decimal format with . as decimal separator
    Returns None if empty/invalid
    """
    if pd.isna(value) or value == "":
        return None
    
    value_str = str(value).strip()
    # Remove € symbol and extra spaces
    value_str = value_str.replace("€", "").strip()
    # European format: remove thousand separator (.), then replace decimal separator (,) with .
    value_str = value_str.replace(".", "")  # Remove thousand separator
    value_str = value_str.replace(",", ".")  # Replace decimal separator
    
    try:
        return float(value_str)
    except ValueError:
        return None

def clean_boolean_pago(value):
    """
    Convert PAGO string to boolean:
    - Realizado -> TRUE
    - Empty/other -> FALSE
    """
    if pd.isna(value) or value == "":
        return False
    
    value_str = str(value).strip()
    return value_str == "Realizado"

def clean_boolean_ja(value):
    """
    Convert JA string to boolean:
    - VERDADERO -> TRUE
    - Empty/other -> FALSE
    """
    if pd.isna(value) or value == "":
        return False
    
    value_str = str(value).strip().upper()
    return value_str == "VERDADERO"

def clean_date(value):
    """
    Convert date string to timestamp format (YYYY-MM-DD)
    Returns None if empty/invalid
    """
    if pd.isna(value) or value == "":
        return None
    
    try:
        # Try to parse various date formats
        date_str = str(value).strip()
        # Try ISO format first
        if re.match(r'\d{4}-\d{2}-\d{2}', date_str):
            return date_str
        # Try other common formats and convert to ISO
        for fmt in ['%d/%m/%Y', '%Y/%m/%d', '%d-%m-%Y']:
            try:
                dt = datetime.strptime(date_str, fmt)
                return dt.strftime('%Y-%m-%d')
            except ValueError:
                continue
        return date_str
    except Exception:
        return None

def main():
    csv_path = Path(INPUT_CSV)
    if not csv_path.exists():
        print(f"ERROR: CSV file not found: {csv_path}", file=sys.stderr)
        sys.exit(1)
    
    # Read CSV with error handling
    try:
        df = pd.read_csv(csv_path)
    except Exception as e:
        print(f"ERROR: Failed to read CSV file: {e}", file=sys.stderr)
        sys.exit(1)
    
    print(f"-- Processing {len(df)} rows from {INPUT_CSV}")
    
    # Create new dataframe with transformed data
    output_rows = []
    
    for idx, row in df.iterrows():
        # Extract and transform values according to mapping
        prop_id = row.get('ID', '')
        titulo = row.get('NOMBRE', '')
        estado = row.get('ESTADO', '')
        fecha_inicio = clean_date(row.get('FECHA INICIO'))
        pago = clean_boolean_pago(row.get('PAGO'))
        aportacion = clean_money_value(row.get('APORTACIÓN'))
        retribucion = clean_money_value(row.get('Retribución'))
        ingreso_banco = clean_money_value(row.get('INGRESO BANCO'))
        ja = clean_boolean_ja(row.get('JA'))
        transfe = clean_date(row.get('TRANSFE'))
        fecha_compra = clean_date(row.get('FECHA COMPRA'))
        fecha_venta = clean_date(row.get('FECHA VENTA'))
        
        # Calculate derived fields
        retencion = round(retribucion * 0.19, 2) if retribucion else None
        efectivo = None
        if retribucion is not None:
            efectivo = retribucion
            if retencion is not None:
                efectivo -= retencion
            if ingreso_banco is not None:
                efectivo -= ingreso_banco
            efectivo = round(efectivo, 2)
        
        jasp_10_percent = round(ingreso_banco * 0.10, 2) if ingreso_banco else None
        
        # Build output row
        output_row = {
            'id': prop_id,
            'titulo': titulo,
            'estado': estado,
            'fecha_inicio': fecha_inicio if fecha_inicio else '',
            'pago': pago,
            'aportacion': aportacion if aportacion is not None else '',
            'retribucion': retribucion if retribucion is not None else '',
            'retencion': retencion if retencion is not None else '',
            'ingreso_banco': ingreso_banco if ingreso_banco is not None else '',
            'efectivo': efectivo if efectivo is not None else '',
            'jasp_10_percent': jasp_10_percent if jasp_10_percent is not None else '',
            'ja': ja,
            'transfe': transfe if transfe else '',
            'fecha_compra': fecha_compra if fecha_compra else '',
            'fecha_venta': fecha_venta if fecha_venta else ''
        }
        
        output_rows.append(output_row)
    
    # Create output dataframe
    output_df = pd.DataFrame(output_rows)
    
    # Write to CSV with error handling
    try:
        output_df.to_csv(OUTPUT_CSV, index=False)
    except Exception as e:
        print(f"ERROR: Failed to write output CSV: {e}", file=sys.stderr)
        sys.exit(1)
    
    print(f"✓ Merged CSV file generated: {OUTPUT_CSV}")
    print(f"✓ Processed {len(output_df)} properties")
    print(f"\nColumn mappings applied:")
    print(f"  - ID -> id")
    print(f"  - NOMBRE -> titulo")
    print(f"  - ESTADO -> estado")
    print(f"  - FECHA INICIO -> fecha_inicio (timestamp)")
    print(f"  - PAGO -> pago (Realizado -> TRUE)")
    print(f"  - APORTACIÓN -> aportacion (numeric cleaned)")
    print(f"  - Retribución -> retribucion (numeric cleaned)")
    print(f"  - INGRESO BANCO -> ingreso_banco (numeric cleaned)")
    print(f"  - JA -> ja (VERDADERO -> TRUE)")
    print(f"  - TRANSFE -> transfe (timestamp)")
    print(f"  - FECHA COMPRA -> fecha_compra (timestamp)")
    print(f"  - FECHA VENTA -> fecha_venta (timestamp)")
    print(f"\nCalculated fields:")
    print(f"  - retencion = retribucion * 0.19")
    print(f"  - efectivo = retribucion - retencion - ingreso_banco")
    print(f"  - jasp_10_percent = ingreso_banco * 0.10")

if __name__ == "__main__":
    main()
