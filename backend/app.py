# app.py
import os
import sys
import json
import joblib
import traceback
import hashlib
from datetime import datetime, timedelta
from functools import wraps

from psi import run_psi                            
from secure_inference import perform_secure_inference_sync
from flask import Flask, request, jsonify, current_app
from flask_cors import CORS
import numpy as np

# ===============================
# External modules
# ===============================
from protection import detect_attack  # extraction detection (autoencoder)
from patient_encryption_with_PSI import update_patient_record

# Database connection (for plaintext summary)
try:
    from db_connection import db_connection
except Exception:
    try:
        from config.db_mongo import db as db_connection
    except Exception:
        db_connection = None

# Auth routes & decorators (keep your login/register)
from routes.auth import auth_bp
try:
    from utils.auth import token_required, role_required
except Exception:
    # safe fallbacks if utils.auth missing (dev only)
    def token_required(f):
        @wraps(f)
        def wrapper(*a, **kw):
            return f(*a, **kw)
        return wrapper

    def role_required(*roles):
        def deco(f):
            @wraps(f)
            def wrapper(*a, **kw):
                return f(*a, **kw)
            return wrapper
        return deco

# ===============================
# App setup
# ===============================
app = Flask(__name__)
CORS(app, supports_credentials=True)

# register auth blueprint (login/register routes)
app.register_blueprint(auth_bp, url_prefix='/api/auth')

# ===============================
# Config paths
# ===============================
POISONING_MODEL_PATH = "best_model.joblib"
POISONING_META_PATH = "best_model_meta.json"
MODEL_BUNDLE_PATH = "models/db.pkl"
PUBLIC_KEY_PATH = "public_key.txt"  # used by patient_encryption_with_PSI

# ===============================
# Load Models (Fail Fast)
# ===============================
def fatal(msg):
    print("❌ FATAL:", msg, file=sys.stderr)
    sys.exit(2)

# Poisoning model (required)
if not (os.path.exists(POISONING_MODEL_PATH) and os.path.exists(POISONING_META_PATH)):
    fatal("Poisoning detection model or metadata missing.")

try:
    poisoning_model = joblib.load(POISONING_MODEL_PATH)
    with open(POISONING_META_PATH, "r") as f:
        poisoning_meta = json.load(f)
    feature_order = poisoning_meta.get("feature_columns")
    encoders = poisoning_meta.get("encoders", {})
    poisoning_scaler = poisoning_meta.get("scaler", None)
    poisoning_threshold = poisoning_meta.get("threshold_used", 0.5)
    print("🧬 ✅ Model poisoning model loaded successfully.")
except Exception as e:
    fatal(f"Failed to load poisoning model/meta: {e}\n{traceback.format_exc()}")

# Extraction protection model availability (we rely on protection.detect_attack)
try:
    # import already done at top; if detect_attack fails, this will raise on call
    print("🛡️ ✅ Model extraction model loaded successfully.")
except Exception as e:
    fatal(f"Failed to validate extraction detection: {e}")

# Diabetes prediction model (required)
if not os.path.exists(MODEL_BUNDLE_PATH):
    fatal(f"Model bundle missing: {MODEL_BUNDLE_PATH}")

try:
    bundle = joblib.load(MODEL_BUNDLE_PATH)
    model = bundle["model"]
    scaler = bundle.get("scaler", None)
    print("🤖 ✅ Diabetes prediction model loaded successfully.")
except Exception as e:
    fatal(f"Failed to load diabetes model: {e}\n{traceback.format_exc()}")

# ===============================
# Security Logging Helper
# ===============================
def log_security_event(input_data, mse_score, is_attack, event_type="model_check", additional_info=None):
    """Log security events to database"""
    try:
        if not db_connection:
            print("Warning: Cannot log security event - database not available")
            return
        
        logs_collection = db_connection.get_collection("security_logs")
        
        # Create input hash for privacy/security
        input_str = json.dumps(input_data, sort_keys=True, default=str)
        input_hash = hashlib.sha256(input_str.encode()).hexdigest()
        
        log_entry = {
            "timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
            "input_hash": input_hash,
            "mse": float(mse_score),
            "is_attack": bool(is_attack),
            "event_type": event_type,
            "additional_info": additional_info or {},
            "created_at": datetime.utcnow()
        }
        
        # Insert the log entry
        result = logs_collection.insert_one(log_entry)
        print(f"✅ Security event logged: ID={result.inserted_id}, Type={event_type}, Attack={is_attack}, MSE={mse_score}")
        
    except Exception as e:
        current_app.logger.exception(f"Failed to log security event: {e}")
        print(f"❌ Failed to log security event: {e}")

