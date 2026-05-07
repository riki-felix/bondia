#!/usr/bin/env python3
"""
Script to generate SQL import statements from "Sin título 3.csv"
Transforms all 24 rows with complete mappings and transformations
Maps ID → numero_operacion, NOMBRE → titulo, with proper case-sensitive estado values
Includes ocupado and notas fields
"""
import pandas as pd
import re
from pathlib import Path
from datetime import datetime
import uuid

# ============= CONFIG =============
CSV_PATH = "Sin título 3.csv"
OUTPUT_SQL = "propiedades_completo.sql"

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

def clean_boolean_pago(value):
	"""
	Convert pago string to SQL boolean:
	- Realizado -> TRUE
	- Empty/other -> FALSE
	"""
	if pd.isna(value) or value == "":
		return False
	
	value_str = str(value).strip().upper()
	return value_str == "REALIZADO"

def clean_boolean_verdadero(value):
	"""
	Convert boolean string to SQL boolean:
	- VERDADERO -> TRUE
	- Empty/other -> FALSE
	"""
	if pd.isna(value) or value == "":
		return False
	
	value_str = str(value).strip().upper()
	return value_str == "VERDADERO"

def clean_boolean_ocupado(value):
	"""
	Convert ocupado string to SQL boolean:
	- Libre -> TRUE (property is free/available for rent)
	- Empty/other -> FALSE (property is occupied)
	Note: This follows the business logic where "Libre" means the property 
	is available (TRUE), not occupied (FALSE)
	"""
	if pd.isna(value) or value == "":
		return False
	
	value_str = str(value).strip().upper()
	return value_str == "LIBRE"

def clean_estado(value):
	"""
	Convert estado to lowercase to match propiedades_estado_check constraint
	- Comprado -> comprado
	- Vendido -> vendido
	- Reformando -> reformando
	"""
	if pd.isna(value) or value == "":
		return None
	
	return str(value).strip().lower()

