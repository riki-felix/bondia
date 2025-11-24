#!/usr/bin/env python3
import pandas as pd
import re
import unicodedata
from pathlib import Path
from typing import Optional
from datetime import datetime

# ============= CONFIG =============

# Ruta a tu Excel (mejor .xlsx; si tienes .xls conviértelo en Excel a .xlsx)
EXCEL_PATH = "HC CB & SANYUS CB.xls"

# Mapeo de propiedades: titulo -> id (datos de Supabase)
PROPIEDADES = [
	{"id": "4b98ab74-3ed3-4a9a-853d-c7a4917bffd3", "titulo": "Abedul 6"},
	{"id": "084c7152-d631-48a3-ab3d-1f9b5349dfdf", "titulo": "Aigües del Ll 118"},
	{"id": "801ed2ce-10c7-4a25-a88f-822e629c1b46", "titulo": "Aigües del Llob. 91"},
	{"id": "2262b155-b597-4ae1-ae12-906679d57ebd", "titulo": "Aigües del Llobregat"},
	{"id": "8bdf0a86-446d-42bc-b09f-23661750d4d1", "titulo": "Aigües del Llobregat 131"},
	{"id": "fdce96b8-64d3-4893-820b-3470fb0715bf", "titulo": "Alacant 2"},
	{"id": "125c46ac-0f52-4476-af1c-cffce2a40046", "titulo": "Alegria 32"},
	{"id": "0d68b9ca-5690-4dd5-8089-a808b7ada2c1", "titulo": "Amadeu Vives 19"},
	{"id": "75486531-00a1-4756-ba7e-c21a49431b8e", "titulo": "Antiga Travessera 5"},
	{"id": "1ab86ccc-526d-4d19-bd25-06cfd9051ebb", "titulo": "Av del Bosc 28"},
	{"id": "60e68f59-bc4a-43e8-9d49-235aa7c09dbb", "titulo": "Av Isabel la Católica 74"},
	{"id": "f546a85a-103d-451c-9a2b-85304f3fc3ce", "titulo": "Av. Catalunya 105"},
	{"id": "69375acd-ba1b-4e52-ace9-834f59cc8c70", "titulo": "Av. del Bosc 67"},
	{"id": "a0981fac-a76f-4755-9c19-ed1a7826c309", "titulo": "Av. Masnou 72"},
	{"id": "4f2174d5-b3e3-4157-b2fc-afde51c59672", "titulo": "Av. Miraflores 14"},
	{"id": "e5b26da2-6716-444d-8973-262266fcbe84", "titulo": "Av. Miraflores 34"},
	{"id": "304a54e1-b349-4675-9088-76fe88db2619", "titulo": "Av. Ponent 30"},
	{"id": "eaab3415-493e-4392-ad46-b69b19324826", "titulo": "Bòbiles 56"},
	{"id": "7e00a3c7-90ee-4f5f-a304-eb5b16bc3b5c", "titulo": "Castelao 135"},
	{"id": "8a45ab4b-cca0-45dc-b705-b61e1249d661", "titulo": "Collserola 57"},
	{"id": "d3adcddf-bd95-4ebc-92f0-1e42018ed799", "titulo": "Collserola 91"},
	{"id": "f7d4e9ce-87a1-4f2a-a6d7-719413ae64ba", "titulo": "Dr Martí i Julià 44"},
	{"id": "ea39fcb7-b3d9-45df-a608-11ab5ace212d", "titulo": "Font 16"},
	{"id": "2218777f-b6c6-430e-8151-097b79ddcbc7", "titulo": "Font 9"},
	{"id": "27115cf5-5d13-48b4-80a5-a8218cd54d50", "titulo": "Garrofers 16"},
	{"id": "2973ff8e-7de4-4123-b025-4c5e3fbc502e", "titulo": "Illes Canàries 1"},
	{"id": "3cacc9ca-d118-4a0f-823b-cb322260fa78", "titulo": "Llevant 43"},
	{"id": "f36aaf9b-6f15-4b7c-94cf-e663267d9d03", "titulo": "Llorer 12"},
	{"id": "7af7a9a6-bad3-43a0-82a4-5a8a064bf57e", "titulo": "Llorer 55"},
	{"id": "17f83122-c726-4995-96c4-fd9e46dc7af2", "titulo": "Marcel·lí Esquius 45"},
	{"id": "564af182-5991-4905-8ef6-c0ab1ff7f947", "titulo": "Mare de Déu de Núria 23"},
	{"id": "0092b663-e777-45c9-86eb-b36d70e4ccba", "titulo": "Martí i Blasi 29"},
	{"id": "0d9de71e-07b2-4a06-b6ea-6ebe94ded50b", "titulo": "Mas 112"},
	{"id": "8b399c43-ed6c-4eb2-b912-61691c825c93", "titulo": "Mas 130"},
	{"id": "29568f64-120e-4959-a775-0908c824b6df", "titulo": "Mina 33"},
	{"id": "a39aef56-0a2b-44bf-a53c-f2a321370f13", "titulo": "Montseny 133"},
	{"id": "04510317-9344-40e5-8486-847123f4366d", "titulo": "Muses 6"},
	{"id": "d4636908-9214-410f-afb5-ba2b4ccc7626", "titulo": "Naranjos 2"},
	{"id": "26e0723a-c530-4bb6-afc6-d0e721378c74", "titulo": "París 68"},
	{"id": "706e62a2-cd2f-45e2-a92e-713479a97c27", "titulo": "París 72"},
	{"id": "823edc71-72dc-42bc-8e28-2d22a04c6870", "titulo": "Pedraforca 30"},
	{"id": "c8f342e1-06d7-4453-aea5-33f3315cb2be", "titulo": "Pubilla Cases 21"},
	{"id": "5a91d0dc-4f7c-4740-b558-f14d4a56b218", "titulo": "Pujòs 121"},
	{"id": "9bf50bc9-e3d7-4392-8ad6-ddb510926294", "titulo": "Pujòs 121 1"},
	{"id": "cc22c80d-f276-4efc-900c-d628c77c471f", "titulo": "Pujós 121 2"},
	{"id": "ef999aca-93d0-4354-9dd6-2c9e02833b03", "titulo": "Renclusa 60"},
	{"id": "d3df75aa-8055-4a15-9c9f-ddd82161752d", "titulo": "Renclusa 62"},
	{"id": "69a7140c-9318-4b7e-ae43-050817045383", "titulo": "Rosa d'alex. 20"},
	{"id": "35b4135c-496e-49a4-bf9e-c45d2b6b0b99", "titulo": "Rosa d'alex. 46"},
	{"id": "2051a0c2-76b4-4303-96ec-e6f5fd9943e8", "titulo": "Roses 8"},
	{"id": "ddf4f940-2b00-48d1-a61a-84378547f89b", "titulo": "Sant Francesc Xavier 17"},
	{"id": "59e20275-0588-4617-8371-3e77cf069bb8", "titulo": "Severo Ochoa 33"},
	{"id": "3c900f80-bb41-4667-b446-49cadb4ec86b", "titulo": "Teide 86"},
	{"id": "0b07a154-dba5-4b8a-92ba-5eb17445733b", "titulo": "Treball 2"},
]