# ===============================
# Helpers
# ===============================
def _coerce_feature(name, val):
    if val is None:
        raise ValueError(f"Missing value for {name}")
    try:
        return float(val)
    except Exception:
        raise ValueError(f"Invalid value for {name}: {val}")

def _run_poisoning_check(feature_dict):
    """Return True if poisoning suspected, otherwise False. Raises RuntimeError on internal error."""
    try:
        features = []
        # Use feature_order from poisoning_meta
        for col in feature_order:
            val = feature_dict.get(col, 0)
            if col in encoders:
                enc = encoders[col]
                if isinstance(enc, dict):
                    val = enc.get(val, 0)
                elif isinstance(enc, list):
                    try:
                        val = enc.index(val)
                    except ValueError:
                        val = 0
            try:
                features.append(float(val))
            except Exception:
                features.append(0.0)
        X = np.array([features])
        if poisoning_scaler is not None:
            X = poisoning_scaler.transform(X)
        if hasattr(poisoning_model, "predict_proba"):
            prob = float(poisoning_model.predict_proba(X)[:, 1][0])
        else:
            prob = float(poisoning_model.predict(X)[0])
        return prob > float(poisoning_threshold)
    except Exception as e:
        current_app.logger.exception(f"Poisoning check error: {e}")
        raise RuntimeError(f"Poisoning check failed: {e}")

# ===============================
# Logs API Endpoints
# ===============================
@app.route("/api/logs", methods=["GET"])
def get_logs():
    """Get security logs with pagination"""
    try:
        if not db_connection:
            return jsonify({"ok": False, "error": "Database not available"}), 500
        
        logs_collection = db_connection.get_collection("security_logs")
        
        # Get query parameters for pagination
        page = int(request.args.get('page', 1))
        per_page = min(int(request.args.get('per_page', 50)), 100)  # Max 100 per page
        skip = (page - 1) * per_page
        
        # Get event type filter if provided
        event_type = request.args.get('event_type')
        query = {}
        if event_type:
            query['event_type'] = event_type
        
        # Fetch logs with pagination, sorted by timestamp (newest first)
        logs_cursor = logs_collection.find(query).sort("created_at", -1).skip(skip).limit(per_page)
        logs = []
        
        for log in logs_cursor:
            logs.append({
                "id": str(log.get("_id", "")),
                "timestamp": log.get("timestamp", ""),
                "input_hash": log.get("input_hash", ""),
                "mse": float(log.get("mse", 0)),
                "is_attack": bool(log.get("is_attack", False)),
                "event_type": log.get("event_type", "unknown"),
                "additional_info": log.get("additional_info", {})
            })
        
        # Return just the logs array for compatibility with your Dashboard
        return jsonify(logs), 200
        
    except Exception as e:
        current_app.logger.exception(f"Failed to get logs: {e}")
        return jsonify([]), 200  # Return empty array on error

@app.route("/api/logs/stats", methods=["GET"])
def get_logs_stats():
    """Get logs statistics"""
    try:
        if not db_connection:
            return jsonify({"ok": False, "error": "Database not available"}), 500
        
        logs_collection = db_connection.get_collection("security_logs")
        
        # Get basic stats
        total_logs = logs_collection.count_documents({})
        attack_logs = logs_collection.count_documents({"is_attack": True})
        normal_logs = total_logs - attack_logs
        
        # Calculate average MSE
        pipeline = [{"$group": {"_id": None, "avg_mse": {"$avg": "$mse"}}}]
        avg_result = list(logs_collection.aggregate(pipeline))
        avg_mse = avg_result[0]["avg_mse"] if avg_result else 0
        
        # Get stats by event type
        event_type_pipeline = [
            {"$group": {"_id": "$event_type", "count": {"$sum": 1}, "attacks": {"$sum": {"$cond": ["$is_attack", 1, 0]}}}}
        ]
        event_type_stats = list(logs_collection.aggregate(event_type_pipeline))
        
        # Get recent activity (last 24 hours)
        yesterday = datetime.utcnow() - timedelta(days=1)
        recent_logs = logs_collection.count_documents({"created_at": {"$gte": yesterday}})
        recent_attacks = logs_collection.count_documents({"created_at": {"$gte": yesterday}, "is_attack": True})
        
        return jsonify({
            "total_logs": total_logs,
            "attack_logs": attack_logs,
            "normal_logs": normal_logs,
            "attack_rate": round((attack_logs / total_logs * 100) if total_logs > 0 else 0, 2),
            "avg_mse": round(avg_mse, 6) if avg_mse else 0,
            "event_type_stats": event_type_stats,
            "recent_activity": {
                "last_24h_logs": recent_logs,
                "last_24h_attacks": recent_attacks
            }
        }), 200
        
    except Exception as e:
        current_app.logger.exception(f"Failed to get log stats: {e}")
        return jsonify({"ok": False, "error": "Failed to retrieve statistics"}), 500