def clean_date(value):
	"""
	Convert date string to SQL timestamp format (ISO 8601: YYYY-MM-DD)
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
		
		# Handle Spanish month names format like "21 may 2024"
		spanish_months = {
			'ene': '01', 'feb': '02', 'mar': '03', 'abr': '04',
			'may': '05', 'jun': '06', 'jul': '07', 'ago': '08',
			'sep': '09', 'oct': '10', 'nov': '11', 'dic': '12'
		}
		
		# Pattern: "21 may 2024"
		match = re.match(r'(\d{1,2})\s+(\w{3})\s+(\d{4})', date_str)
		if match:
			day, month_name, year = match.groups()
			month = spanish_months.get(month_name.lower())
			if month:
				return f"{year}-{month}-{day.zfill(2)}"
		
		# Try other common formats
		for fmt in ['%d/%m/%Y', '%Y/%m/%d', '%d-%m-%Y', '%m/%d/%Y']:
			try:
				dt = datetime.strptime(date_str, fmt)
				return dt.strftime('%Y-%m-%d')
			except ValueError:
				continue
		
		return None
	except Exception:
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
	
	# Read CSV with semicolon delimiter
	df = pd.read_csv(csv_path, sep=';', encoding='utf-8')
	
	print(f"-- Processing {len(df)} rows from {CSV_PATH}")
	print(f"-- Columns: {', '.join(df.columns)}")
	
	# Open output file
	with open(OUTPUT_SQL, 'w', encoding='utf-8') as f:
		f.write(f"-- Generated automatically from {CSV_PATH}\n")
		f.write("-- Import all 24 rows into public.propiedades table\n")
		f.write("-- Uses ON CONFLICT on numero_operacion to update existing records\n")
		f.write("-- All transformations applied as per requirements:\n")
		f.write("--   - ID → numero_operacion (integer field)\n")
		f.write("--   - NOMBRE → titulo\n")
		f.write("--   - ESTADO → estado (lowercase)\n")
		f.write("--   - PAGO: Realizado → TRUE\n")
		f.write("--   - JA: VERDADERO → TRUE\n")
		f.write("--   - OCUPADO: Libre → TRUE\n")
		f.write("--   - Money fields: Remove €, convert commas to dots\n")
		f.write("--   - Dates: ISO 8601 format (YYYY-MM-DD)\n\n")
		
		# Process each row
		for idx, row in df.iterrows():
			# Extract and transform values
			numero_operacion = None
			id_val = row.get('ID', '')
			if not pd.isna(id_val) and id_val != '':
				try:
					numero_operacion = int(id_val)
				except:
					pass
			
			# Generate UUID for id field
			prop_id = str(uuid.uuid4())
			
			titulo = escape_sql_string(row.get('NOMBRE', ''))  # NOMBRE → titulo
			estado = clean_estado(row.get('ESTADO', ''))  # Convert to lowercase
			fecha_inicio = clean_date(row.get('FECHA INICIO'))
			pago = clean_boolean_pago(row.get('PAGO'))  # Realizado → TRUE
			aportacion = clean_money_value(row.get('APORTACIÓN'))
			retribucion = clean_money_value(row.get('Retribución'))
			retencion = clean_money_value(row.get('RETENCIÓN'))  # Use CSV value if available
			ingreso_banco = clean_money_value(row.get('INGRESO BANCO'))
			efectivo = clean_money_value(row.get('EFECTIVO'))  # Use CSV value if available
			jasp_10_percent = clean_money_value(row.get('JASP 10%'))  # Use CSV value if available
			ja = clean_boolean_verdadero(row.get('JA'))
			transfe = clean_date(row.get('TRANSFE'))
			fecha_compra = clean_date(row.get('FECHA COMPRA'))
			fecha_venta = clean_date(row.get('FECHA VENTA'))
			ocupado = clean_boolean_ocupado(row.get('OCUPADO'))  # Libre → TRUE
			notas = escape_sql_string(row.get('NOTAS', ''))
			
			# Use calculated values only if CSV doesn't provide them
			if retencion is None and retribucion is not None:
				retencion = round(retribucion * 0.19, 2)
			
			if efectivo is None and retribucion is not None:
				efectivo = retribucion
				if retencion is not None:
					efectivo -= retencion
				if ingreso_banco is not None:
					efectivo -= ingreso_banco
				efectivo = round(efectivo, 2)
			
			# Normalize negative zero to zero
			if efectivo is not None and abs(efectivo) < 0.01:
				efectivo = 0.0
			
			if jasp_10_percent is None and ingreso_banco is not None:
				jasp_10_percent = round(ingreso_banco * 0.10, 2)
			
			# Write comment with property title
			f.write(f"-- Property {numero_operacion}: {titulo}\n")
			
			# Build INSERT statement
			f.write("INSERT INTO public.propiedades (\n")
			f.write("  id, numero_operacion, titulo, estado, fecha_inicio, pago,\n")
			f.write("  aportacion, retribucion, retencion, ingreso_banco, efectivo,\n")
			f.write("  jasp_10_percent, ja, transfe, fecha_compra, fecha_venta, ocupado, notas\n")
			f.write(") VALUES (\n")
			f.write(f"  {format_sql_value(prop_id)}, {format_sql_value(numero_operacion)}, {format_sql_value(titulo)}, ")
			f.write(f"{format_sql_value(estado)}, {format_sql_value(fecha_inicio)}, {format_sql_value(pago)},\n")
			f.write(f"  {format_sql_value(aportacion)}, {format_sql_value(retribucion)}, {format_sql_value(retencion)}, ")
			f.write(f"{format_sql_value(ingreso_banco)}, {format_sql_value(efectivo)},\n")
			f.write(f"  {format_sql_value(jasp_10_percent)}, {format_sql_value(ja)}, {format_sql_value(transfe)}, ")
			f.write(f"{format_sql_value(fecha_compra)}, {format_sql_value(fecha_venta)}, {format_sql_value(ocupado)}, {format_sql_value(notas)}\n")
			f.write(")\n")
			
			# Add ON CONFLICT clause to update on existing numero_operacion
			f.write("ON CONFLICT (numero_operacion) DO UPDATE SET\n")
			f.write(f"  id = {format_sql_value(prop_id)},\n")
			f.write(f"  titulo = {format_sql_value(titulo)},\n")
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
			f.write(f"  ocupado = {format_sql_value(ocupado)},\n")
			f.write(f"  notas = {format_sql_value(notas)};\n\n")
		
		f.write(f"-- Total records processed: {len(df)}\n")
		f.write("-- All 24 rows have been transformed and are ready for import\n")
	
	print(f"✓ SQL file generated: {OUTPUT_SQL}")
	print(f"✓ Processed {len(df)} properties")
	print(f"✓ Ready to import into propiedades table")

if __name__ == "__main__":
	main()
