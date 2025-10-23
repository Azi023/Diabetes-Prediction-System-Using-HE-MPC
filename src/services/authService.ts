import { LoginCredentials, RegisterCredentials, AuthResponse, User } from '../types/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

class AuthService {
  private getAuthHeaders(): HeadersInit {
    const token = this.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  // Store token in localStorage
  setToken(token: string): void {
    localStorage.setItem('medguard_token', token);
  }

  // Get token from localStorage
  getToken(): string | null {
    return localStorage.getItem('medguard_token');
  }

  // Store user in localStorage
  setUser(user: User): void {
    localStorage.setItem('medguard_user', JSON.stringify(user));
  }

  // Get user from localStorage
  getUser(): User | null {
    const userStr = localStorage.getItem('medguard_user');
    return userStr ? JSON.parse(userStr) : null;
  }

  // Remove token and user from localStorage
  clearAuth(): void {
    localStorage.removeItem('medguard_token');
    localStorage.removeItem('medguard_user');
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // Login
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Store token and user
      this.setToken(data.token);
      this.setUser(data.user);

      return data;
    } catch (error) {
      throw error;
    }
  }

  // Register
  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // Store token and user
      this.setToken(data.token);
      this.setUser(data.user);

      return data;
    } catch (error) {
      throw error;
    }
  }

  // Logout
  async logout(): Promise<void> {
    try {
      const token = this.getToken();
      
      if (token) {
        await fetch(`${API_URL}/auth/logout`, {
          method: 'POST',
          headers: this.getAuthHeaders(),
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local storage
      this.clearAuth();
    }
  }

  // Get current user from API
  async getCurrentUser(): Promise<User> {
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to get user');
      }

      return data.user;
    } catch (error) {
      this.clearAuth();
      throw error;
    }
  }
}

export default new AuthService();