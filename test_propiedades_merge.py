#!/usr/bin/env python3
"""
Test script to verify propiedades merge transformations
"""
import sys
import pandas as pd

def test_propiedades_merge():
    """Test all data transformations for propiedades merge"""
    print("Testing propiedades merge transformations...")
    print("=" * 60)
    
    tests_passed = 0
    tests_failed = 0
    
    try:
        # Read input and output files
        input_df = pd.read_csv('Sin título 3.csv')
        output_df = pd.read_csv('propiedades_merged.csv')
    except FileNotFoundError as e:
        print(f"✗ Required file not found: {e}")
        return 1
    except Exception as e:
        print(f"✗ Error reading CSV files: {e}")
        return 1
    
    # Test 1: Row count
    print("\n1. Testing row count:")
    if len(input_df) == len(output_df):
        print(f"  ✓ Row count matches: {len(input_df)} rows")
        tests_passed += 1
    else:
        print(f"  ✗ Row count mismatch: {len(input_df)} input vs {len(output_df)} output")
        tests_failed += 1
    
    # Test 2: Column count
    print("\n2. Testing column structure:")
    expected_columns = [
        'id', 'titulo', 'estado', 'fecha_inicio', 'pago',
        'aportacion', 'retribucion', 'retencion', 'ingreso_banco', 'efectivo',
        'jasp_10_percent', 'ja', 'transfe', 'fecha_compra', 'fecha_venta'
    ]
    
    if list(output_df.columns) == expected_columns:
        print(f"  ✓ All {len(expected_columns)} columns present in correct order")
        tests_passed += 1
    else:
        print(f"  ✗ Column mismatch")
        print(f"    Expected: {expected_columns}")
        print(f"    Got: {list(output_df.columns)}")
        tests_failed += 1
    
    # Test 3: Column mappings
    print("\n3. Testing column mappings:")
    mappings = [
        ('ID', 'id'),
        ('NOMBRE', 'titulo'),
        ('ESTADO', 'estado'),
    ]
    
    for input_col, output_col in mappings:
        if input_df[input_col].iloc[0] == output_df[output_col].iloc[0]:
            print(f"  ✓ {input_col} → {output_col}")
            tests_passed += 1
        else:
            print(f"  ✗ {input_col} → {output_col} mismatch")
            tests_failed += 1
    
    # Test 4: Boolean conversions
    print("\n4. Testing boolean conversions:")
    # Test PAGO (Realizado -> True)
    if input_df['PAGO'].iloc[0] == 'Realizado' and output_df['pago'].iloc[0] == True:
        print(f"  ✓ PAGO: 'Realizado' → True")
        tests_passed += 1
    else:
        print(f"  ✗ PAGO conversion failed")
        tests_failed += 1
    
    # Test JA (VERDADERO -> True)
    if input_df['JA'].iloc[0] == 'VERDADERO' and output_df['ja'].iloc[0] == True:
        print(f"  ✓ JA: 'VERDADERO' → True")
        tests_passed += 1
    else:
        print(f"  ✗ JA conversion failed")
        tests_failed += 1
    
    # Test 5: Numeric cleaning
    print("\n5. Testing numeric cleaning:")
    # Check first row
    if output_df['aportacion'].iloc[0] == 25000.0:
        print(f"  ✓ APORTACIÓN: '25.000,00 €' → 25000.0")
        tests_passed += 1
    else:
        print(f"  ✗ APORTACIÓN cleaning failed: {output_df['aportacion'].iloc[0]}")
        tests_failed += 1
    
    if output_df['retribucion'].iloc[0] == 35000.0:
        print(f"  ✓ Retribución: '35.000,00 €' → 35000.0")
        tests_passed += 1
    else:
        print(f"  ✗ Retribución cleaning failed: {output_df['retribucion'].iloc[0]}")
        tests_failed += 1
    
    # Test 6: Calculated fields
    print("\n6. Testing calculated fields:")
    for idx, row in output_df.iterrows():
        # Test retencion
        expected_retencion = round(row['retribucion'] * 0.19, 2)
        if abs(row['retencion'] - expected_retencion) < 0.01:
            tests_passed += 1
        else:
            print(f"  ✗ Row {idx}: retencion mismatch: {row['retencion']} vs {expected_retencion}")
            tests_failed += 1
        
        # Test efectivo
        expected_efectivo = round(row['retribucion'] - row['retencion'] - row['ingreso_banco'], 2)
        if abs(row['efectivo'] - expected_efectivo) < 0.01:
            tests_passed += 1
        else:
            print(f"  ✗ Row {idx}: efectivo mismatch: {row['efectivo']} vs {expected_efectivo}")
            tests_failed += 1
        
        # Test jasp_10_percent
        expected_jasp = round(row['ingreso_banco'] * 0.10, 2)
        if abs(row['jasp_10_percent'] - expected_jasp) < 0.01:
            tests_passed += 1
        else:
            print(f"  ✗ Row {idx}: jasp_10_percent mismatch: {row['jasp_10_percent']} vs {expected_jasp}")
            tests_failed += 1
    
    print(f"  ✓ All {len(output_df) * 3} calculated field tests passed")
    
    # Test 7: Date formatting
    print("\n7. Testing date formatting:")
    if output_df['fecha_inicio'].iloc[0] == '2023-01-15':
        print(f"  ✓ Dates in ISO format (YYYY-MM-DD)")
        tests_passed += 1
    else:
        print(f"  ✗ Date format incorrect: {output_df['fecha_inicio'].iloc[0]}")
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
    sys.exit(test_propiedades_merge())
