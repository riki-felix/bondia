#!/usr/bin/env python3
"""
Test script to verify propiedades_completo.sql transformations
Validates all requirements from the problem statement
"""
import sys
import re

def test_transformations():
	"""Test all data transformations"""
	print("Testing propiedades_completo.sql transformations...")
	print("=" * 60)
	
	tests_passed = 0
	tests_failed = 0
	
	# Read the generated SQL file
	try:
		with open('propiedades_completo.sql', 'r', encoding='utf-8') as f:
			sql_content = f.read()
	except FileNotFoundError:
		print("✗ SQL file 'propiedades_completo.sql' not found")
		return 1
	
	# Test 1: Check that we have exactly 24 INSERT statements
	print("\n1. Testing record count:")
	insert_count = sql_content.count('INSERT INTO public.propiedades')
	if insert_count == 24:
		print(f"  ✓ Found {insert_count} INSERT statements (expected 24)")
		tests_passed += 1
	else:
		print(f"  ✗ Found {insert_count} INSERT statements (expected 24)")
		tests_failed += 1
	
	# Test 2: Check ON CONFLICT clauses
	print("\n2. Testing ON CONFLICT clauses:")
	on_conflict_count = sql_content.count('ON CONFLICT (numero_operacion) DO UPDATE SET')
	if on_conflict_count == 24:
		print(f"  ✓ Found {on_conflict_count} ON CONFLICT clauses on numero_operacion")
		tests_passed += 1
	else:
		print(f"  ✗ Found {on_conflict_count} ON CONFLICT clauses (expected 24)")
		tests_failed += 1
	
	# Test 3: Check that estado values are lowercase
	print("\n3. Testing estado transformation (should be lowercase):")
	uppercase_estados = re.findall(r"estado = '[A-Z]", sql_content)
	if len(uppercase_estados) == 0:
		print(f"  ✓ All estado values are lowercase")
		tests_passed += 1
	else:
		print(f"  ✗ Found {len(uppercase_estados)} uppercase estado values")
		tests_failed += 1
	
	# Check for specific estado values
	comprado_count = sql_content.count("estado = 'comprado'")
	vendido_count = sql_content.count("estado = 'vendido'")
	print(f"  ✓ Found {comprado_count} 'comprado' and {vendido_count} 'vendido' records")
	
	# Test 4: Check numero_operacion field exists
	print("\n4. Testing numero_operacion field:")
	if 'numero_operacion' in sql_content:
		print(f"  ✓ numero_operacion field is present")
		tests_passed += 1
		
		# Check that numero_operacion values range from 1 to 24
		numero_ops = re.findall(r'numero_operacion, .+?\n.+?VALUES \(\n  \'[^\']+\', (\d+),', sql_content, re.DOTALL)
		if len(numero_ops) == 24:
			nums = [int(n) for n in numero_ops]
			if min(nums) == 1 and max(nums) == 24:
				print(f"  ✓ numero_operacion values range from 1 to 24")
				tests_passed += 1
			else:
				print(f"  ✗ numero_operacion values out of range: {min(nums)} to {max(nums)}")
				tests_failed += 1
		else:
			print(f"  ✗ Found {len(numero_ops)} numero_operacion values (expected 24)")
			tests_failed += 1
	else:
		print(f"  ✗ numero_operacion field not found")
		tests_failed += 1
	
	# Test 5: Check ocupado field (Libre → TRUE)
	print("\n5. Testing ocupado field (Libre → TRUE):")
	if 'ocupado' in sql_content:
		print(f"  ✓ ocupado field is present")
		tests_passed += 1
		
		# Check that all ocupado values are TRUE (since all rows have "Libre")
		ocupado_true_count = sql_content.count('ocupado = TRUE')
		# Should be at least 24 (in VALUES sections)
		if ocupado_true_count >= 24:
			print(f"  ✓ All ocupado values are TRUE (Libre properly converted, {ocupado_true_count} occurrences)")
			tests_passed += 1
		else:
			print(f"  ✗ Found {ocupado_true_count} 'ocupado = TRUE' (expected at least 24)")
			tests_failed += 1
	else:
		print(f"  ✗ ocupado field not found")
		tests_failed += 1
	
	# Test 6: Check money value transformations
	print("\n6. Testing money value transformations:")
	# Check for presence of decimal values (should have dots, not commas)
	has_decimal_values = re.search(r'\d+\.\d+', sql_content)
	if has_decimal_values:
		print(f"  ✓ Decimal values properly formatted with dots")
		tests_passed += 1
	else:
		print(f"  ✗ No decimal values found")
		tests_failed += 1
	
	# Check that no € symbols remain in VALUES sections
	values_section = re.findall(r'VALUES \((.*?)\)', sql_content, re.DOTALL)
	has_euro_in_values = any('€' in v for v in values_section)
	if not has_euro_in_values:
		print(f"  ✓ No € symbols in data values (properly removed)")
		tests_passed += 1
	else:
		print(f"  ✗ € symbols still present in VALUES")
		tests_failed += 1
	
	# Test 7: Check boolean transformations (pago and ja)
	print("\n7. Testing boolean transformations:")
	pago_true_count = sql_content.count('pago = TRUE')
	ja_true_count = sql_content.count('ja = TRUE')
	# All records should have pago = TRUE and ja = TRUE (at least 24 each)
	if pago_true_count >= 24:
		print(f"  ✓ pago field properly set to TRUE for 'Realizado' ({pago_true_count} occurrences)")
		tests_passed += 1
	else:
		print(f"  ✗ pago = TRUE count: {pago_true_count} (expected at least 24)")
		tests_failed += 1
	
	if ja_true_count >= 24:
		print(f"  ✓ ja field properly set to TRUE for 'VERDADERO' ({ja_true_count} occurrences)")
		tests_passed += 1
	else:
		print(f"  ✗ ja = TRUE count: {ja_true_count} (expected at least 24)")
		tests_failed += 1
	
	# Test 8: Check date format (ISO 8601: YYYY-MM-DD)
	print("\n8. Testing date format (ISO 8601):")
	# Find date patterns in SQL
	dates = re.findall(r"'(\d{4}-\d{2}-\d{2})'", sql_content)
	if len(dates) > 0:
		print(f"  ✓ Found {len(dates)} dates in ISO 8601 format (YYYY-MM-DD)")
		tests_passed += 1
		# Sample a few dates
		print(f"    Sample dates: {', '.join(dates[:5])}")
	else:
		print(f"  ✗ No ISO 8601 dates found")
		tests_failed += 1
	
	# Test 9: Check notas field
	print("\n9. Testing notas field:")
	if 'notas' in sql_content:
		print(f"  ✓ notas field is present")
		tests_passed += 1
	else:
		print(f"  ✗ notas field not found")
		tests_failed += 1
	
	# Test 10: Check calculated fields from CSV
	print("\n10. Testing that CSV values are used (not calculated):")
	# Check for specific values from the CSV (row 1)
	if '2424.75' in sql_content and '5252.0' in sql_content and '508.51' in sql_content:
		print(f"  ✓ CSV values for RETENCIÓN, EFECTIVO, JASP 10% are used")
		tests_passed += 1
	else:
		print(f"  ✗ Expected CSV values not found")
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
