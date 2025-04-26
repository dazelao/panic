export interface RegisterRequest {
  username: string;
  telegram?: string;
  eaId?: string;
  password: string;
  role?: string;
  attributes?: Record<string, string>;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  id: number;
  token: string;
  username: string;
  role: string;
}

export interface UserProfile {
  id: number;
  username: string;
  telegram?: string;
  eaId?: string;
  role: string;
  attributes?: Record<string, string>;
}

export interface UpdateProfileRequest {
  telegram?: string;
  eaId?: string;
} 