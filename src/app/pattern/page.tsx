'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthLayout from '@/components/AuthLayout';
import { useAuth } from '@/contexts/AuthContext';
import { ApiService } from '@/config/apiService';

type TournamentType = 'league' | 'swiss';

interface Tournament {
  id: number;
  name: string;
  status: string;
}

export default function PatternPage() {
  const router = useRouter();
  const { token } = useAuth();
  const [selectedType, setSelectedType] = useState<TournamentType>('league');
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTournaments = async () => {
      if (!token) return;
      setLoading(true);
      setError('');
      
      try {
        const endpoint = selectedType === 'league' 
          ? 'http://31.202.133.123:8080/api/league/tournaments'
          : 'http://31.202.133.123:8080/api/swiss/tournaments';

        const response = await fetch(endpoint, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) throw new Error('Failed to fetch tournaments');
        
        const data = await response.json();
        setTournaments(data);
      } catch (err) {
        setError('Помилка при завантаженні турнірів');
      } finally {
        setLoading(false);
      }
    };

    fetchTournaments();
  }, [token, selectedType]);

  const handleTypeSelect = (type: TournamentType) => {
    setSelectedType(type);
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      ACTIVE: 'Активний',
      FINISHED: 'Завершений',
      CANCELED: 'Скасований',
      CREATED: 'Створений',
      REGISTRATION_OPEN: 'Відкрита реєстрація',
      IN_PROGRESS: 'В процесі',
      COMPLETED: 'Завершений'
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      ACTIVE: 'bg-green-100 text-green-800',
      FINISHED: 'bg-gray-100 text-gray-800',
      CANCELED: 'bg-red-100 text-red-800',
      CREATED: 'bg-yellow-100 text-yellow-800',
      REGISTRATION_OPEN: 'bg-green-100 text-green-800',
      IN_PROGRESS: 'bg-blue-100 text-blue-800',
      COMPLETED: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const handleNavigateToTournament = (id: number) => {
    router.push(`/${selectedType}/tournaments/${id}`);
  };

  return (
    <AuthLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Вибір турніру</h1>

        <div className="space-y-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Тип турніру</h2>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleTypeSelect('league')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedType === 'league'
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-lg font-medium mb-2">Ліга</div>
                <p className="text-sm text-gray-500">
                  Класичний формат ліги, де кожна команда грає з кожною
                </p>
              </button>

              <button
                onClick={() => handleTypeSelect('swiss')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedType === 'swiss'
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-lg font-medium mb-2">Швейцарка</div>
                <p className="text-sm text-gray-500">
                  Швейцарська система турніру з раундами
                </p>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 bg-gray-50 border-b">
              <h2 className="text-lg font-medium text-gray-900">
                {selectedType === 'league' ? 'Доступні ліги' : 'Доступні турніри'}
              </h2>
            </div>
            
            {loading ? (
              <div className="p-4 text-center text-gray-500">Завантаження...</div>
            ) : error ? (
              <div className="p-4 text-center text-red-500">{error}</div>
            ) : tournaments.length === 0 ? (
              <div className="p-4 text-center text-gray-500">Турніри не знайдено</div>
            ) : (
              <div className="divide-y divide-gray-200">
                {tournaments.map((tournament) => (
                  <div
                    key={tournament.id}
                    onClick={() => handleNavigateToTournament(tournament.id)}
                    className="p-4 hover:bg-gray-50 cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{tournament.name}</div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(tournament.status)}`}>
                        {getStatusLabel(tournament.status)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthLayout>
  );
} 