# ===============================
# Patient Endpoints
# ===============================

@app.route("/api/patients", methods=["POST"])
def create_patient(current_user=None):
    """
    Steps:
      1. Model poisoning check + logging
      2. Model extraction check + logging  
      3. Diabetes prediction
      4. Persist encrypted record and log success
    """
    try:
        data = request.get_json(silent=True)
        if not data:
            raw = request.get_data(as_text=True)
            current_app.logger.warning(f"Invalid JSON: {raw}")
            return jsonify({"ok": False, "error": "Invalid or missing JSON body"}), 400

        required = [
            "NIC", "Name", "gender", "age", "hypertension",
            "heart_disease", "bmi", "HbA1c_level", "blood_glucose_level"
        ]
        missing = [f for f in required if f not in data or str(data[f]).strip() == ""]
        if missing:
            return jsonify({"ok": False, "error": f"Missing fields: {', '.join(missing)}"}), 400

        # 1) Model Poisoning Check
        try:
            poisoning_flag = _run_poisoning_check(data)
            # Log poisoning check result
            log_security_event(
                input_data=data,
                mse_score=0.0,  # Poisoning check doesn't use MSE
                is_attack=poisoning_flag,
                event_type="poisoning_check",
                additional_info={"threshold": poisoning_threshold}
            )
        except Exception as e:
            log_security_event(
                input_data=data,
                mse_score=0.0,
                is_attack=True,  # Assume attack if check fails
                event_type="poisoning_check_error",
                additional_info={"error": str(e)}
            )
            return jsonify({"ok": False, "error": f"Poisoning check failed: {e}"}), 500

        if poisoning_flag:
            print("⚠️  Model poisoning detected – record rejected.")
            return jsonify({
                "ok": False, 
                "error": "Model poisoning detected",
                "alert": "Suspicious data patterns detected. This submission has been blocked for security reasons."
            }), 403

        # 2) Model Extraction Check
        # Build vector according to poisoning feature_order for extraction input
        x_list = [_coerce_feature(f, data[f]) for f in feature_order]
        x = np.array(x_list, dtype=float).reshape(1, -1)
        try:
            is_attack, mse = detect_attack(x)
            # Log extraction check result
            log_security_event(
                input_data=data,
                mse_score=float(mse),
                is_attack=is_attack,
                event_type="extraction_check",
                additional_info={"detection_threshold": "auto"}  # You can add your threshold here
            )
        except Exception as e:
            log_security_event(
                input_data=data,
                mse_score=0.0,
                is_attack=True,  # Assume attack if check fails
                event_type="extraction_check_error",
                additional_info={"error": str(e)}
            )
            current_app.logger.exception(f"Extraction check error: {e}")
            return jsonify({"ok": False, "error": "Extraction check failed"}), 500

        if is_attack:
            print("⚠️  Model extraction attack detected – record rejected.")
            return jsonify({
                "ok": False, 
                "error": "Model extraction attack detected", 
                "alert": f"Potential model extraction attempt detected (MSE: {float(mse):.4f}). Access denied.",
                "mse": float(mse)
            }), 403

        # 3) Prediction
        try:
            xs = scaler.transform(x) if scaler is not None else x
            if hasattr(model, "predict_proba"):
                prob = float(model.predict_proba(xs)[:, 1][0])
                pred = int(prob >= 0.5)
            else:
                pred = int(model.predict(xs)[0])
            
            # Log successful prediction
            log_security_event(
                input_data=data,
                mse_score=float(mse),  # Use MSE from extraction check
                is_attack=False,
                event_type="prediction_success",
                additional_info={
                    "prediction": "diabetic" if pred == 1 else "non_diabetic",
                    "probability": prob if 'prob' in locals() else None
                }
            )
        except Exception as e:
            log_security_event(
                input_data=data,
                mse_score=0.0,
                is_attack=False,
                event_type="prediction_error",
                additional_info={"error": str(e)}
            )
            current_app.logger.exception(f"Prediction failed: {e}")
            return jsonify({"ok": False, "error": "Prediction failed"}), 500

        # 4) Save Encrypted Record
        record = {
            "NIC": data.get("NIC"),
            "Name": data.get("Name"),
            "Address": data.get("Address", ""),
            "gender": data.get("gender"),
            "age": data.get("age"),
            "hypertension": data.get("hypertension"),
            "heart_disease": data.get("heart_disease"),
            "bmi": data.get("bmi"),
            "HbA1c_level": data.get("HbA1c_level"),
            "blood_glucose_level": data.get("blood_glucose_level"),
            "diabetes": pred
        }

        try:
            update_patient_record(record)
            print("✅ Record inserted successfully into the database.")
            
            # Log successful record creation
            log_security_event(
                input_data=data,
                mse_score=0.0,
                is_attack=False,
                event_type="record_created",
                additional_info={
                    "patient_name": record["Name"],
                    "prediction": "diabetic" if pred == 1 else "non_diabetic"
                }
            )
        except Exception as e:
            log_security_event(
                input_data=data,
                mse_score=0.0,
                is_attack=False,
                event_type="record_creation_error",
                additional_info={"error": str(e)}
            )
            current_app.logger.exception(f"update_patient_record failed: {e}\n{traceback.format_exc()}")
            return jsonify({"ok": False, "error": "Failed to save record"}), 500

        # Optional plaintext summary (for hospital listing)
        try:
            if db_connection:
                col = db_connection.get_collection("patients_plain")
                nic_hash = hashlib.sha256(str(record["NIC"]).encode()).hexdigest() if record.get("NIC") else None
                col.insert_one({
                    "NIC_Hashed": nic_hash,
                    "name": record["Name"],
                    "diabetes": pred,
                    "created_at": datetime.utcnow()
                })
        except Exception:
            current_app.logger.exception("Failed to insert plaintext summary")

        return jsonify({
            "ok": True,
            "message": "Record saved successfully",
            "prediction": "Diabetic" if pred == 1 else "Non-Diabetic"
        }), 201

    except Exception as e:
        # Log unexpected errors
        try:
            log_security_event(
                input_data=data if 'data' in locals() else {},
                mse_score=0.0,
                is_attack=False,
                event_type="system_error",
                additional_info={"error": str(e)}
            )
        except:
            pass  # Don't fail if logging fails
            
        current_app.logger.exception(f"Unhandled error: {e}\n{traceback.format_exc()}")
        return jsonify({"ok": False, "error": "Internal server error"}), 500


