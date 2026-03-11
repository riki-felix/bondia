#!/usr/bin/env python3
"""
Generate SQL INSERT statements from 'activos_2026.csv'.
Additive import — appends to existing data (numero_operacion offset by 24).
Settlements only for rows with JA=VERDADERO.
"""

import csv
import re
import sys
from datetime import datetime

MESES = {
    'ene': 1, 'feb': 2, 'mar': 3, 'abr': 4, 'may': 5, 'jun': 6,
    'jul': 7, 'ago': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dic': 12,
}

OFFSET = 24  # existing data uses 1-24

def parse_money(val: str) -> str:
    if not val or val.strip() in ('', '€', '-', '0'):
        return '0'
    s = val.replace('\xa0', ' ').replace('€', '').strip()
    s = s.replace('.', '').replace(',', '.').replace('-', '')
    if not s or s == '.':
        return '0'
    return s

def parse_date(val: str) -> str | None:
    if not val or not val.strip():
        return None
    val = val.strip()

    # Reject non-date strings like "SEMANA . 3?" or "2026?"
    if re.search(r'SEMANA|\?', val, re.IGNORECASE):
        return None

    # d/m/yy (2-digit year)
    m = re.match(r'^(\d{1,2})/(\d{1,2})/(\d{2})$', val)
    if m:
        day, month, year = int(m.group(1)), int(m.group(2)), int(m.group(3))
        year += 2000
        return f'{year:04d}-{month:02d}-{day:02d}'

    # d/m/yyyy (4-digit year, possibly truncated like 202)
    m = re.match(r'^(\d{1,2})/(\d{1,2})/(\d{3,4})$', val)
    if m:
        day, month, year = int(m.group(1)), int(m.group(2)), int(m.group(3))
        if year < 100:
            year += 2000
        elif year < 1000:
            # Truncated year like "202" → assume 2025
            year = 2025
        return f'{year:04d}-{month:02d}-{day:02d}'

    # '21 may 2024' (Spanish text month)
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
    if v is None:
        return 'NULL'
    escaped = v.replace("'", "''")
    return f"'{escaped}'"

# Map CSV estado → DB estado
ESTADO_MAP = {
    'vendido': 'vendido',
    'comprado': 'comprado',
    'bloqueado': 'sin_estado',
    'en proceso': 'negociacion',
}

def main():
    rows = []
    with open('activos_2026.csv', 'r', encoding='utf-8') as f:
        reader = csv.reader(f, delimiter=';')
        header = next(reader)
        for row in reader:
            # Skip rows without numeric ID (totals row, unnamed entries)
            if not row[0].strip() or not row[0].strip().isdigit():
                continue
            rows.append(row)

    lines = []
    lines.append('-- =============================================================')
    lines.append('-- AUTO-GENERATED SQL from "Activos 2026-Tabla 1.csv"')
    lines.append('-- Generated: ' + datetime.now().strftime('%Y-%m-%d %H:%M'))
    lines.append('-- =============================================================')
    lines.append('-- ADDITIVE IMPORT: Appends to existing data (offset +24).')
    lines.append('-- "Bloqueado" → sin_estado, "En proceso" → negociacion.')
    lines.append('-- Settlements only for JA=VERDADERO rows (IDs 1-7).')
    lines.append(f'-- Skipped rows without ID (totals, Floridablanca, MAS 114).')
    lines.append(f'-- Row 3: date "28/11/202" interpreted as 2025-11-28.')
    lines.append(f'-- Rows 6-7: date "13/1/26" interpreted as 2026-01-13.')
    lines.append('-- =============================================================')
    lines.append('')
    lines.append('BEGIN;')
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
    settlement_rows = []

    for row in rows:
        csv_id = int(row[0].strip())
        num_op = csv_id + OFFSET
        titulo = row[1].strip()
        estado_raw = row[2].strip().lower()
        estado = ESTADO_MAP.get(estado_raw, 'sin_estado')
        fecha_ingreso = parse_date(row[3].strip())
        pago = 'true' if row[4].strip() == 'Realizado' else 'false'
        aportacion = parse_money(row[5])
        retribucion = parse_money(row[6])
        ingreso_banco = parse_money(row[8])
        transfe = parse_date(row[12].strip()) if row[12].strip() else None
        fecha_compra = parse_date(row[13].strip()) if len(row) > 13 and row[13].strip() else None
        fecha_venta = parse_date(row[14].strip()) if len(row) > 14 and row[14].strip() else None
        ocupado_raw = row[15].strip().lower() if len(row) > 15 else ''
        ocupado = 'true' if ocupado_raw == 'ocupado' else 'false'
        ja = row[11].strip().upper() == 'VERDADERO' if len(row) > 11 else False
        liquidacion = 'true' if ja else 'false'

        val = (
            f"  ({num_op}, {sql_val(titulo)}, {sql_val(estado)}, {sql_val(fecha_ingreso)},"
            f" {pago}, {aportacion}, {retribucion}, {ingreso_banco},"
            f" {sql_val(transfe)}, {sql_val(fecha_compra)}, {sql_val(fecha_venta)},"
            f" {ocupado}, {liquidacion}, 'inversion')"
        )
        prop_values.append(val)

        if ja and transfe:
            settlement_rows.append((csv_id, num_op, titulo, aportacion, retribucion, ingreso_banco, transfe))

    lines.append(',\n'.join(prop_values) + ';')
    lines.append('')

    # ── Step 2: Insert settlements ──
    if settlement_rows:
        lines.append('-- ─── Step 2: Insert settlements (JA=VERDADERO only) ───')
        lines.append('-- retencion, neto, efectivo are GENERATED ALWAYS — not included.')
        lines.append('')

        for csv_id, num_op, titulo, aportacion, retribucion, transferencia, transfe in settlement_rows:
            ejercicio = transfe[:4]
            lines.append(f'-- Op {num_op} (CSV {csv_id}): {titulo}')
            lines.append(
                f"INSERT INTO liquidaciones "
                f"(propiedad_id, fecha_liquidacion, numero_liquidacion, "
                f"aportacion, retribucion, transferencia, "
                f"fecha_transferencia, liquidado, ejercicio) "
                f"VALUES ("
                f"(SELECT id FROM propiedades WHERE numero_operacion = {num_op}), "
                f"'{transfe}', 1, "
                f"{aportacion}, {retribucion}, {transferencia}, "
                f"'{transfe}', true, {ejercicio});"
            )
            lines.append('')

    lines.append('COMMIT;')

    sql = '\n'.join(lines)
    out_file = 'import_csv_data_2026.sql'
    with open(out_file, 'w', encoding='utf-8') as f:
        f.write(sql)

    print(f'Generated {out_file} with {len(rows)} properties + {len(settlement_rows)} settlements.')

if __name__ == '__main__':
    main()
