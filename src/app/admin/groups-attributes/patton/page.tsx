'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AuthLayout from '@/components/AuthLayout';

interface League {
  id: number;
  name: string;
  status: string;
}

interface GroupsResponse {
  groups: Record<string, number[]>;
  totalGroups: number;
  totalPlayers: number;
  theme: string;
  sortType: string;
}

export default function PattonManagementPage() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [leagues, setLeagues] = useState<League[]>([]);
  const [selectedLeague, setSelectedLeague] = useState<number | null>(null);
  const [topPlaces, setTopPlaces] = useState<number>(8);
  const [groupSize, setGroupSize] = useState<number>(4);
  const [theme, setTheme] = useState<string>('');
  const [sortType, setSortType] = useState<'RandomSwizz' | 'NoRandomSwizz'>('RandomSwizz');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [groups, setGroups] = useState<GroupsResponse | null>(null);

  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      router.push('/profile');
      return;
    }

    const fetchLeagues = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/leagues', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!response.ok) throw new Error('Failed to fetch leagues');
        const data = await response.json();
        setLeagues(data);
      } catch (err) {
        setError('Failed to load leagues');
      } finally {
        setLoading(false);
      }
    };

    fetchLeagues();
  }, [user, router, token]);

  const handleCreateGroups = async () => {
    if (!selectedLeague || !theme) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch('http://localhost:8080/api/patton/create-groups-dto', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tournamentId: selectedLeague,
          topPlaces,
          groupSize,
          theme,
          sortType
        })
      });

      if (!response.ok) throw new Error('Failed to create groups');
      const data = await response.json();
      setGroups(data);
      setError('');
    } catch (err) {
      setError('Failed to create groups');
    }
  };

  return (
    <AuthLayout>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Управління групами Паттон</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">Завантаження...</div>
        ) : (
          <div className="bg-white shadow sm:rounded-lg p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-black">Ліга</label>
                <select
                  value={selectedLeague || ''}
                  onChange={(e) => setSelectedLeague(Number(e.target.value))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-black"
                >
                  <option value="">Виберіть лігу</option>
                  {leagues.map((league) => (
                    <option key={league.id} value={league.id} className="text-black">
                      {league.name} ({league.status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-black">Кількість топ місць</label>
                <input
                  type="number"
                  value={topPlaces}
                  onChange={(e) => setTopPlaces(Number(e.target.value))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-black"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black">Розмір групи</label>
                <input
                  type="number"
                  value={groupSize}
                  onChange={(e) => setGroupSize(Number(e.target.value))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-black"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black">Тема</label>
                <input
                  type="text"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  placeholder="Наприклад: FIFA25_Division"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-black"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black">Тип сортування</label>
                <select
                  value={sortType}
                  onChange={(e) => setSortType(e.target.value as 'RandomSwizz' | 'NoRandomSwizz')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-black"
                >
                  <option value="RandomSwizz" className="text-black">Випадкове розподілення</option>
                  <option value="NoRandomSwizz" className="text-black">Розподілення по місцях (змійка)</option>
                </select>
              </div>

              <button
                onClick={handleCreateGroups}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Створити групи
              </button>
            </div>

            {groups && (
              <div className="mt-8">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Створені групи</h2>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(groups.groups).map(([groupName, players]) => (
                      <div key={groupName} className="bg-white p-4 rounded shadow">
                        <h3 className="font-medium text-gray-900 mb-2">{groupName}</h3>
                        <ul className="list-disc list-inside">
                          {players.map((playerId) => (
                            <li key={playerId} className="text-black">ID: {playerId}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 text-sm text-black">
                    <p>Всього груп: {groups.totalGroups}</p>
                    <p>Всього гравців: {groups.totalPlayers}</p>
                    <p>Тема: {groups.theme}</p>
                    <p>Тип сортування: {groups.sortType}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AuthLayout>
  );
} 