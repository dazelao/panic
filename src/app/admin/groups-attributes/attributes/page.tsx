'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AuthLayout from '@/components/AuthLayout';

interface User {
  id: number;
  username: string;
  attributes: Record<string, string>;
}

export default function AttributesManagementPage() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      router.push('/profile');
      return;
    }

    const fetchUsers = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/users', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!response.ok) throw new Error('Failed to fetch users');
        const data = await response.json();
        setUsers(data);
      } catch (err) {
        setError('Failed to load users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [user, router, token]);

  const handleAttributeUpdate = async (userId: number, key: string, value: string) => {
    try {
      const response = await fetch(`http://localhost:8080/api/users/${userId}/attributes`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ key, value })
      });

      if (!response.ok) throw new Error('Failed to update attribute');

      // Refresh users list
      const updatedResponse = await fetch('http://localhost:8080/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const updatedData = await updatedResponse.json();
      setUsers(updatedData);
    } catch (err) {
      setError('Failed to update attribute');
    }
  };

  const handleAttributeDelete = async (userId: number, key: string) => {
    try {
      const response = await fetch(`http://localhost:8080/api/users/${userId}/attributes/${key}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete attribute');

      // Refresh users list
      const updatedResponse = await fetch('http://localhost:8080/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const updatedData = await updatedResponse.json();
      setUsers(updatedData);
    } catch (err) {
      setError('Failed to delete attribute');
    }
  };

  return (
    <AuthLayout>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Управління атрибутами користувачів</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">Завантаження...</div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Користувач
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Атрибути
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Дії
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{user.username}</div>
                      <div className="text-sm text-gray-500">ID: {user.id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(user.attributes || {}).map(([key, value]) => (
                          <div key={key} className="inline-flex items-center bg-gray-100 rounded-full px-3 py-1 text-sm">
                            <span className="font-medium text-gray-800">{key}:</span>
                            <span className="ml-1 text-gray-600">{value}</span>
                            <button
                              onClick={() => handleAttributeDelete(user.id, key)}
                              className="ml-2 text-red-500 hover:text-red-700"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => {
                          const key = prompt('Введіть ключ атрибута:');
                          if (!key) return;
                          const value = prompt('Введіть значення атрибута:');
                          if (!value) return;
                          handleAttributeUpdate(user.id, key, value);
                        }}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Додати атрибут
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AuthLayout>
  );
} 