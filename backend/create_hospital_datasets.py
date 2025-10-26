import pandas as pd
import random
from datetime import datetime

# Create 10 common NICs that will be in both hospitals
common_nics = [
    "199012345V", "199123456V", "199234567V", "199345678V", "199456789V",
    "199567890V", "199678901V", "199789012V", "199890123V", "199901234V"
]

# Create 40 unique NICs for Hospital A
hospital_a_unique_nics = [f"200{i:06d}V" for i in range(100001, 100041)]

# Combine all NICs for Hospital A (10 common + 40 unique = 50 total)
hospital_a_nics = common_nics + hospital_a_unique_nics

# Common data for common patients (to maintain consistency)
common_patients_data = {
    "199012345V": {"Name": "John Smith", "Address": "123 Main Street, Colombo"},
    "199123456V": {"Name": "Sarah Johnson", "Address": "456 Park Road, Kandy"},
    "199234567V": {"Name": "Michael Brown", "Address": "789 Lake View, Galle"},
    "199345678V": {"Name": "Emily Davis", "Address": "321 Hill Street, Negombo"},
    "199456789V": {"Name": "James Wilson", "Address": "654 Beach Road, Matara"},
    "199567890V": {"Name": "Maria Garcia", "Address": "987 Garden Lane, Jaffna"},
    "199678901V": {"Name": "Robert Taylor", "Address": "147 Temple Road, Anuradhapura"},
    "199789012V": {"Name": "Lisa Anderson", "Address": "258 River View, Ratnapura"},
    "199890123V": {"Name": "David Martinez", "Address": "369 Mountain Road, Badulla"},
    "199901234V": {"Name": "Jennifer Lee", "Address": "741 Forest Lane, Kurunegala"}
}

# Generate Hospital A data
hospital_a_data = []

for i, nic in enumerate(hospital_a_nics):
    if nic in common_patients_data:
        # Use common patient data
        name = common_patients_data[nic]["Name"]
        address = common_patients_data[nic]["Address"]
    else:
        # Generate unique patient data
        first_names = ["Alex", "Brian", "Carol", "Diana", "Edward", "Fiona", "George", "Helen", "Ivan", "Julia"]
        last_names = ["White", "Black", "Green", "Blue", "Yellow", "Purple", "Orange", "Pink", "Gray", "Brown"]
        name = f"{random.choice(first_names)} {random.choice(last_names)}"
        address = f"{random.randint(1, 999)} {random.choice(['Street', 'Road', 'Lane', 'Avenue'])}, Colombo"
    
    patient = {
        "NIC": nic,
        "Name": name,
        "Address": address,
        "gender": random.randint(0, 1),
        "age": random.randint(20, 80),
        "hypertension": random.randint(0, 1),
        "heart_disease": random.randint(0, 1),
        "bmi": round(random.uniform(18.5, 35.0), 2),
        "HbA1c_level": round(random.uniform(4.0, 9.0), 1),
        "blood_glucose_level": random.randint(80, 300),
        "diabetes": random.randint(0, 1),
        "Outcome": random.randint(0, 1)
    }
    hospital_a_data.append(patient)

df_a = pd.DataFrame(hospital_a_data)
df_a.to_csv("hospital_A.csv", index=False)
print(f"✅ Hospital A dataset created with {len(df_a)} patients")



# Create 40 unique NICs for Hospital B
hospital_b_unique_nics = [f"200{i:06d}V" for i in range(200001, 200041)]

# Combine all NICs for Hospital B (10 common + 40 unique = 50 total)
hospital_b_nics = common_nics + hospital_b_unique_nics

# Generate Hospital B data
hospital_b_data = []

for i, nic in enumerate(hospital_b_nics):
    if nic in common_patients_data:
        # Use common patient data (same as Hospital A for these NICs)
        name = common_patients_data[nic]["Name"]
        address = common_patients_data[nic]["Address"]
    else:
        # Generate unique patient data
        first_names = ["Kevin", "Laura", "Mark", "Nancy", "Oscar", "Patricia", "Quinn", "Rachel", "Steven", "Tina"]
        last_names = ["Stone", "Wood", "River", "Sky", "Moon", "Sun", "Star", "Cloud", "Rain", "Snow"]
        name = f"{random.choice(first_names)} {random.choice(last_names)}"
        address = f"{random.randint(1, 999)} {random.choice(['Street', 'Road', 'Lane', 'Avenue'])}, Kandy"
    
    patient = {
        "NIC": nic,
        "Name": name,
        "Address": address,
        "gender": random.randint(0, 1),
        "age": random.randint(20, 80),
        "hypertension": random.randint(0, 1),
        "heart_disease": random.randint(0, 1),
        "bmi": round(random.uniform(18.5, 35.0), 2),
        "HbA1c_level": round(random.uniform(4.0, 9.0), 1),
        "blood_glucose_level": random.randint(80, 300),
        "diabetes": random.randint(0, 1),
        "Outcome": random.randint(0, 1)
    }
    hospital_b_data.append(patient)

df_b = pd.DataFrame(hospital_b_data)
df_b.to_csv("hospital_B.csv", index=False)
print(f"✅ Hospital B dataset created with {len(df_b)} patients")
print(f"📊 Common patients between hospitals: 10")