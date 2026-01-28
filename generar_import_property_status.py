#!/usr/bin/env python3
"""
Script to generate SQL import statements from property_status.csv
Transforms data and creates INSERT statements with ON CONFLICT handling
"""
import pandas as pd
import re
from pathlib import Path
from datetime import datetime

# ============= CONFIG =============
CSV_PATH = "property_status.csv"
OUTPUT_SQL = "import_property_status.sql"

def clean_money_value(value):
	"""
	Convert money string to decimal number:
	- Remove € symbol
	- Handle European format: . as thousand separator, , as decimal separator
	- Convert to SQL decimal format with . as decimal separator
	Returns None if empty/invalid
	"""
	if pd.isna(value) or value == "":
		return None
	
	value_str = str(value).strip()
	# Remove € symbol and extra spaces
	value_str = value_str.replace("€", "").strip()
	# European format: remove thousand separator (.), then replace decimal separator (,) with .
	value_str = value_str.replace(".", "")  # Remove thousand separator
	value_str = value_str.replace(",", ".")  # Replace decimal separator with SQL format
	
	try:
		return float(value_str)
	except ValueError:
		return None

def clean_boolean(value):
	"""
	Convert boolean string to SQL boolean:
	- VERDADERO -> TRUE
	- Empty/other -> FALSE
	"""
	if pd.isna(value) or value == "":
		return False
	
	value_str = str(value).strip().upper()
	return value_str == "VERDADERO"

def clean_ocupado(value):
	"""
	Convert ocupado string to SQL boolean:
	- Libre -> TRUE
	- Empty/other -> FALSE
	"""
	if pd.isna(value) or value == "":
		return False
	
	value_str = str(value).strip().upper()
	return value_str == "LIBRE"

def clean_date(value):
	"""
	Convert date string to SQL timestamp format
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
	except:
		return None

def escape_sql_string(value):
	"""Escape single quotes for SQL strings"""
	if value is None or pd.isna(value):
		return None
	return str(value).replace("'", "''")

def format_sql_value(value):
	"""Format a value for SQL insertion"""
	if value is None or pd.isna(value):
		return "NULL"
	if isinstance(value, bool):
		return "TRUE" if value else "FALSE"
	if isinstance(value, (int, float)):
		return str(value)
	# String value - needs quotes and escaping
	return f"'{escape_sql_string(value)}'"

def main():
	csv_path = Path(CSV_PATH)
	if not csv_path.exists():
		print(f"ERROR: CSV file not found: {csv_path}")
		return
	
	# Read CSV
	df = pd.read_csv(csv_path)
	
	print(f"-- Processing {len(df)} rows from {CSV_PATH}")
	
	# Open output file
	with open(OUTPUT_SQL, 'w', encoding='utf-8') as f:
		f.write("-- Generated automatically from property_status.csv\n")
		f.write("-- Import data into public.propiedades table\n")
		f.write("-- Uses ON CONFLICT to update existing records based on ID\n\n")
		
		# Process each row
		for idx, row in df.iterrows():
			# Extract and transform values
			prop_id = escape_sql_string(row.get('ID', ''))
			nombre = escape_sql_string(row.get('NOMBRE', ''))
			estado = escape_sql_string(str(row.get('ESTADO', '')).lower()) if not pd.isna(row.get('ESTADO')) else None
			fecha_inicio = clean_date(row.get('FECHA INICIO'))
			pago = clean_boolean(row.get('PAGO'))
			aportacion = clean_money_value(row.get('APORTACIÓN'))
			retribucion = clean_money_value(row.get('Retribución'))
			ingreso_banco = clean_money_value(row.get('INGRESO BANCO'))
			ja = clean_boolean(row.get('JA'))
			transfe = clean_date(row.get('TRANSFE'))
			fecha_compra = clean_date(row.get('FECHA COMPRA'))
			fecha_venta = clean_date(row.get('FECHA VENTA'))
			ocupado = clean_ocupado(row.get('OCUPADO'))
			
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
			
			# Write comment with property name
			f.write(f"-- Property: {nombre}\n")
			
			# Build INSERT statement
			f.write("INSERT INTO public.propiedades (\n")
			f.write("  id, nombre, estado, fecha_inicio, pago,\n")
			f.write("  aportacion, retribucion, retencion, ingreso_banco, efectivo,\n")
			f.write("  jasp_10_percent, ja, transfe, fecha_compra, fecha_venta, ocupado\n")
			f.write(") VALUES (\n")
			f.write(f"  {format_sql_value(prop_id)}, {format_sql_value(nombre)}, {format_sql_value(estado)}, ")
			f.write(f"{format_sql_value(fecha_inicio)}, {format_sql_value(pago)},\n")
			f.write(f"  {format_sql_value(aportacion)}, {format_sql_value(retribucion)}, {format_sql_value(retencion)}, ")
			f.write(f"{format_sql_value(ingreso_banco)}, {format_sql_value(efectivo)},\n")
			f.write(f"  {format_sql_value(jasp_10_percent)}, {format_sql_value(ja)}, {format_sql_value(transfe)}, ")
			f.write(f"{format_sql_value(fecha_compra)}, {format_sql_value(fecha_venta)}, {format_sql_value(ocupado)}\n")
			f.write(")\n")
			
			# Add ON CONFLICT clause to update on existing ID
			f.write("ON CONFLICT (id) DO UPDATE SET\n")
			f.write(f"  nombre = {format_sql_value(nombre)},\n")
			f.write(f"  estado = {format_sql_value(estado)},\n")
			f.write(f"  fecha_inicio = {format_sql_value(fecha_inicio)},\n")
			f.write(f"  pago = {format_sql_value(pago)},\n")
			f.write(f"  aportacion = {format_sql_value(aportacion)},\n")
			f.write(f"  retribucion = {format_sql_value(retribucion)},\n")
			f.write(f"  retencion = {format_sql_value(retencion)},\n")
			f.write(f"  ingreso_banco = {format_sql_value(ingreso_banco)},\n")
			f.write(f"  efectivo = {format_sql_value(efectivo)},\n")
			f.write(f"  jasp_10_percent = {format_sql_value(jasp_10_percent)},\n")
			f.write(f"  ja = {format_sql_value(ja)},\n")
			f.write(f"  transfe = {format_sql_value(transfe)},\n")
			f.write(f"  fecha_compra = {format_sql_value(fecha_compra)},\n")
			f.write(f"  fecha_venta = {format_sql_value(fecha_venta)},\n")
			f.write(f"  ocupado = {format_sql_value(ocupado)};\n\n")
		
		f.write(f"-- Total records processed: {len(df)}\n")
	
	print(f"✓ SQL file generated: {OUTPUT_SQL}")
	print(f"✓ Processed {len(df)} properties")

if __name__ == "__main__":
	main()
