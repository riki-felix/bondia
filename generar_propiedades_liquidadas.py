#!/usr/bin/env python3
import pandas as pd
import re
import unicodedata
from pathlib import Path

# ============= CONFIG =============

EXCEL_PATH = "HC CB & SANYUS CB.xls"

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


def strip_accents(s: str) -> str:
	return "".join(
		c for c in unicodedata.normalize("NFD", s)
		if unicodedata.category(c) != "Mn"
	)


def normalize_title(s: str) -> str:
	"""
	Normaliza títulos de propiedades:
	- Mayúsculas
	- L'H -> LH
	- Nos quedamos con 'CALLE 123'
	- Sin acentos
	"""
	if not s:
		return ""
	s = str(s)
	s = s.upper().replace("L'H", "LH")
	# patrón: letras/puntos/espacios hasta el primer número
	m = re.match(r"^([A-ZÀ-Ü\.\s]+?\d+)", s)
	base = m.group(1) if m else s
	base = base.strip()
	base = strip_accents(base)
	return base


PROP_MAP = {normalize_title(p["titulo"]): p for p in PROPIEDADES}


def base_name_from_sheet(sheet_name: str) -> str:
	"""
	Quita 'LIQUIDADO', 'LIQUIDACIÓN', 'LIQUIDACION' del nombre de hoja
	y devuelve el nombre base para mapear con PROPIEDADES.
	"""
	s = str(sheet_name).upper()
	for token in ["LIQUIDADO", "LIQUIDACIÓN", "LIQUIDACION"]:
		s = s.replace(token, "")
	s = s.strip()
	return s


def main():
	excel_path = Path(EXCEL_PATH)
	if not excel_path.exists():
		print(f"ERROR: No encuentro el fichero {excel_path}")
		return

	xls = pd.ExcelFile(excel_path)
	sheet_names = xls.sheet_names

	resultados = []

	# ignoramos las dos últimas hojas como en los otros scripts
	for sheet in sheet_names[:-2]:
		sheet_up = sheet.upper()
		if not any(token in sheet_up for token in ["LIQUIDADO", "LIQUIDACIÓN", "LIQUIDACION"]):
			continue  # esta hoja no marca liquidado

		base = base_name_from_sheet(sheet)
		norm = normalize_title(base)
		prop_info = PROP_MAP.get(norm)

		if not prop_info:
			print(f"-- AVISO: Hoja '{sheet}' (base '{base}') no mapea a ninguna propiedad conocida (norm='{norm}')")
			continue

		resultados.append({
			"sheet": sheet,
			"base": base,
			"norm": norm,
			"prop_id": prop_info["id"],
			"prop_titulo": prop_info["titulo"],
		})

	print("-- Generado automáticamente desde HC CB & SANYUS CB.xlsx")
	print("-- Actualiza estado = 'liquidado' en public.propiedades")
	print("-- Revisa antes de ejecutar en producción\n")

	for r in resultados:
		print(f"-- Hoja: {r['sheet']} | Base: {r['base']} | Norm: {r['norm']} | Propiedad: {r['prop_titulo']}")
		print("update public.propiedades")
		print("set estado = 'liquidado'")
		print(f"where id = '{r['prop_id']}';\n")

	print(f"-- Total propiedades marcadas como 'liquidado': {len(resultados)}")


if __name__ == "__main__":
	main()