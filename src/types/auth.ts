// src/types/auth.ts - Remove role from registration (it's fixed to patient)
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  username: string;
  firstName: string;
  lastName: string;
  role: 'patient'; // Fixed to patient only
}

export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'hospital' | 'patient';
  isActive: boolean;
  created_at?: string;
  last_login?: string;
}