'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AuthLayout from '@/components/AuthLayout';

interface Tournament {
  id: number;
  name: string;
  description: string;
  registeredPlayers: number;
}

interface PattonGroups {
  groups: Record<string, number[]>;
  totalGroups: number;
  totalPlayers: number;
  theme: string;
  sortType: string;
}

export default function PattonPage() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    tournamentId: '',
    topPlaces: '',
    groupSize: '',
    theme: '',
    sortType: 'RandomSwizz'
  });
  const [pattonGroups, setPattonGroups] = useState<PattonGroups | null>(null);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      router.push('/profile');
      return;
    }

    const fetchTournaments = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/swiss/tournaments', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!response.ok) throw new Error('Failed to fetch tournaments');
        const data = await response.json();
        setTournaments(data);
      } catch (err) {
        setError('Failed to load tournaments');
      } finally {
        setLoading(false);
      }
    };

    fetchTournaments();
  }, [user, router, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setPattonGroups(null);

    try {
      const response = await fetch('http://localhost:8080/api/patton/create-groups-dto', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tournamentId: Number(formData.tournamentId),
          topPlaces: Number(formData.topPlaces),
          groupSize: Number(formData.groupSize),
          theme: formData.theme,
          sortType: formData.sortType
        })
      });

      if (!response.ok) throw new Error('Failed to create groups');
      const data = await response.json();
      setPattonGroups(data);
    } catch (err) {
      setFormError('Failed to create groups');
    }
  };

  return (
    <AuthLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Список турнірів</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">Завантаження...</div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Назва
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Опис
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Кількість учасників
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tournaments.map((tournament) => (
                  <tr key={tournament.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {tournament.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {tournament.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {tournament.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {tournament.registeredPlayers}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="bg-white shadow sm:rounded-lg mb-8">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Створення груп Паттона</h2>
            
            {formError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">ID турніру</label>
                <input
                  type="number"
                  value={formData.tournamentId}
                  onChange={(e) => setFormData({...formData, tournamentId: e.target.value})}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Кількість верхніх місць</label>
                <input
                  type="number"
                  value={formData.topPlaces}
                  onChange={(e) => setFormData({...formData, topPlaces: e.target.value})}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Розмір групи</label>
                <input
                  type="number"
                  value={formData.groupSize}
                  onChange={(e) => setFormData({...formData, groupSize: e.target.value})}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Тема</label>
                <input
                  type="text"
                  value={formData.theme}
                  onChange={(e) => setFormData({...formData, theme: e.target.value})}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Тип сортування</label>
                <select
                  value={formData.sortType}
                  onChange={(e) => setFormData({...formData, sortType: e.target.value})}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                >
                  <option value="RandomSwizz">Випадкове розподілення</option>
                  <option value="NoRandomSwizz">Розподілення по місцях "змійкою"</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Створити групи
              </button>
            </form>
          </div>
        </div>

        {pattonGroups && (
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Результат створення груп</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-700">Загальна інформація:</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Всього груп: {pattonGroups.totalGroups}<br />
                    Всього гравців: {pattonGroups.totalPlayers}<br />
                    Тема: {pattonGroups.theme}<br />
                    Тип сортування: {pattonGroups.sortType}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-700">Групи:</h3>
                  <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {Object.entries(pattonGroups.groups).map(([groupNum, players]) => (
                      <div key={groupNum} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex flex-col gap-1">
                          <h4 className="text-sm font-medium text-gray-900">Група {groupNum}</h4>
                          <div className="text-xs text-gray-500 break-all">
                            Атрибут: massadd:group{groupNum}_{pattonGroups.totalGroups}_{pattonGroups.theme}
                          </div>
                        </div>
                        <ul className="space-y-1 mt-3">
                          {players.map((playerId) => (
                            <li key={playerId} className="text-sm text-gray-600">
                              Гравець ID: {playerId}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthLayout>
  );
} 