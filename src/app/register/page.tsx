'use client';

import { register } from '@/api/auth';
import { useAuth } from '@/contexts/AuthContext';
import { RegisterRequest } from '@/types/auth';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';

interface ValidationErrors {
  username?: string;
  password?: string;
  telegram?: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuth();
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [loading, setLoading] = useState(false);

  const validateForm = (formData: FormData): boolean => {
    const errors: ValidationErrors = {};
    
    // Username validation: min 6 chars, only latin letters and numbers
    const username = formData.get('username') as string;
    if (!/^[a-zA-Z0-9]{6,}$/.test(username)) {
      errors.username = 'Логін повинен містити мінімум 6 символів, тільки латинські літери та цифри';
    }

    // Password validation: min 6 chars
    const password = formData.get('password') as string;
    if (!password || password.length < 6) {
      errors.password = 'Пароль повинен містити мінімум 6 символів';
    }

    // Telegram validation: must start with @
    const telegram = formData.get('telegram') as string;
    if (telegram && !telegram.startsWith('@')) {
      errors.telegram = 'Telegram повинен починатися з @';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setValidationErrors({});
    
    const formData = new FormData(e.currentTarget);
    
    if (!validateForm(formData)) {
      return;
    }
    
    const data: RegisterRequest = {
      username: formData.get('username') as string,
      password: formData.get('password') as string,
      telegram: formData.get('telegram') as string || undefined,
      eaId: formData.get('eaId') as string || undefined,
    };

    try {
      setLoading(true);
      setError('');
      const response = await register(data);
      setAuth(response);
      router.push('/profile');
    } catch (err: any) {
      setError('Не вдалося зареєструватися');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            Створіть акаунт
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
            <div>
              <label htmlFor="telegram" className="sr-only">
                Telegram
              </label>
              <input
                id="telegram"
                name="telegram"
                type="text"
                className={`appearance-none rounded-lg relative block w-full px-3 py-2 border ${
                  validationErrors.telegram ? 'border-red-500' : 'border-gray-300'
                } placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
                placeholder="Telegram (необов'язково)"
                onChange={() => {
                  if (validationErrors.telegram) {
                    setValidationErrors(prev => ({ ...prev, telegram: undefined }));
                  }
                  setError('');
                }}
              />
              {validationErrors.telegram && (
                <p className="mt-1 text-sm text-red-500">{validationErrors.telegram}</p>
              )}
            </div>
            <div>
              <label htmlFor="eaId" className="sr-only">
                EA ID
              </label>
              <input
                id="eaId"
                name="eaId"
                type="text"
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="EA ID (необов'язково)"
                onChange={() => setError('')}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Зареєструватися
            </button>
          </div>
        </form>
        <div className="text-center">
          <Link
            href="/login"
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            Вже є акаунт? Увійти
          </Link>
        </div>
      </div>
    </div>
  );
} 