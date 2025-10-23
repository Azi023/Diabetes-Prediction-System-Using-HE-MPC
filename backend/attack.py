import requests
import numpy as np
import time

URL = "http://127.0.0.1:5001/predict"

FEATURES = ["gender", "age", "hypertension", "heart_disease",
            "bmi", "HbA1c_level", "blood_glucose_level"]

def to_payload_dict(payload):
    values = [float(x) for x in payload]  # cast away numpy dtypes
    return {FEATURES[i]: values[i] for i in range(len(FEATURES))}

def post_and_print(payload, label=""):
    data = to_payload_dict(payload)
    try:
        r = requests.post(URL, json=data, timeout=10)   
        print(f"\n[{label}] status={r.status_code}")
        try:
            print("Response JSON:", r.json())
        except Exception:
            print("Response TEXT:", r.text[:500])
    except Exception as e:
        print(f"[{label}] Request failed:", e)

def random_noise_attack():
    payload = np.random.uniform(low=-1e3, high=1e3, size=len(FEATURES)).tolist()
    # Keep binary fields binary to better test protection logic:
    payload[0] = np.random.choice([0, 1])  # gender
    payload[2] = np.random.choice([0, 1])  # hypertension
    payload[3] = np.random.choice([0, 1])  # heart_disease
    post_and_print(payload, "RandomNoiseAttack")

def zero_feature_attack():
    payload = [0] * len(FEATURES)
    post_and_print(payload, "ZeroFeatureAttack")

if __name__ == "__main__":
    while True:
        random_noise_attack()
        zero_feature_attack()
        time.sleep(5)
