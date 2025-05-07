'use client';

import { login } from '@/api/auth';
import { useAuth } from '@/contexts/AuthContext';
import { LoginRequest } from '@/types/auth';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';

interface ValidationErrors {
  username?: string;
  password?: string;
}

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuth();
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [loading, setLoading] = useState(false);

  const validateForm = (formData: FormData): boolean => {
    const errors: ValidationErrors = {};
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    if (!username?.trim()) {
      errors.username = 'Будь ласка, введіть логін';
    }

    if (!password?.trim()) {
      errors.password = 'Будь ласка, введіть пароль';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    const formData = new FormData(e.currentTarget);
    
    if (!validateForm(formData)) {
      return;
    }

    const data: LoginRequest = {
      username: formData.get('username') as string,
      password: formData.get('password') as string,
    };

    try {
      setLoading(true);
      setError('');
      const response = await login(data);
      setAuth(response);
      router.push('/profile');
    } catch (err: any) {
      setError('Невірний логін або пароль');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            Вхід до акаунту
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm text-center">
              {error}
            </div>
          )}
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="username" className="sr-only">
                Логін
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className={`appearance-none rounded-lg relative block w-full px-3 py-2 border ${
                  validationErrors.username ? 'border-red-500' : 'border-gray-300'
                } placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
                placeholder="Логін"
                onChange={() => {
                  if (validationErrors.username) {
                    setValidationErrors(prev => ({ ...prev, username: undefined }));
                  }
                  setError('');
                }}
              />
              {validationErrors.username && (
                <p className="mt-1 text-sm text-red-500">{validationErrors.username}</p>
              )}
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Пароль
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className={`appearance-none rounded-lg relative block w-full px-3 py-2 border ${
                  validationErrors.password ? 'border-red-500' : 'border-gray-300'
                } placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
                placeholder="Пароль"
                onChange={() => {
                  if (validationErrors.password) {
                    setValidationErrors(prev => ({ ...prev, password: undefined }));
                  }
                  setError('');
                }}
              />
              {validationErrors.password && (
                <p className="mt-1 text-sm text-red-500">{validationErrors.password}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Увійти
            </button>
          </div>
        </form>
        <div className="text-center">
          <Link
            href="/register"
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            Немає акаунту? Зареєструватися
          </Link>
        </div>
      </div>
    </div>
  );
} 