# ==================================


def strip_accents(s: str) -> str:
	return "".join(
		c for c in unicodedata.normalize("NFD", s)
		if unicodedata.category(c) != "Mn"
	)


def normalize_title(s: str) -> str:
	"""
	Normaliza un título de propiedad para comparación:
	- Pasa a mayúsculas
	- Cambia L'H por LH
	- Se queda con "NOMBRE 123" antes de pisos/puertas
	- Quita acentos
	"""
	if not s:
		return ""
	s = str(s)
	s = s.upper().replace("L'H", "LH")
	m = re.match(r"^([A-ZÀ-Ü\.\s]+?\d+)", s)
	base = m.group(1) if m else s
	base = base.strip()
	base = strip_accents(base)
	return base


PROP_MAP = {normalize_title(p["titulo"]): p["id"] for p in PROPIEDADES}


def parse_euro(value) -> Optional[float]:
	if value is None:
		return None
	v = str(value).strip()
	if not v:
		return None
	if "€" in v:
		v = v.replace("€", "").strip()
	v = v.replace(".", "").replace(",", ".")
	try:
		return float(v)
	except ValueError:
		return None


def parse_date(value) -> Optional[str]:
	"""
	Devuelve fecha en formato YYYY-MM-DD o None.
	Acepta:
	- datetime / Timestamp
	- 'dd-mm-aa', 'dd/mm/aa'
	- 'dd-mm-aaaa', 'dd/mm/aaaa'
	- 'aaaa-mm-dd', 'aaaa-mm-dd hh:mm:ss'
	"""
	if value is None:
		return None

	# Si ya es datetime / Timestamp -> formateamos directo
	if isinstance(value, datetime):
		return value.strftime("%Y-%m-%d")

	v = str(value).strip()
	if not v:
		return None

	# Si viene con hora '2022-08-10 00:00:00', nos quedamos con la parte de fecha
	if " " in v:
		v_part = v.split(" ")[0]
	else:
		v_part = v

	# dd-mm-aa o dd/mm/aa
	m = re.match(r"^(\d{2})[-/](\d{2})[-/](\d{2})$", v_part)
	if m:
		dd, mm, yy = m.groups()
		yyyy = f"20{yy}"
		return f"{yyyy}-{mm}-{dd}"

	# dd-mm-aaaa o dd/mm/aaaa
	m = re.match(r"^(\d{2})[-/](\d{2})[-/](\d{4})$", v_part)
	if m:
		dd, mm, yyyy = m.groups()
		return f"{yyyy}-{mm}-{dd}"

	# aaaa-mm-dd
	m = re.match(r"^(\d{4})-(\d{2})-(\d{2})$", v_part)
	if m:
		yyyy, mm, dd = m.groups()
		return f"{yyyy}-{mm}-{dd}"

	# Último intento: que pandas lo intente parsear
	try:
		dt = pd.to_datetime(v_part, dayfirst=True, errors="raise")
		return dt.strftime("%Y-%m-%d")
	except Exception:
		return None


