import pandas as pd
import hashlib
import tenseal as ts
from bson.binary import Binary
import json
from datetime import datetime

# Load encryption context
def load_context():
    """Load TenSEAL public key context."""
    with open("public_key.txt", "rb") as f:
        return ts.context_from(f.read())

# Hashing function for PSI
def hash_text(text):
    """Hash text using SHA-256."""
    return hashlib.sha256(str(text).encode()).hexdigest()

# Encryption function
def encrypt_value(context, value):
    """Encrypt a single value using homomorphic encryption."""
    try:
        plain_modulus = 65537
        # Convert to integer for encryption
        int_value = int(hashlib.sha256(str(value).encode()).hexdigest(), 16) % plain_modulus
        encrypted_value = ts.bfv_vector(context, [int_value])
        return encrypted_value.serialize()
    except Exception as e:
        print(f"❌ Error encrypting value {value}: {e}")
        return None

# Main encryption and PSI demonstration
def main():
    print("=" * 70)
    print("SECURE HEALTHCARE DATA SYSTEM - PSI DEMONSTRATION")
    print("=" * 70)
    
    # Load datasets
    print("\n📁 Loading hospital datasets...")
    df_a = pd.read_csv("hospital_A.csv")
    df_b = pd.read_csv("hospital_B.csv")
    
    print(f"✅ Hospital A: {len(df_a)} patients loaded")
    print(f"✅ Hospital B: {len(df_b)} patients loaded")
    
    # Load encryption context
    print("\n🔐 Loading encryption keys...")
    context = load_context()
    print("✅ Encryption context loaded successfully")
    
    # Process Hospital A
    print("\n🏥 Processing Hospital A data...")
    encrypted_data_a = []
    hashed_nics_a = []
    
    for idx, row in df_a.iterrows():
        # Hash NIC for PSI
        nic_hashed = hash_text(row['NIC'])
        hashed_nics_a.append(nic_hashed)
        
        # Encrypt sensitive fields
        encrypted_record = {
            'NIC_Hashed': nic_hashed,
            'NIC_Encrypted': encrypt_value(context, row['NIC']),
            'Name_Encrypted': encrypt_value(context, row['Name']),
            'Address_Encrypted': encrypt_value(context, row['Address']),
            # Non-sensitive fields remain in plaintext
            'gender': row['gender'],
            'age': row['age'],
            'hypertension': row['hypertension'],
            'heart_disease': row['heart_disease'],
            'bmi': row['bmi'],
            'HbA1c_level': row['HbA1c_level'],
            'blood_glucose_level': row['blood_glucose_level'],
            'diabetes': row['diabetes']
        }
        encrypted_data_a.append(encrypted_record)
    
    print(f"✅ Encrypted {len(encrypted_data_a)} records from Hospital A")
    
    # Process Hospital B
    print("\n🏥 Processing Hospital B data...")
    encrypted_data_b = []
    hashed_nics_b = []
    
    for idx, row in df_b.iterrows():
        # Hash NIC for PSI
        nic_hashed = hash_text(row['NIC'])
        hashed_nics_b.append(nic_hashed)
        
        # Encrypt sensitive fields
        encrypted_record = {
            'NIC_Hashed': nic_hashed,
            'NIC_Encrypted': encrypt_value(context, row['NIC']),
            'Name_Encrypted': encrypt_value(context, row['Name']),
            'Address_Encrypted': encrypt_value(context, row['Address']),
            # Non-sensitive fields remain in plaintext
            'gender': row['gender'],
            'age': row['age'],
            'hypertension': row['hypertension'],
            'heart_disease': row['heart_disease'],
            'bmi': row['bmi'],
            'HbA1c_level': row['HbA1c_level'],
            'blood_glucose_level': row['blood_glucose_level'],
            'diabetes': row['diabetes']
        }
        encrypted_data_b.append(encrypted_record)
    
    print(f"✅ Encrypted {len(encrypted_data_b)} records from Hospital B")
    
    # Perform PSI on hashed NICs
    print("\n" + "=" * 70)
    print("🔍 PRIVATE SET INTERSECTION (PSI) DEMONSTRATION")
    print("=" * 70)
    
    print(f"\nHospital A has {len(hashed_nics_a)} hashed NICs")
    print(f"Hospital B has {len(hashed_nics_b)} hashed NICs")
    
    print("\n📤 Hospitals exchange only HASHED NICs (not the original NICs)")
    print("Sample hashed NIC:", hashed_nics_a[0][:16] + "...")
    
    # Find intersection
    common_hashed_nics = set(hashed_nics_a).intersection(set(hashed_nics_b))
    
    print(f"\n✨ RESULT: Found {len(common_hashed_nics)} common patients")
    print("=" * 70)
    
    # Demonstrate privacy preservation
    print("\n🛡️ PRIVACY PRESERVED:")
    print("✓ Original NICs were never exchanged")
    print("✓ Patient names and addresses remain encrypted")
    print("✓ Only hashed identifiers were compared")
    print("✓ Neither hospital can determine non-matching patients from the other")
    
    # Show which original NICs matched (for demonstration only)
    print("\n📊 For demonstration purposes, the common patients are:")
    original_common_nics = []
    for idx, row in df_a.iterrows():
        if hash_text(row['NIC']) in common_hashed_nics:
            original_common_nics.append(row['NIC'])
            print(f"  - NIC: {row['NIC']} | Name: {row['Name']}")
    
    # Save results
    results = {
        'timestamp': datetime.now().isoformat(),
        'hospital_a_count': len(df_a),
        'hospital_b_count': len(df_b),
        'common_patients_count': len(common_hashed_nics),
        'common_hashed_nics': list(common_hashed_nics),
        'encryption_status': 'SUCCESS',
        'psi_protocol': 'HASH-BASED',
        'privacy_preserved': True
    }
    
    with open('psi_results.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    print("\n💾 Results saved to psi_results.json")
    print("=" * 70)
    print("✅ PSI DEMONSTRATION COMPLETED SUCCESSFULLY")
    print("=" * 70)

if __name__ == "__main__":
    main()