@app.route("/api/patients", methods=["GET"])
def list_patients(current_user=None):
    """Get list of patients (plaintext summary only)."""
    try:
        if not db_connection:
            return jsonify({"ok": False, "error": "Database not available"}), 500
        
        col = db_connection.get_collection("patients_plain")
        
        # Get query parameters for pagination
        page = int(request.args.get('page', 1))
        per_page = min(int(request.args.get('per_page', 10)), 100)  # Max 100 per page
        skip = (page - 1) * per_page
        
        # Get total count
        total = col.count_documents({})
        
        # Get patients with pagination
        patients = list(col.find({}, {
            "_id": 0,
            "NIC_Hashed": 1,
            "name": 1,
            "diabetes": 1,
            "created_at": 1
        }).sort("created_at", -1).skip(skip).limit(per_page))
        
        # Format response
        for patient in patients:
            if "created_at" in patient:
                patient["created_at"] = patient["created_at"].isoformat()
            patient["prediction"] = "Diabetic" if patient.get("diabetes") == 1 else "Non-Diabetic"
        
        return jsonify({
            "ok": True,
            "patients": patients,
            "pagination": {
                "page": page,
                "per_page": per_page,
                "total": total,
                "total_pages": (total + per_page - 1) // per_page
            }
        }), 200
        
    except Exception as e:
        current_app.logger.exception(f"Failed to list patients: {e}")
        return jsonify({"ok": False, "error": "Failed to retrieve patients"}), 500