def map_autor_from_row(cells: list[str]) -> Optional[str]:
	joined = " ".join(cells).lower()
	if "blaster 50%-sanyus 50%" in joined:
		return "50%"
	if "sanyus" in joined:
		return "Sanyus"
	if "blaster" in joined or "hccb" in joined:
		return "Blaster"
	return None


def main():
	excel_path = Path(EXCEL_PATH)
	if not excel_path.exists():
		print(f"ERROR: No encuentro el fichero {excel_path}")
		return

	movimientos = {}  # clave (prop_id, concepto_upper, fecha) -> dict

	xls = pd.ExcelFile(excel_path)
	sheet_names = xls.sheet_names

	# Todas las hojas excepto las dos últimas (como dijiste)
	for sheet in sheet_names[:-2]:
		df = pd.read_excel(xls, sheet_name=sheet, header=None)

		if df.empty:
			continue

		# Propiedad en B1 (fila 0, col 1)
		prop_cell = df.iat[0, 1] if df.shape[1] > 1 else None
		prop_name_raw = str(prop_cell).strip() if prop_cell is not None else ""
		prop_id = PROP_MAP.get(normalize_title(prop_name_raw))

		# DEBUG opcional: ver qué propiedad se está leyendo
		# print(f"# Hoja {sheet}: '{prop_name_raw}' -> {prop_id}")

		# Recorremos desde la segunda fila (índice 1) en adelante
		for row_idx in range(1, df.shape[0]):
			row_vals = df.iloc[row_idx].tolist()
			row = [("" if pd.isna(v) else str(v)) for v in row_vals]

			concepto = row[1].strip() if len(row) > 1 else ""
			fecha = parse_date(row[3]) if len(row) > 3 else None

			# Sin concepto o sin fecha → no creamos movimiento (descarta totales/cabeceras)
			if not concepto or not fecha:
				continue

			importe_final = parse_euro(row[2]) if len(row) > 2 else None
			importe_estim = parse_euro(row[0]) if len(row) > 0 else None

			if importe_final is not None:
				importe = importe_final
				es_final = True
			elif importe_estim is not None:
				importe = importe_estim
				es_final = False
			else:
				continue

			extra_cells = row[4:] if len(row) > 4 else []
			autor = map_autor_from_row(extra_cells)

			key = (prop_id, concepto.strip().upper(), fecha)
			existing = movimientos.get(key)
			if existing:
				# Si ya teníamos uno, y este viene de col C (final) y el anterior no → lo sustituimos
				if es_final and not existing["es_final"]:
					movimientos[key] = {
						"concepto": concepto.strip(),
						"fecha": fecha,
						"importe": importe,
						"propiedad_id": prop_id,
						"autor": autor,
						"es_final": es_final,
					}
				# Si ambos son finales o ambos estimados, nos quedamos con el último
				else:
					movimientos[key] = {
						"concepto": concepto.strip(),
						"fecha": fecha,
						"importe": importe,
						"propiedad_id": prop_id,
						"autor": autor,
						"es_final": es_final,
					}
			else:
				movimientos[key] = {
					"concepto": concepto.strip(),
					"fecha": fecha,
					"importe": importe,
					"propiedad_id": prop_id,
					"autor": autor,
					"es_final": es_final,
				}

	rows = list(movimientos.values())

	print("-- Generado automáticamente desde HC CB & SANYUS CB.xlsx")
	print("-- Revisa antes de ejecutar en producción")
	print("insert into public.movimientos (concepto, fecha, importe, propiedad_id, tipo_movimiento, autor)")
	print("values")

	def sql_escape(s: str) -> str:
		return s.replace("'", "''")

	for i, m in enumerate(sorted(rows, key=lambda r: (r["fecha"], r["propiedad_id"] or "", r["concepto"]))):
		concepto = sql_escape(m["concepto"])
		fecha = m["fecha"]
		importe = f"{m['importe']:.2f}"
		prop_id = m["propiedad_id"]
		autor = m["autor"]

		line = "  ("
		line += f"'{concepto}', "
		line += f"'{fecha}', "
		line += f"{importe}, "
		if prop_id:
			line += f"'{prop_id}', "
		else:
			line += "null, "
		line += "'Gasto', "
		if autor:
			line += f"'{autor}'"
		else:
			line += "null"
		line += ")"
		if i < len(rows) - 1:
			line += ","
		else:
			line += ";"
		print(line)

	print(f"\n-- Total movimientos generados: {len(rows)}")


if __name__ == "__main__":
	main()