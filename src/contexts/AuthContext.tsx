'use client';

import { AuthResponse, UserProfile } from '@/types/auth';
import { createContext, useContext, useEffect, useState } from 'react';
import { getProfile } from '@/api/auth';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  setAuth: (auth: AuthResponse | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType & { isLoading: boolean }>({
  user: null,
  token: null,
  setAuth: () => {},
  logout: () => {},
  isLoading: true,
});

export const useAuth = () => useContext(AuthContext);

function getStoredToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const storedToken = getStoredToken();
    
    if (storedToken) {
      setToken(storedToken);
      getProfile(storedToken)
        .then(profile => setUser(profile))
        .catch(() => {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
          }
          setToken(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const setAuth = async (auth: AuthResponse | null) => {
    if (auth) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', auth.token);
      }
      setToken(auth.token);
      try {
        setIsLoading(true);
        const userProfile = await getProfile(auth.token);
        setUser(userProfile);
      } catch (err) {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    } else {
      logout();
    }
  };

  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
    setToken(null);
    setUser(null);
  };

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <AuthContext.Provider value={{ user, token, setAuth, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
} 