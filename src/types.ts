// src/types.ts
export type PredictionRequest = {
  gender: number;              // 0=female, 1=male
  age: number;
  hypertension: number;        // 0=no, 1=yes
  heart_disease: number;       // 0=no, 1=yes
  bmi: number;
  HbA1c_level: number;
  blood_glucose_level: number;
};

export type PredictionResponse = {
  ok: boolean;
  is_attack: boolean;
  alert?: string;
  prediction?: 'Diabetic' | 'Normal';
  raw_pred?: number;
  probability?: number | null;
  mse?: number;
  error?: string;
};

export type LogEntry = {
  id: number;
  timestamp: string;
  input_hash: string;
  mse: number | string;             // can arrive as string
  is_attack: boolean | 0 | 1;       // can arrive as number
};
