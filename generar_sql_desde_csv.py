#!/usr/bin/env python3
"""
Generate SQL INSERT statements from 'Sin título 3.csv'.
Creates:
  1. INSERT for propiedades (skipping calculated: retencion, efectivo, jasp_10_percent)
  2. INSERT for liquidaciones (retencion, neto, efectivo are GENERATED ALWAYS)
  3. UPDATE to populate calculated property columns
"""

import csv
import re
import sys
from datetime import datetime

# Spanish month abbreviations
MESES = {
    'ene': 1, 'feb': 2, 'mar': 3, 'abr': 4, 'may': 5, 'jun': 6,
    'jul': 7, 'ago': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dic': 12,
}

def parse_money(val: str) -> str:
    """Convert European money format '26.237,90 €' → '26237.90'."""
    if not val or val.strip() in ('', '€', '-'):
        return '0'
    s = val.replace('\xa0', ' ').replace('€', '').strip()
    s = s.replace('.', '')      # remove thousands separator
    s = s.replace(',', '.')     # decimal comma → dot
    s = s.replace('-', '')      # handle -0,00
    if not s or s == '.':
        return '0'
    return s

def parse_date(val: str) -> str | None:
    """Parse mixed date formats → 'YYYY-MM-DD'."""
    if not val or not val.strip():
        return None
    val = val.strip()

    # Try d/m/yyyy
    m = re.match(r'^(\d{1,2})/(\d{1,2})/(\d{4})$', val)
    if m:
        day, month, year = int(m.group(1)), int(m.group(2)), int(m.group(3))
        return f'{year:04d}-{month:02d}-{day:02d}'

    # Try '21 may 2024' (Spanish text month)
    m = re.match(r'^(\d{1,2})\s+(\w+)\s+(\d{4})$', val)
    if m:
        day = int(m.group(1))
        month_str = m.group(2).lower()
        year = int(m.group(3))
        month = MESES.get(month_str)
        if month:
            return f'{year:04d}-{month:02d}-{day:02d}'

    print(f"WARNING: Could not parse date '{val}'", file=sys.stderr)
    return None

def sql_val(v: str | None) -> str:
    """Escape a string for SQL. Returns NULL or 'value'."""
    if v is None:
        return 'NULL'
    escaped = v.replace("'", "''")
    return f"'{escaped}'"

def main():
    rows = []
    with open('Sin título 3.csv', 'r', encoding='utf-8') as f:
        reader = csv.reader(f, delimiter=';')
        header = next(reader)
        for row in reader:
            rows.append(row)

    # Column indices:
    # 0:ID, 1:NOMBRE, 2:ESTADO, 3:FECHA INICIO, 4:PAGO, 5:APORTACIÓN,
    # 6:Retribución, 7:RETENCIÓN(skip), 8:INGRESO BANCO, 9:EFECTIVO(skip),
    # 10:JASP 10%(skip), 11:JA, 12:TRANSFE, 13:FECHA COMPRA(empty→skip),
    # 14:FECHA VENTA(→fecha_compra!), 15:OCUPADO, 16:NOTAS

    lines = []
    lines.append('-- =============================================================')
    lines.append('-- AUTO-GENERATED SQL from "Sin título 3.csv"')
    lines.append('-- Generated: ' + datetime.now().strftime('%Y-%m-%d %H:%M'))
    lines.append('-- =============================================================')
    lines.append('-- FRESH IMPORT: Deletes all existing data first.')
    lines.append('-- Skipped: RETENCIÓN, EFECTIVO, JASP (calculated at 20%).')
    lines.append('-- Skipped: NOTAS (not imported).')
    lines.append('-- Liquidaciones: retencion, neto, efectivo are GENERATED ALWAYS.')
    lines.append('-- =============================================================')
    lines.append('')
    lines.append('BEGIN;')
    lines.append('')

    # ── Step 0: Clean existing data ──
    lines.append('-- ─── Step 0: Delete existing data (fresh import) ───')
    lines.append('DELETE FROM aportaciones;')
    lines.append('DELETE FROM liquidaciones;')
    lines.append('DELETE FROM propiedades;')
    lines.append('')

    # ── Step 1: Insert properties ──
    lines.append('-- ─── Step 1: Insert properties ───')
    lines.append('INSERT INTO propiedades (')
    lines.append('  numero_operacion, titulo, estado, fecha_ingreso,')
    lines.append('  pago, aportacion, retribucion, ingreso_banco,')
    lines.append('  transfe, fecha_compra, fecha_venta,')
    lines.append('  ocupado, liquidacion, tipo')
    lines.append(') VALUES')

    prop_values = []
    for row in rows:
        num_op = row[0].strip()
        titulo = row[1].strip()
        estado = row[2].strip().lower()
        fecha_ingreso = parse_date(row[3].strip())
        pago = 'true' if row[4].strip() == 'Realizado' else 'false'
        aportacion = parse_money(row[5])
        retribucion = parse_money(row[6])
        ingreso_banco = parse_money(row[8])
        transfe = parse_date(row[12].strip())
        fecha_compra = parse_date(row[13].strip())  # CSV FECHA COMPRA → DB fecha_compra
        fecha_venta = parse_date(row[14].strip())    # CSV FECHA VENTA → DB fecha_venta
        ocupado = 'true' if row[15].strip().lower() == 'ocupado' else 'false'

        val = (
            f"  ({num_op}, {sql_val(titulo)}, {sql_val(estado)}, {sql_val(fecha_ingreso)},"
            f" {pago}, {aportacion}, {retribucion}, {ingreso_banco},"
            f" {sql_val(transfe)}, {sql_val(fecha_compra)}, {sql_val(fecha_venta)},"
            f" {ocupado}, true, 'inversion')"
        )
        prop_values.append(val)

    lines.append(',\n'.join(prop_values) + ';')
    lines.append('')

    # ── Step 2: Insert settlements ──
    lines.append('-- ─── Step 2: Insert settlements (one per property) ───')
    lines.append('-- retencion, neto, efectivo are GENERATED ALWAYS — not included.')
    lines.append('')

    for row in rows:
        num_op = row[0].strip()
        titulo = row[1].strip()
        aportacion = parse_money(row[5])
        retribucion = parse_money(row[6])
        transferencia = parse_money(row[8])  # INGRESO BANCO → settlement transferencia
        transfe = parse_date(row[12].strip())
        ejercicio = transfe[:4] if transfe else 'NULL'

        lines.append(f'-- Op {num_op}: {titulo}')
        lines.append(
            f"INSERT INTO liquidaciones "
            f"(propiedad_id, fecha_liquidacion, numero_liquidacion, "
            f"aportacion, retribucion, transferencia, "
            f"fecha_transferencia, liquidado, ejercicio) "
            f"VALUES ("
            f"(SELECT id FROM propiedades WHERE numero_operacion = {num_op}), "
            f"{sql_val(transfe)}, 1, "
            f"{aportacion}, {retribucion}, {transferencia}, "
            f"{sql_val(transfe)}, true, {ejercicio});"
        )
        lines.append('')

    lines.append('COMMIT;')

    sql = '\n'.join(lines)
    out_file = 'import_csv_data.sql'
    with open(out_file, 'w', encoding='utf-8') as f:
        f.write(sql)

    print(f'Generated {out_file} with {len(rows)} properties + {len(rows)} settlements.')

if __name__ == '__main__':
    main()
