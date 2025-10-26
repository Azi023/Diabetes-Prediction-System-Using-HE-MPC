# encrypt_and_upload.py
import pandas as pd
import tenseal as ts
from pymongo import MongoClient
from bson.binary import Binary
import hashlib
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Use the same connection string as db_connection.py
connection_string = os.getenv("MONGODB_CONNECTION_STRING")
if not connection_string:
    print("❌ MONGODB_CONNECTION_STRING not found in .env file")
    exit(1)

# MongoDB connection
client = MongoClient(connection_string)
db = client['SecureHealthDB']

def encrypt_value(context, value, plain_modulus: int = 65537) -> bytes:
    """
    Hash -> map to BFV integer slot -> encrypt -> serialize to bytes.
    """
    hashed_int = int(hashlib.sha256(str(value).encode()).hexdigest(), 16) % plain_modulus
    ct = ts.bfv_vector(context, [hashed_int])
    return ct.serialize()

def upload_encrypted_data():
    """Upload encrypted data to MongoDB"""
    
    # Load context
    with open("public_key.txt", "rb") as f:
        context = ts.context_from(f.read())
    
    # Process both hospitals
    for hospital in ['A', 'B']:
        collection_name = f'hospital_{hospital.lower()}_patients'
        collection = db[collection_name]
        
        # Clear existing data
        collection.delete_many({})
        
        # Load CSV
        df = pd.read_csv(f'hospital_{hospital}.csv')
        
        print(f"\nProcessing Hospital {hospital}...")
        
        for idx, row in df.iterrows():
            # Hash NIC
            nic_hashed = hashlib.sha256(str(row['NIC']).encode()).hexdigest()
            
            # Encrypt sensitive fields
            plain_modulus = 65537
            
            # Encrypt NIC
            nic_int = int(hashlib.sha256(str(row['NIC']).encode()).hexdigest(), 16) % plain_modulus
            nic_encrypted = ts.bfv_vector(context, [nic_int])
            
            # Encrypt Name
            name_int = int(hashlib.sha256(str(row['Name']).encode()).hexdigest(), 16) % plain_modulus
            name_encrypted = ts.bfv_vector(context, [name_int])
            
            # Encrypt Address
            addr_int = int(hashlib.sha256(str(row['Address']).encode()).hexdigest(), 16) % plain_modulus
            addr_encrypted = ts.bfv_vector(context, [addr_int])
            
            # Create document
            document = {
                # NO RAW NIC! Only hashed version
                'NIC_Hashed': nic_hashed,
                'NIC_Encrypted': Binary(encrypt_value(context, row['NIC'])),
                'Name_Encrypted': Binary(encrypt_value(context, row['Name'])),
                'Address_Encrypted': Binary(encrypt_value(context, row['Address'])),
                # Medical data remains in plaintext for MPC operations
                'gender': int(row['gender']),
                'age': int(row['age']),
                'hypertension': int(row['hypertension']),
                'heart_disease': int(row['heart_disease']),
                'bmi': float(row['bmi']),
                'HbA1c_level': float(row['HbA1c_level']),
                'blood_glucose_level': int(row['blood_glucose_level']),
                'diabetes': int(row['diabetes'])
            }
            
            collection.insert_one(document)
        
        print(f"✅ Uploaded {len(df)} encrypted records to {collection_name}")
    
    print("\n🎯 All data successfully uploaded to MongoDB!")
    
    # Verify common patients
    col_a = db['hospital_a_patients']
    col_b = db['hospital_b_patients']
    
    hashes_a = set([doc['NIC_Hashed'] for doc in col_a.find({}, {'NIC_Hashed': 1})])
    hashes_b = set([doc['NIC_Hashed'] for doc in col_b.find({}, {'NIC_Hashed': 1})])
    
    common = hashes_a.intersection(hashes_b)
    print(f"\n📊 Verification: {len(common)} common patients found via PSI on encrypted data")

if __name__ == "__main__":
    upload_encrypted_data()