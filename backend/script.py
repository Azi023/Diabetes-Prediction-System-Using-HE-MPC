from pymongo import MongoClient
import os
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

# Get MongoDB Atlas connection string
connection_string = os.getenv("MONGODB_CONNECTION_STRING")
if not connection_string:
    print("❌ MONGODB_CONNECTION_STRING not found in .env file")
    exit(1)

# MongoDB Atlas Connection
client = MongoClient(connection_string)
db = client['SecureHealthDB']

# Check Hospital A
col_a = db['hospital_a_patients']
sample_a = col_a.find_one()
if sample_a:
    print("Hospital A fields:", list(sample_a.keys()))
    print("NIC_Hashed exists:", 'NIC_Hashed' in sample_a)
else:
    print("No documents in Hospital A")

# Check Hospital B
col_b = db['hospital_b_patients']
sample_b = col_b.find_one()
if sample_b:
    print("Hospital B fields:", list(sample_b.keys()))
    print("NIC_Hashed exists:", 'NIC_Hashed' in sample_b)
else:
    print("No documents in Hospital B")

# Count documents
print(f"\nHospital A count: {col_a.count_documents({})}")
print(f"Hospital B count: {col_b.count_documents({})}")