@app.route("/api/patients/<nic_hash>", methods=["GET"])
def get_patient(nic_hash, current_user=None):
    """Get specific patient details by NIC hash."""
    try:
        if not db_connection:
            return jsonify({"ok": False, "error": "Database not available"}), 500
        
        col = db_connection.get_collection("patients_plain")
        patient = col.find_one({"NIC_Hashed": nic_hash}, {"_id": 0})
        
        if not patient:
            return jsonify({"ok": False, "error": "Patient not found"}), 404
        
        # Format datetime
        if "created_at" in patient:
            patient["created_at"] = patient["created_at"].isoformat()
        
        patient["prediction"] = "Diabetic" if patient.get("diabetes") == 1 else "Non-Diabetic"
        
        return jsonify({
            "ok": True,
            "patient": patient
        }), 200
        
    except Exception as e:
        current_app.logger.exception(f"Failed to get patient {nic_hash}: {e}")
        return jsonify({"ok": False, "error": "Failed to retrieve patient"}), 500


@app.route("/api/patients/stats", methods=["GET"])
def get_patient_stats(current_user=None):
    """Get basic statistics about patients."""
    try:
        if not db_connection:
            return jsonify({"ok": False, "error": "Database not available"}), 500
        
        col = db_connection.get_collection("patients_plain")
        
        # Get basic counts
        total_patients = col.count_documents({})
        diabetic_patients = col.count_documents({"diabetes": 1})
        non_diabetic_patients = col.count_documents({"diabetes": 0})
        
        # Get recent patients (last 7 days)
        week_ago = datetime.utcnow() - timedelta(days=7)
        recent_patients = col.count_documents({"created_at": {"$gte": week_ago}})
        
        return jsonify({
            "ok": True,
            "stats": {
                "total_patients": total_patients,
                "diabetic_patients": diabetic_patients,
                "non_diabetic_patients": non_diabetic_patients,
                "diabetic_percentage": round((diabetic_patients / total_patients * 100) if total_patients > 0 else 0, 1),
                "recent_patients_7_days": recent_patients
            }
        }), 200
        
    except Exception as e:
        current_app.logger.exception(f"Failed to get stats: {e}")
        return jsonify({"ok": False, "error": "Failed to retrieve statistics"}), 500

# ===============================
# MPC/PSI Endpoints
# ===============================

@app.route("/api/mpc/hospital-data", methods=["GET"])
def get_hospital_data(current_user=None):
    """Get sample NICs from both hospitals for PSI"""
    try:
        if not db_connection:
            return jsonify({"ok": False, "error": "Database not available"}), 500
        
        hospital_param = request.args.get('hospital', 'both')
        limit = int(request.args.get('limit', 50))
        
        result = {}
        
        if hospital_param in ['A', 'both']:
            col_a = db_connection.get_collection("hospital_a_patients")
            nics_a = [doc['NIC'] for doc in col_a.find({}, {'NIC': 1, '_id': 0}).limit(limit)]
            result['hospital_a'] = {
                'count': len(nics_a),
                'sample_nics': nics_a[:10],  # Show first 10 for preview
                'all_nics': nics_a
            }
        
        if hospital_param in ['B', 'both']:
            col_b = db_connection.get_collection("hospital_b_patients")
            nics_b = [doc['NIC'] for doc in col_b.find({}, {'NIC': 1, '_id': 0}).limit(limit)]
            result['hospital_b'] = {
                'count': len(nics_b),
                'sample_nics': nics_b[:10],  # Show first 10 for preview
                'all_nics': nics_b
            }
        
        return jsonify({"ok": True, "data": result}), 200
        
    except Exception as e:
        current_app.logger.exception(f"Failed to get hospital data: {e}")
        return jsonify({"ok": False, "error": str(e)}), 500


@app.route("/api/mpc/psi", methods=["POST"])
def perform_psi(current_user=None):
    """Perform Private Set Intersection between two hospitals"""
    try:
        data = request.get_json(silent=True)
        if not data:
            return jsonify({"ok": False, "error": "Invalid JSON body"}), 400
        
        nics_a = data.get("nics_a", [])
        nics_b = data.get("nics_b", [])
        
        if not nics_a or not nics_b:
            return jsonify({"ok": False, "error": "Both nics_a and nics_b are required"}), 400
        
        # Run PSI protocol
        common_nics = run_psi(nics_a, nics_b, already_hashed=False)
        
        return jsonify({
            "ok": True,
            "common_count": len(common_nics),
            "common_nics": common_nics,
            "message": f"Found {len(common_nics)} common patients via PSI"
        }), 200
        
    except Exception as e:
        current_app.logger.exception(f"PSI failed: {e}")
        return jsonify({"ok": False, "error": str(e)}), 500


