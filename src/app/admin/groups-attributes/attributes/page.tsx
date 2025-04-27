'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AuthLayout from '@/components/AuthLayout';
import { ApiService } from '@/config/apiService';

interface User {
  id: number;
  username: string;
  attributes: Record<string, string>;
}

export default function AttributesManagementPage() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [usernameFilter, setUsernameFilter] = useState('');
  const [attributeKeyFilter, setAttributeKeyFilter] = useState('');
  const [attributeValueFilter, setAttributeValueFilter] = useState('');

  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      router.push('/profile');
      return;
    }

    const fetchUsers = async () => {
      try {
        if (!token) return;
        const data = await ApiService.users.getAll(token);
        setAllUsers(data);
        setFilteredUsers(data);
      } catch (err) {
        setError('Failed to load users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [user, router, token]);

  // Применяем все фильтры при изменении любого из них
  useEffect(() => {
    const filtered = allUsers.filter((user: User) => {
      // Фильтр по имени пользователя
      const usernameMatch = user.username.toLowerCase().includes(usernameFilter.toLowerCase());
      
      // Если нет фильтров по атрибутам, проверяем только имя
      if (!attributeKeyFilter && !attributeValueFilter) {
        return usernameMatch;
      }

      // Проверяем атрибуты
      const attributes = user.attributes || {};
      const hasMatchingAttribute = Object.entries(attributes).some(([key, value]) => {
        const keyMatch = !attributeKeyFilter || key.toLowerCase().includes(attributeKeyFilter.toLowerCase());
        const valueMatch = !attributeValueFilter || value.toLowerCase().includes(attributeValueFilter.toLowerCase());
        return keyMatch && valueMatch;
      });

      return usernameMatch && hasMatchingAttribute;
    });

    setFilteredUsers(filtered);
  }, [allUsers, usernameFilter, attributeKeyFilter, attributeValueFilter]);

  const handleAttributeUpdate = async (userId: number, key: string, value: string) => {
    if (!token) return;
    try {
      await ApiService.users.updateAttribute(token, userId, key, value);
      
      // Refresh users list
      const updatedData = await ApiService.users.getAll(token);
      setFilteredUsers(updatedData);
    } catch (err) {
      setError('Failed to update attribute');
    }
  };

  const handleAttributeDelete = async (userId: number, key: string) => {
    if (!token) return;
    try {
      await ApiService.users.deleteAttribute(token, userId, key);
      
      // Refresh users list
      const updatedData = await ApiService.users.getAll(token);
      setFilteredUsers(updatedData);
    } catch (err) {
      setError('Failed to delete attribute');
    }
  };

  return (
    <AuthLayout>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Управління атрибутами користувачів</h1>
        
        <div className="mb-6 space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Фільтр за іменем користувача
              </label>
              <input
                type="text"
                placeholder="Пошук за іменем користувача..."
                value={usernameFilter}
                onChange={(e) => setUsernameFilter(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-500"
              />
            </div>
            <div className="flex gap-2 flex-1">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Фільтр за ключем атрибута
                </label>
                <input
                  type="text"
                  placeholder="Ключ атрибута..."
                  value={attributeKeyFilter}
                  onChange={(e) => setAttributeKeyFilter(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-500"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Фільтр за значенням атрибута
                </label>
                <input
                  type="text"
                  placeholder="Значення атрибута..."
                  value={attributeValueFilter}
                  onChange={(e) => setAttributeValueFilter(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-500"
                />
              </div>
            </div>
          </div>
        </div>

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
                {filteredUsers.map((user) => (
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