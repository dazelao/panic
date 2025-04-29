import { AuthResponse, LoginRequest, RegisterRequest, UpdateProfileRequest, UserProfile } from '@/types/auth';
import { AUTH_API_URL } from '@/config/api';

const API_URL = AUTH_API_URL;

export const register = async (data: RegisterRequest): Promise<AuthResponse> => {
  const response = await fetch(`${API_URL}/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Registration failed');
  }

  return response.json();
};

export const login = async (data: LoginRequest): Promise<AuthResponse> => {
  console.log('Attempting login with:', { username: data.username, passwordLength: data.password.length });
  
  try {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    console.log('Login response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Login error details:', errorText);
      throw new Error(`Login failed: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    console.log('Login successful, received token');
    return result;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const getProfile = async (token: string): Promise<UserProfile> => {
  const response = await fetch(`${API_URL}/me`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch profile');
  }

  return response.json();
};

export const updateProfile = async (token: string, data: UpdateProfileRequest): Promise<UserProfile> => {
  const response = await fetch(`${API_URL}/update`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to update profile');
  }

  return response.json();
}; 