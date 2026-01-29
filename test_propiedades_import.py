#!/usr/bin/env python3
"""
Test script to verify "Sin título 3.csv" to SQL transformations
Validates that NOMBRE maps to titulo and PAGO="Realizado" maps to TRUE
"""
import sys

def test_transformations():
	"""Test all data transformations"""
	print("Testing Sin título 3.csv transformations...")
	print("=" * 60)
	
	tests_passed = 0
	tests_failed = 0
	
	# Test 1: Money value transformation
	print("\n1. Testing money value transformation:")
	test_cases = [
		("25.000,00 €", 25000.0),
		("35.000,00 €", 35000.0),
		("28.000,00 €", 28000.0),
	]
	for input_val, expected in test_cases:
		# Remove € and spaces, then . for thousands, then , to .
		result = float(input_val.replace("€", "").strip().replace(".", "").replace(",", "."))
		if result == expected:
			print(f"  ✓ '{input_val}' → {result}")
			tests_passed += 1
		else:
			print(f"  ✗ '{input_val}' → {result} (expected {expected})")
			tests_failed += 1
	
	# Test 2: Boolean transformation for PAGO
	print("\n2. Testing PAGO boolean transformation:")
	pago_tests = [
		("Realizado", True),
		("", False),
	]
	for input_val, expected in pago_tests:
		result = input_val.strip().upper() == "REALIZADO"
		if result == expected:
			print(f"  ✓ PAGO: '{input_val}' → {result}")
			tests_passed += 1
		else:
			print(f"  ✗ PAGO: '{input_val}' → {result} (expected {expected})")
			tests_failed += 1
	
	# Test 3: Boolean transformation for JA
	print("\n3. Testing JA boolean transformation:")
	ja_tests = [
		("VERDADERO", True),
		("", False),
	]
	for input_val, expected in ja_tests:
		result = input_val.strip().upper() == "VERDADERO"
		if result == expected:
			print(f"  ✓ JA: '{input_val}' → {result}")
			tests_passed += 1
		else:
			print(f"  ✗ JA: '{input_val}' → {result} (expected {expected})")
			tests_failed += 1
	
	# Test 4: Calculated fields
	print("\n4. Testing calculated fields:")
	retribucion = 35000.0
	ingreso_banco = 28000.0
	
	# retencion = 19% of retribucion
	retencion = round(retribucion * 0.19, 2)
	expected_retencion = 6650.0
	if retencion == expected_retencion:
		print(f"  ✓ retencion (19% of {retribucion}) = {retencion}")
		tests_passed += 1
	else:
		print(f"  ✗ retencion = {retencion} (expected {expected_retencion})")
		tests_failed += 1
	
	# efectivo = retribucion - retencion - ingreso_banco
	efectivo = round(retribucion - retencion - ingreso_banco, 2)
	expected_efectivo = 350.0
	if efectivo == expected_efectivo:
		print(f"  ✓ efectivo ({retribucion} - {retencion} - {ingreso_banco}) = {efectivo}")
		tests_passed += 1
	else:
		print(f"  ✗ efectivo = {efectivo} (expected {expected_efectivo})")
		tests_failed += 1
	
	# jasp_10_percent = 10% of ingreso_banco
	jasp_10_percent = round(ingreso_banco * 0.10, 2)
	expected_jasp = 2800.0
	if jasp_10_percent == expected_jasp:
		print(f"  ✓ jasp_10_percent (10% of {ingreso_banco}) = {jasp_10_percent}")
		tests_passed += 1
	else:
		print(f"  ✗ jasp_10_percent = {jasp_10_percent} (expected {expected_jasp})")
		tests_failed += 1
	
	# Test 5: SQL file validation
	print("\n5. Testing generated SQL file:")
	try:
		with open('propiedades_import.sql', 'r') as f:
			sql_content = f.read()
		
		# Check for INSERT statements (should be 5 based on CSV)
		insert_count = sql_content.count('INSERT INTO public.propiedades')
		if insert_count == 5:
			print(f"  ✓ Found {insert_count} INSERT statements")
			tests_passed += 1
		else:
			print(f"  ✗ Found {insert_count} INSERT statements (expected 5)")
			tests_failed += 1
		
		# Check for ON CONFLICT
		on_conflict_count = sql_content.count('ON CONFLICT (id) DO UPDATE SET')
		if on_conflict_count == 5:
			print(f"  ✓ Found {on_conflict_count} ON CONFLICT clauses")
			tests_passed += 1
		else:
			print(f"  ✗ Found {on_conflict_count} ON CONFLICT clauses (expected 5)")
			tests_failed += 1
		
		# Check that NOMBRE maps to titulo (not nombre)
		if 'titulo =' in sql_content and 'nombre =' not in sql_content:
			print(f"  ✓ NOMBRE correctly mapped to 'titulo' column")
			tests_passed += 1
		else:
			print(f"  ✗ Column mapping error: should use 'titulo' not 'nombre'")
			tests_failed += 1
		
		# Check for proper numeric values (not NULL for first property)
		if '25000.0' in sql_content and '35000.0' in sql_content:
			print(f"  ✓ Numeric values properly converted")
			tests_passed += 1
		else:
			print(f"  ✗ Numeric values not found in SQL")
			tests_failed += 1
		
		# Check for calculated fields
		if '6650.0' in sql_content and '350.0' in sql_content and '2800.0' in sql_content:
			print(f"  ✓ Calculated fields present in SQL")
			tests_passed += 1
		else:
			print(f"  ✗ Calculated fields not found in SQL")
			tests_failed += 1
		
		# Check that Abedul 6 property is in the file
		if 'Abedul 6' in sql_content:
			print(f"  ✓ Property 'Abedul 6' found in SQL")
			tests_passed += 1
		else:
			print(f"  ✗ Property 'Abedul 6' not found in SQL")
			tests_failed += 1
			
	except FileNotFoundError:
		print(f"  ✗ SQL file not found")
		tests_failed += 1
	
	# Summary
	print("\n" + "=" * 60)
	print(f"Tests passed: {tests_passed}")
	print(f"Tests failed: {tests_failed}")
	print("=" * 60)
	
	if tests_failed == 0:
		print("✓ All tests passed!")
		return 0
	else:
		print("✗ Some tests failed")
		return 1

if __name__ == "__main__":
	sys.exit(test_transformations())