@app.route("/api/mpc/predict/<nic>", methods=["GET"])
def mpc_predict(nic, current_user=None):
    """Perform secure MPC prediction for a specific patient"""
    try:
        if not db_connection:
            return jsonify({"ok": False, "error": "Database not available"}), 500
        
        # Try to find patient in hospital A first
        col_a = db_connection.get_collection("hospital_a_patients")
        patient = col_a.find_one({"NIC": str(nic)})
        
        # If not found, try hospital B
        if not patient:
            col_b = db_connection.get_collection("hospital_b_patients")
            patient = col_b.find_one({"NIC": str(nic)})
        
        if not patient:
            return jsonify({"ok": False, "error": f"Patient {nic} not found"}), 404
        
        # Extract features
        feature_columns = ['gender', 'age', 'hypertension', 'heart_disease', 
                          'bmi', 'HbA1c_level', 'blood_glucose_level']
        
        patient_features = [float(patient.get(col, 0)) for col in feature_columns]
        
        # Load scaler from secure_inference module
        from secure_inference import scaler
        import numpy as np
        
        # Scale features
        patient_features_scaled = scaler.transform([patient_features])[0].tolist()
        
        # Perform secure MPC inference
        secure_score = perform_secure_inference_sync(patient_features_scaled)
        
        # Calculate prediction
        prob = 1.0 / (1.0 + np.exp(-secure_score))
        prediction = "Diabetic" if prob > 0.5 else "Non-diabetic"
        
        return jsonify({
            "ok": True,
            "nic": nic,
            "secure_score": float(secure_score),
            "probability": float(prob),
            "prediction": prediction,
            "features": {col: patient.get(col) for col in feature_columns}
        }), 200
        
    except Exception as e:
        current_app.logger.exception(f"MPC prediction failed: {e}")
        return jsonify({"ok": False, "error": str(e)}), 500


@app.route("/api/mpc/batch-predict", methods=["POST"])
def mpc_batch_predict(current_user=None):
    """Perform MPC predictions on multiple patients"""
    try:
        data = request.get_json(silent=True)
        if not data:
            return jsonify({"ok": False, "error": "Invalid JSON body"}), 400
        
        nics = data.get("nics", [])
        if not nics:
            return jsonify({"ok": False, "error": "NICs list is required"}), 400
        
        results = []
        from secure_inference import scaler
        import numpy as np
        
        feature_columns = ['gender', 'age', 'hypertension', 'heart_disease', 
                          'bmi', 'HbA1c_level', 'blood_glucose_level']
        
        col_a = db_connection.get_collection("hospital_a_patients")
        col_b = db_connection.get_collection("hospital_b_patients")
        
        for nic in nics:
            try:
                # Find patient
                patient = col_a.find_one({"NIC": str(nic)})
                if not patient:
                    patient = col_b.find_one({"NIC": str(nic)})
                
                if not patient:
                    results.append({
                        "nic": nic,
                        "success": False,
                        "error": "Patient not found"
                    })
                    continue
                
                # Extract and scale features
                patient_features = [float(patient.get(col, 0)) for col in feature_columns]
                patient_features_scaled = scaler.transform([patient_features])[0].tolist()
                
                # Perform MPC inference
                secure_score = perform_secure_inference_sync(patient_features_scaled)
                prob = 1.0 / (1.0 + np.exp(-secure_score))
                prediction = "Diabetic" if prob > 0.5 else "Non-diabetic"
                
                results.append({
                    "nic": nic,
                    "success": True,
                    "secure_score": float(secure_score),
                    "probability": float(prob),
                    "prediction": prediction
                })
                
            except Exception as e:
                results.append({
                    "nic": nic,
                    "success": False,
                    "error": str(e)
                })
        
        return jsonify({
            "ok": True,
            "total": len(nics),
            "successful": len([r for r in results if r.get("success")]),
            "results": results
        }), 200
        
    except Exception as e:
        current_app.logger.exception(f"Batch prediction failed: {e}")
        return jsonify({"ok": False, "error": str(e)}), 500



@app.route("/health", methods=["GET"])
def health():
    return jsonify({"ok": True, "message": "Server running fine"}), 200


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5001))
    print("=" * 70)
    print("🚀 Flask backend started")
    print("🧬 Using model poisoning, extraction, and prediction pipeline")
    print(f"🔑 TenSEAL public key: {'FOUND' if os.path.exists(PUBLIC_KEY_PATH) else 'MISSING'}")
    print(f"🌐 Running on port {port}")
    print("=" * 70)
    app.run(host="0.0.0.0", port=port, debug=True)