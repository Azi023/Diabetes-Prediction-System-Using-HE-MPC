// src/components/PatientForm.tsx
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Heart,
  Activity,
  Droplets,
  TrendingUp,
  Shield,
  Brain,
  Zap,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import ApiService from "../services/api";

type PatientRequest = {
  NIC: string;
  Name: string;
  Address?: string;
  gender: number; // 0 female, 1 male
  age: number;
  hypertension: number;
  heart_disease: number;
  bmi: number;
  HbA1c_level: number;
  blood_glucose_level: number;
};

type PatientResponse = {
  ok: boolean;
  message?: string;
  prediction?: number | string | null;
  alert?: string | null;
};

export const PredictionForm: React.FC = () => {
  const [formData, setFormData] = useState<PatientRequest>({
    NIC: "",
    Name: "",
    Address: "",
    gender: 0,
    age: 25,
    hypertension: 0,
    heart_disease: 0,
    bmi: 25,
    HbA1c_level: 5.5,
    blood_glucose_level: 100,
  });

  const [result, setResult] = useState<PatientResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange =
    (field: keyof PatientRequest) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const val =
        e.target.type === "number" ? Number(e.target.value) : e.target.value;
      setFormData((prev) => ({ ...prev, [field]: val }));
      setResult(null);
      setError(null);
    };

  const submitToApi = async (payload: PatientRequest): Promise<PatientResponse> => {
    // prefer ApiService.createPatient if available
    try {
      if (ApiService && typeof (ApiService as any).createPatient === "function") {
        return await (ApiService as any).createPatient(payload);
      }
    } catch (e) {
      // fall back to fetch
    }

    // fallback fetch to /api/patients
    const res = await fetch("/api/patients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      credentials: "include",
    });
    const data = await res.json();
    return data;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    // minimal client validation
    if (!formData.NIC || !formData.Name) {
      setError("NIC and Name are required.");
      setLoading(false);
      return;
    }

    try {
      const response = await submitToApi(formData);
      setResult(response);

      if (!response.ok) {
        toast.error(response.message || "Failed to save record", {
          style: {
            background: "#1F2937",
            color: "#EF4444",
            border: "1px solid #EF4444",
          },
        });
        setError(response.message || "Failed to save record");
      } else {
        // Successful save
        let successText = "Your record is successful.";
        if (response.prediction !== undefined && response.prediction !== null) {
          const predText =
            typeof response.prediction === "number"
              ? response.prediction === 1
                ? "Diabetic"
                : "Non-diabetic"
              : String(response.prediction);
          successText += ` Prediction: ${predText}`;
        }
        toast.success("Record saved", {
          style: {
            background: "#1F2937",
            color: "#10B981",
            border: "1px solid #10B981",
          },
        });
        setResult({ ...response, message: successText });
        // reset some fields (but keep NIC and Name to help multiple entries if desired)
        setFormData((prev) => ({
          ...prev,
          // keep NIC/Name if you want; here we clear Address + numeric fields
          Address: "",
          age: 25,
          hypertension: 0,
          heart_disease: 0,
          bmi: 25,
          HbA1c_level: 5.5,
          blood_glucose_level: 100,
        }));
      }
    } catch (err: any) {
      const message = err?.message || "Network error";
      setError(message);
      toast.error("Submission failed");
    } finally {
      setLoading(false);
    }
  };

  const fieldConfig: Record<
    keyof PatientRequest,
    any
  > = {
    NIC: { label: "NIC", type: "text", icon: User },
    Name: { label: "Name", type: "text", icon: User },
    Address: { label: "Address", type: "text", icon: User },
    gender: {
      label: "Gender",
      type: "select",
      options: [
        { value: 0, label: "Female" },
        { value: 1, label: "Male" },
      ],
      icon: User,
    },
    age: { label: "Age", type: "number", min: 1, max: 120, icon: TrendingUp },
    hypertension: {
      label: "Hypertension",
      type: "select",
      options: [
        { value: 0, label: "No" },
        { value: 1, label: "Yes" },
      ],
      icon: Activity,
    },
    heart_disease: {
      label: "Heart Disease",
      type: "select",
      options: [
        { value: 0, label: "No" },
        { value: 1, label: "Yes" },
      ],
      icon: Heart,
    },
    bmi: { label: "BMI (Body Mass Index)", type: "number", min: 10, max: 50, step: 0.1, icon: Activity },
    HbA1c_level: { label: "HbA1c Level (%)", type: "number", min: 3, max: 15, step: 0.1, icon: Droplets },
    blood_glucose_level: { label: "Blood Glucose Level (mg/dL)", type: "number", min: 50, max: 400, icon: Droplets },
  };

  const renderField = (field: keyof PatientRequest) => {
    const cfg = fieldConfig[field];
    const Icon = cfg.icon;

    return (
      <motion.div
        key={String(field)}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="space-y-3"
      >
        <label className="flex items-center space-x-3 text-sm font-semibold text-gray-200">
          <div className="p-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg">
            <Icon className="h-4 w-4 text-blue-400" />
          </div>
          <span>{cfg.label}</span>
        </label>

        {cfg.type === "select" ? (
          <select
            value={formData[field] as any}
            onChange={(e) => handleInputChange(field)(e as any)}
            className="w-full px-4 py-4 bg-black/40 backdrop-blur-lg border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-white/30"
          >
            {cfg.options?.map((opt: any) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : cfg.type === "number" ? (
          <input
            type="number"
            min={cfg.min}
            max={cfg.max}
            step={cfg.step ?? 1}
            value={(formData as any)[field]}
            onChange={(e) => handleInputChange(field)(e as any)}
            className="w-full px-4 py-4 bg-black/40 backdrop-blur-lg border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-white/30"
          />
        ) : (
          <input
            type="text"
            value={(formData as any)[field] as any}
            onChange={(e) => handleInputChange(field)(e as any)}
            className="w-full px-4 py-4 bg-black/40 backdrop-blur-lg border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-white/30"
          />
        )}
      </motion.div>
    );
  };

  const renderResult = () => {
    if (!result) return null;

    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -40 }}
          transition={{ duration: 0.6 }}
          className="mt-8"
        >
          {result.alert ? (
            <div className="relative overflow-hidden bg-gradient-to-r from-red-500/20 to-orange-500/20 backdrop-blur-xl border border-red-500/30 rounded-2xl p-8 shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-orange-500/10 animate-pulse" />
              <div className="relative flex items-center space-x-4">
                <motion.div
                  animate={{ rotate: [0, 8, -8, 0] }}
                  transition={{ duration: 0.5, repeat: 3 }}
                  className="p-4 bg-red-500/20 rounded-2xl"
                >
                  <Shield className="h-8 w-8 text-red-400" />
                </motion.div>
                <div>
                  <h3 className="text-2xl font-bold text-red-300 mb-2">Security Threat Detected</h3>
                  <p className="text-red-200">{result.alert}</p>
                  <p className="text-red-300 text-sm mt-2">The system flagged this submission as potentially malicious.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className={`relative overflow-hidden backdrop-blur-xl border rounded-2xl p-8 shadow-2xl ${
              result.prediction === 1 || result.prediction === "Diabetic"
                ? "bg-gradient-to-r from-orange-500/20 to-red-500/20 border-orange-500/30"
                : "bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/30"
            }`}>
              <div className={`absolute inset-0 animate-pulse ${
                result.prediction === 1 || result.prediction === "Diabetic"
                  ? "bg-gradient-to-r from-orange-500/10 to-red-500/10"
                  : "bg-gradient-to-r from-green-500/10 to-emerald-500/10"
              }`} />
              <div className="relative flex items-center space-x-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.25, type: "spring", stiffness: 200 }}
                  className={`p-4 rounded-2xl ${ result.prediction === 1 || result.prediction === "Diabetic" ? "bg-orange-500/20" : "bg-green-500/20" }`}
                >
                  <Brain className={`h-8 w-8 ${ result.prediction === 1 || result.prediction === "Diabetic" ? "text-orange-400" : "text-green-400" }`} />
                </motion.div>
                <div>
                  <h3 className={`text-2xl font-bold mb-2 ${ result.prediction === 1 || result.prediction === "Diabetic" ? "text-orange-300" : "text-green-300" }`}>Submission Complete</h3>
                  <p className={`text-xl font-semibold ${ result.prediction === 1 || result.prediction === "Diabetic" ? "text-orange-200" : "text-green-200" }`}>
                    {result.message ?? (result.prediction === 1 ? "Diabetic" : "Non-diabetic")}
                  </p>
                  <p className={`text-sm mt-2 ${ result.prediction === 1 || result.prediction === "Diabetic" ? "text-orange-300" : "text-green-300" }`}>
                    {result.prediction === 1 ? 'Please consult healthcare personnel for next steps.' : 'No immediate diabetes risk detected.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    );
  };

  return (
    <div className="max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="relative">
        <div className="text-center mb-12">
          <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
            PATIENT REGISTRATION 
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="text-xl text-gray-300 max-w-2xl mx-auto">
            Enter patient details — data is securely processed and stored.
          </motion.p>
        </div>

        <div className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 px-8 py-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Zap className="h-6 w-6 text-blue-400" />
                <h2 className="text-2xl font-bold text-white">Patient Details</h2>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-green-400 text-sm font-medium">Secure</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Object.keys(fieldConfig).map((k) => renderField(k as keyof PatientRequest))}
            </div>

            {error && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl backdrop-blur-lg">
                <p className="text-red-300">{error}</p>
              </motion.div>
            )}

            <div className="mt-12">
              <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white py-6 px-8 rounded-2xl font-bold text-xl hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 focus:outline-none focus:ring-4 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-2xl shadow-blue-500/25 flex items-center justify-center space-x-3">
                {loading ? (
                  <>
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Brain className="h-6 w-6" />
                    <span>Submit Patient</span>
                  </>
                )}
              </motion.button>
            </div>

            {renderResult()}
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default PredictionForm;
