# --- START OF FILE patient_encryption_with_PSI.py (FINAL CLEAN VERSION) ---
import tenseal as ts
import hashlib
from bson.binary import Binary

from db_connection import db_connection

# ===============================
# Utility Functions
# ===============================
def hash_text(text: str) -> str:
    """Hash text using SHA-256 for PSI comparison."""
    return hashlib.sha256(str(text).encode()).hexdigest()

def encrypt_vector(context, value):
    """Encrypt a single value as BFV vector after hashing to int."""
    try:
        plain_modulus = 65537
        hashed_int = int(hash_text(str(value)), 16) % plain_modulus
        encrypted_val = ts.bfv_vector(context, [hashed_int])
        return encrypted_val
    except Exception as e:
        print(f"Encryption error for value '{value}': {e}")
        return None

def load_context():
    """Load TenSEAL public key context."""
    with open("public_key.txt", "rb") as f:
        return ts.context_from(f.read())

# ===============================
# Main Patient Record Updater
# ===============================
def update_patient_record(record: dict, collection_name: str = "patients"):
    """Encrypt patient data and insert/update record in the given MongoDB collection."""
    context = load_context()
    patients_collection = db_connection.get_collection(collection_name)

    nic_plain = str(record["NIC"])
    nic_hashed = hash_text(nic_plain)

    # Encrypt sensitive fields
    encrypted_nic = encrypt_vector(context, nic_plain)
    encrypted_name = encrypt_vector(context, record["Name"])
    encrypted_address = encrypt_vector(context, record["Address"])

    if not all([encrypted_name, encrypted_address, encrypted_nic]):
        print("❌ Encryption failed for one or more fields. Record not saved.")
        return

    patient_document = {
        "NIC_Hashed": nic_hashed,
        "NIC_Encrypted": Binary(encrypted_nic.serialize()),
        "Name_Encrypted": Binary(encrypted_name.serialize()),
        "Address_Encrypted": Binary(encrypted_address.serialize()),
        "gender": record["gender"],
        "age": record["age"],
        "hypertension": record["hypertension"],
        "heart_disease": record["heart_disease"],
        "bmi": record["bmi"],
        "HbA1c_level": record["HbA1c_level"],
        "blood_glucose_level": record["blood_glucose_level"],
        "diabetes": record["diabetes"]
    }

    # Upsert into MongoDB using NIC_Hashed
    result = patients_collection.find_one_and_update(
        {"NIC_Hashed": nic_hashed},
        {"$set": patient_document},
        upsert=True
    )

    if result:
        print(f"🔄 Existing record for NIC {nic_plain} updated in MongoDB.")
    else:
        print(f"✅ New record for NIC {nic_plain} inserted into MongoDB.")

    print("📦 Database operation complete.")

# --- END OF FILE patient_encryption_with_PSI.py (FINAL CLEAN VERSION) ---
