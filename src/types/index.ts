export interface PredictionRequest {
  gender: number;
  age: number;
  hypertension: number;
  heart_disease: number;
  bmi: number;
  HbA1c_level: number;
  blood_glucose_level: number;
}

export interface PredictionResponse {
  prediction?: string;
  alert?: string;
}

export interface LogEntry {
  id: number;
  timestamp: string;
  input_hash: string;
  mse: number;
  is_attack: number;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}