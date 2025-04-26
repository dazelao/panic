'use client';

import { getLeagues } from '@/api/leagues';
import AuthLayout from '@/components/AuthLayout';
import CreateLeagueModal from '@/components/CreateLeagueModal';
import AddParticipantModal from '@/components/AddParticipantModal';
import { useAuth } from '@/contexts/AuthContext';
import { League, LeagueStatus } from '@/types/league';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';

function LeagueStatusBadge({ status }: { status: string }) {
  const labels: Record<string, string> = {
    DRAFT: 'Черновик',
    REGISTRATION: 'Реєстрація',
    ACTIVE: 'Активна',
    FINISHED: 'Завершена',
    CANCELED: 'Скасована',
  };
  const colors: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-800',
    REGISTRATION: 'bg-yellow-100 text-yellow-800',
    ACTIVE: 'bg-green-100 text-green-800',
    FINISHED: 'bg-blue-100 text-blue-800',
    CANCELED: 'bg-red-100 text-red-800',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-200 text-gray-800'}`}>
      {labels[status] || status}
    </span>
  );
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('uk-UA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

const statusOrder: { [key: string]: number } = {
  REGISTRATION: 0,
  ACTIVE: 1,
  FINISHED: 2,
  CANCELED: 3,
  DRAFT: 4,
};

export default function LeaguesPage() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeagueStatus | undefined>();
  const [mounted, setMounted] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedLeagueId, setSelectedLeagueId] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchLeagues = async () => {
    try {
      if (token) {
        const data = await getLeagues(token);
        setLeagues(data);
        setError('');
      }
    } catch (err) {
      setError('Не вдалося отримати ліги');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeagues();
  }, [token]);

  const filteredAndSortedLeagues = useMemo(() => {
    let result = [...leagues];
    
    if (statusFilter) {
      result = result.filter(league => league.status === statusFilter);
    }
    
    return result.sort((a, b) => {
      return statusOrder[a.status] - statusOrder[b.status];
    });
  }, [leagues, statusFilter]);

  const isAdmin = user?.role === 'ADMIN';

  if (!mounted) {
    return null;
  }

  return (
    <AuthLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Ліги</h1>
          <div className="flex gap-4 items-center">
            <select
              value={statusFilter || ''}
              onChange={(e) => setStatusFilter(e.target.value as LeagueStatus || undefined)}
              className="block rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900"
            >
              <option value="">Всі статуси</option>
              <option value="DRAFT">Реєстрація</option>
              <option value="ACTIVE">Активна</option>
              <option value="FINISHED">Завершена</option>
            </select>
            {isAdmin && (
              <button
                onClick={() => router.push('/league/create')}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Створити лігу
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-4 text-red-500 text-sm">{error}</div>
        )}

        {loading ? (
          <div className="text-center py-12">Завантаження...</div>
        ) : filteredAndSortedLeagues.length === 0 ? (
          <div className="text-center py-12 text-gray-500">Ліги не знайдено</div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {filteredAndSortedLeagues.map((league) => (
                <li key={league.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <h3 className="text-lg font-medium text-gray-900">{league.name}</h3>
                        <p className="mt-1 text-sm text-gray-500">{league.description}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <LeagueStatusBadge status={league.status} />
                        <span className="text-sm text-gray-500">
                          {league.participantCount} / {league.maxParticipants} учасників
                        </span>
                        <div className="flex gap-2">
                          {league.status === 'DRAFT' && (
                            <button
                              onClick={() => setSelectedLeagueId(league.id)}
                              className="px-3 py-1 rounded bg-green-600 text-white text-xs font-medium hover:bg-green-700 transition"
                            >
                              Додати учасника
                            </button>
                          )}
                          <a
                            href={`/leagues/${league.id}`}
                            className="px-3 py-1 rounded bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 transition"
                          >
                            Детальніше
                          </a>
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500">
                          Дата створення: {formatDate(league.createdDate)}
                        </p>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {isCreateModalOpen && token && (
          <CreateLeagueModal
            token={token}
            onClose={() => setIsCreateModalOpen(false)}
            onSuccess={fetchLeagues}
          />
        )}

        {selectedLeagueId && token && (
          <AddParticipantModal
            open={true}
            onClose={() => setSelectedLeagueId(null)}
            leagueId={selectedLeagueId?.toString() || ''}
            token={token}
            onSuccess={fetchLeagues}
          />
        )}
      </div>
    </AuthLayout>
  );
} 