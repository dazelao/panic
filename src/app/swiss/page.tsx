'use client';

import AuthLayout from '@/components/AuthLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { Dialog, DialogTitle, DialogContent, Snackbar } from '@mui/material';
import { API_BASE_URL } from '@/config/api';
import './swiss.css';

interface Tournament {
  id: number;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'CREATED' | 'REGISTRATION_OPEN' | 'REGISTRATION_CLOSED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  maxPlayers: number;
  currentRound: number;
  totalRounds: number;
  registeredPlayers: number;
  winnerId: number | null;
  winnerUsername: string | null;
  participantCount?: number;
  maxParticipants?: number;
  createdDate?: string;
}

interface Participant {
  id: number;
  userId: number;
  userName: string;
}

interface User {
  id: number;
  username: string;
  telegram?: string;
  eaId?: string;
}

interface Match {
  id: number;
  tournamentId: number;
  player1Id: number;
  player1Username: string;
  player2Id: number;
  player2Username: string;
  round: number;
  player1Score: number | null;
  player2Score: number | null;
  status: string;
  scheduledTime: string;
  completedTime: string | null;
  matchUrl: string | null;
  bye: boolean;
}

interface PlayerResult {
  id: number;
  userId: number;
  username: string;
  points: number;
  wins: number;
  losses: number;
  draws: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  place: number | null;
  buchholzScore: number;
  medianBuchholzScore: number;
}

type TournamentStatus = 'CREATED' | 'REGISTRATION_OPEN' | 'REGISTRATION_CLOSED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

const STATUS_PRIORITY: Record<string, number> = {
  'REGISTRATION_OPEN': 0,
  'REGISTRATION_CLOSED': 1,
  'IN_PROGRESS': 2,
  'COMPLETED': 3,
  'CREATED': 4,
  'CANCELLED': 5
};

function TournamentStatusBadge({ status }: { status: string }) {
  const labels: Record<string, string> = {
    CREATED: 'Черновик',
    REGISTRATION_OPEN: 'Реєстрація',
    REGISTRATION_CLOSED: 'Реєстрація закрита',
    IN_PROGRESS: 'Активний',
    COMPLETED: 'Завершений',
    CANCELED: 'Скасований',
  };
  const colors: Record<string, string> = {
    CREATED: 'bg-gray-100 text-gray-800',
    REGISTRATION_OPEN: 'bg-yellow-100 text-yellow-800',
    REGISTRATION_CLOSED: 'bg-orange-100 text-orange-800',
    IN_PROGRESS: 'bg-green-100 text-green-800',
    COMPLETED: 'bg-blue-100 text-blue-800',
    CANCELED: 'bg-red-100 text-red-800',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
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

export default function SwissPage() {
  const router = useRouter();
  const { token, user } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState('');
  const [matches, setMatches] = useState<Match[]>([]);
  const [expandedParticipant, setExpandedParticipant] = useState<number | null>(null);
  const [participantDetails, setParticipantDetails] = useState<{[key: number]: User}>({});
  const [activeMatchesTab, setActiveMatchesTab] = useState<'current' | 'my'>('my');
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');
  const [usersModalOpen, setUsersModalOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [attributeKey, setAttributeKey] = useState('');
  const [attributeValue, setAttributeValue] = useState('');
  const [matchesModalOpen, setMatchesModalOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [updateError, setUpdateError] = useState('');
  const [results, setResults] = useState<PlayerResult[]>([]);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [nextRoundLoading, setNextRoundLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<TournamentStatus | ''>('');
  const [participantsCollapsed, setParticipantsCollapsed] = useState(true);
  const [showAllParticipants, setShowAllParticipants] = useState(false);
  const [participantSearch, setParticipantSearch] = useState('');

  useEffect(() => {
    const fetchTournaments = async () => {
      if (!token) return;
      setLoading(true);
      setError('');
      
      try {
        const response = await fetch(`${API_BASE_URL}/swiss/tournaments`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch tournaments');
        }
        
        const data = await response.json();
        setTournaments(Array.isArray(data) ? data : []);
      } catch (err) {
        setError('Не вдалося отримати турніри');
      } finally {
        setLoading(false);
      }
    };

    fetchTournaments();
  }, [token]);

  const filteredAndSortedTournaments = useMemo(() => {
    let result = [...tournaments];
    
    if (statusFilter) {
      result = result.filter(tournament => tournament.status === statusFilter);
    }
    
    return result.sort((a, b) => {
      return (statusOrder[a.status] || 999) - (statusOrder[b.status] || 999);
    });
  }, [tournaments, statusFilter]);

  const fetchTournamentDetails = async (id: number) => {
    setDetailsLoading(true);
    setParticipantsLoading(true);
    setMatchesLoading(true);
    setResultsLoading(true);
    try {
      if (!token) return;
      
      // Загружаем детали турнира
      const tournamentResponse = await fetch(`${API_BASE_URL}/swiss/tournaments/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!tournamentResponse.ok) throw new Error('Failed to fetch tournament details');
      const tournamentData = await tournamentResponse.json();
      setSelectedTournament(tournamentData);

      // Загружаем список участников
      const participantsResponse = await fetch(`${API_BASE_URL}/swiss/tournaments/${id}/participants`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!participantsResponse.ok) throw new Error('Failed to fetch participants');
      const participantsData = await participantsResponse.json();
      setParticipants(participantsData);

      // Загружаем список матчей
      const matchesResponse = await fetch(`${API_BASE_URL}/swiss/tournaments/${id}/matches/current`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!matchesResponse.ok) throw new Error('Failed to fetch matches');
      const matchesData = await matchesResponse.json();
      setMatches(matchesData);

      // Загружаем результаты
      const resultsResponse = await fetch(`${API_BASE_URL}/swiss/tournaments/${id}/results`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!resultsResponse.ok) throw new Error('Failed to fetch results');
      
      const resultsData = await resultsResponse.json();
      setResults(resultsData);
    } catch (err) {
      console.error('Error fetching tournament data:', err);
      setSnackbarMsg('Помилка при завантаженні даних');
      setSnackbarOpen(true);
    } finally {
      setDetailsLoading(false);
      setParticipantsLoading(false);
      setMatchesLoading(false);
      setResultsLoading(false);
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      REGISTRATION_OPEN: 'Відкрита реєстрація',
      IN_PROGRESS: 'В процесі',
      COMPLETED: 'Завершений',
      CANCELED: 'Скасований'
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      REGISTRATION_OPEN: 'bg-green-100 text-green-800',
      IN_PROGRESS: 'bg-blue-100 text-blue-800',
      COMPLETED: 'bg-gray-100 text-gray-800',
      CANCELED: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const handleParticipantClick = async (participant: Participant) => {
    if (expandedParticipant === participant.id) {
      setExpandedParticipant(null);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/users/${participant.userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }

      const userData = await response.json();
      setParticipantDetails(prev => ({ ...prev, [participant.id]: userData }));
      setExpandedParticipant(participant.id);
    } catch (error) {
      console.error('Error:', error);
      setSnackbarMsg('Помилка отримання даних користувача');
      setSnackbarOpen(true);
    }
  };

  const handleCopyField = async (text: string, participantId: number) => {
    try {
      // Modern clipboard API
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for older browsers and mobile devices
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          document.execCommand('copy');
        } catch (err) {
          console.error('Fallback copy failed:', err);
        }
        
        document.body.removeChild(textArea);
      }
      
      setCopiedId(participantId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      // Show error message to user
      setSnackbarMsg('Помилка копіювання. Спробуйте ще раз.');
      setSnackbarOpen(true);
    }
  };

  const getMatchStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      SCHEDULED: 'Заплановано',
      IN_PROGRESS: 'В процесі',
      COMPLETED: 'Завершено',
      CANCELED: 'Скасовано'
    };
    return labels[status] || status;
  };

  const getMatchStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      SCHEDULED: 'bg-blue-100 text-blue-800',
      IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
      COMPLETED: 'bg-green-100 text-green-800',
      CANCELED: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const handleCreateSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError('');

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name'),
      description: formData.get('description'),
      maxPlayers: parseInt(formData.get('maxPlayers') as string),
      startDate: formData.get('startDate'),
      endDate: formData.get('endDate')
    };

    try {
      const response = await fetch(`${API_BASE_URL}/swiss/tournaments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Failed to create tournament');
      }

      setCreateModalOpen(false);
      // Перезагружаем список турниров
      const tournamentsResponse = await fetch(`${API_BASE_URL}/swiss/tournaments`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (tournamentsResponse.ok) {
        const data = await tournamentsResponse.json();
        setTournaments(data);
      }
    } catch (err) {
      setCreateError('Помилка при створенні турніру');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleOpenRegistration = async (tournamentId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/swiss/tournaments/${tournamentId}/open`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to open registration');
      }

      // Обновляем информацию о турнире
      await fetchTournamentDetails(tournamentId);
      setSnackbarMsg('Реєстрацію відкрито успішно');
      setSnackbarOpen(true);
    } catch (err) {
      setSnackbarMsg('Помилка при відкритті реєстрації');
      setSnackbarOpen(true);
    }
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      let url = `${API_BASE_URL}/users`;
      
      // Если есть ключ или значение атрибута, используем поиск по атрибутам
      if (attributeKey || attributeValue) {
        url = `${API_BASE_URL}/users/by-attribute`;
        const params = new URLSearchParams();
        if (attributeKey) params.append('key', attributeKey);
        if (attributeValue) params.append('value', attributeValue);
        url += `?${params.toString()}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setSnackbarMsg('Помилка при завантаженні користувачів');
      setSnackbarOpen(true);
    } finally {
      setUsersLoading(false);
    }
  };

  const handleCurrentUserRegister = async () => {
    if (!selectedTournament) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/swiss/tournaments/${selectedTournament.id}/register`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to register');

      await fetchTournamentDetails(selectedTournament.id);
      setSnackbarMsg('Ви успішно зареєструвались');
      setSnackbarOpen(true);
    } catch (err) {
      setSnackbarMsg('Помилка при реєстрації');
      setSnackbarOpen(true);
    }
  };

  const handleCurrentUserUnregister = async () => {
    if (!selectedTournament) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/swiss/tournaments/${selectedTournament.id}/unregister`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to unregister');

      await fetchTournamentDetails(selectedTournament.id);
      setSnackbarMsg('Реєстрацію скасовано');
      setSnackbarOpen(true);
    } catch (err) {
      setSnackbarMsg('Помилка при скасуванні реєстрації');
      setSnackbarOpen(true);
    }
  };

  const handleStartTournament = async () => {
    if (!selectedTournament) return;
    
    try {
      // Сначала закрываем регистрацию
      const closeResponse = await fetch(`${API_BASE_URL}/swiss/tournaments/${selectedTournament.id}/close`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!closeResponse.ok) throw new Error('Failed to close registration');

      // Затем запускаем турнир
      const startResponse = await fetch(`${API_BASE_URL}/swiss/tournaments/${selectedTournament.id}/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!startResponse.ok) throw new Error('Failed to start tournament');

      await fetchTournamentDetails(selectedTournament.id);
      setSnackbarMsg('Турнір успішно запущено');
      setSnackbarOpen(true);
    } catch (err) {
      setSnackbarMsg('Помилка при запуску турніру');
      setSnackbarOpen(true);
    }
  };

  const handleCancelTournament = async () => {
    if (!selectedTournament) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/swiss/tournaments/${selectedTournament.id}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to cancel tournament');

      await fetchTournamentDetails(selectedTournament.id);
      setSnackbarMsg('Турнір скасовано');
      setSnackbarOpen(true);
    } catch (err) {
      setSnackbarMsg('Помилка при скасуванні турніру');
      setSnackbarOpen(true);
    }
  };

  const handleUpdateMatch = async (matchId: number, player1Score: number, player2Score: number) => {
    // Проверяем что счет не равный
    if (player1Score === player2Score) {
      setUpdateError('Нічия неможлива. Має бути переможець.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/swiss/matches/${matchId}/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          matchId,
          player1Score,
          player2Score
        })
      });

      if (!response.ok) throw new Error('Failed to update match');

      // Обновляем список матчей
      if (selectedTournament) {
        await fetchTournamentDetails(selectedTournament.id);
      }
      setEditingMatch(null);
      setUpdateError(''); // Очищаем ошибку при успешном сохранении
      setSnackbarMsg('Результат матчу оновлено');
      setSnackbarOpen(true);
    } catch (err) {
      setUpdateError('Помилка при оновленні результату');
    }
  };

  const handleNextRound = async () => {
    if (!selectedTournament) return;
    
    setNextRoundLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/swiss/tournaments/${selectedTournament.id}/next-round`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to proceed to next round');

      await fetchTournamentDetails(selectedTournament.id);
      setSnackbarMsg('Перехід до наступного раунду успішний');
      setSnackbarOpen(true);
    } catch (err) {
      setSnackbarMsg('Помилка при переході до наступного раунду');
      setSnackbarOpen(true);
    } finally {
      setNextRoundLoading(false);
    }
  };

  const allMatchesCompleted = matches.length > 0 && matches.every(match => match.status === 'COMPLETED');

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Сортировка результатов
  const sortedResults = [...results].sort((a, b) => {
    if (a.place !== null && b.place !== null) {
      return a.place - b.place;
    }
    if (a.points !== b.points) {
      return b.points - a.points;
    }
    if (a.medianBuchholzScore !== b.medianBuchholzScore) {
      return b.medianBuchholzScore - a.medianBuchholzScore;
    }
    if (a.buchholzScore !== b.buchholzScore) {
      return b.buchholzScore - a.buchholzScore;
    }
    if (a.goalDifference !== b.goalDifference) {
    return b.goalDifference - a.goalDifference;
    }
    return b.goalsAgainst - a.goalsAgainst;
  });

  const handleRegisterUser = async (userId: number) => {
    if (!selectedTournament) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/swiss/tournaments/${selectedTournament.id}/register/${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to register user');

      await fetchTournamentDetails(selectedTournament.id);
      setSnackbarMsg('Користувача успішно зареєстровано');
      setSnackbarOpen(true);
    } catch (err) {
      setSnackbarMsg('Помилка при реєстрації користувача');
      setSnackbarOpen(true);
    }
  };

  const handleUnregisterUser = async (userId: number) => {
    if (!selectedTournament) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/swiss/tournaments/${selectedTournament.id}/unregister/${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to unregister user');

      await fetchTournamentDetails(selectedTournament.id);
      setSnackbarMsg('Користувача видалено з турніру');
      setSnackbarOpen(true);
    } catch (err) {
      setSnackbarMsg('Помилка при видаленні користувача');
      setSnackbarOpen(true);
    }
  };

  // Фильтруем матчи текущего пользователя
  const myMatches = matches.filter(match => 
    user && (match.player1Username === user.username || match.player2Username === user.username)
  );

  // Обработчик для принудительного пересчета
  const handleRecalculation = async (tournamentId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/swiss/recalculation/tournaments/${tournamentId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to recalculate');

      await fetchTournamentDetails(tournamentId);
      setSnackbarMsg('Перерахунок успішно виконано');
      setSnackbarOpen(true);
    } catch (err) {
      setSnackbarMsg('Помилка при виконанні перерахунку');
      setSnackbarOpen(true);
    }
  };

  const filteredParticipants = participants.filter(p => p.userName.toLowerCase().includes(participantSearch.toLowerCase()));

  return (
    <AuthLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight border-b border-slate-200 pb-2 bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
            Swiss system
          </h1>
        </div>
        <div className="flex items-center justify-between gap-4 mb-6">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as TournamentStatus | '')}
            className="min-w-[180px] px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm text-gray-900"
          >
            <option value="">Всі статуси</option>
            <option value="CREATED">Черновик</option>
            <option value="REGISTRATION_OPEN">Реєстрація</option>
            <option value="REGISTRATION_CLOSED">Реєстрація закрита</option>
            <option value="IN_PROGRESS">Активний</option>
            <option value="COMPLETED">Завершений</option>
            <option value="CANCELLED">Скасований</option>
          </select>
          {user?.role === 'ADMIN' && (
            <button
              onClick={() => setCreateModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm font-medium"
            >
              Створити турнір
            </button>
          )}
        </div>

        {error && (
          <div className="mb-4 text-red-500 text-sm">{error}</div>
        )}

        {loading ? (
          <div className="text-center py-12">Завантаження...</div>
        ) : filteredAndSortedTournaments.length === 0 ? (
          <div className="text-center py-12 text-gray-500">Турніри не знайдено</div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {filteredAndSortedTournaments.map((tournament) => (
                <li key={tournament.id} className="hover:bg-gray-50">
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col flex-grow">
                        <div className="flex items-center">
                          <h3 className="text-lg font-medium text-gray-900 mr-3">{tournament.name}</h3>
                          <TournamentStatusBadge status={tournament.status} />
                        </div>
                        <p className="mt-1 text-sm text-gray-500">{tournament.description}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex flex-col items-end text-sm text-gray-500">
                          <div>Учасників: {tournament.registeredPlayers}/{tournament.maxPlayers}</div>
                          <div>Раунд: {tournament.currentRound}/{tournament.totalRounds}</div>
                        </div>
                        <button
                          onClick={() => fetchTournamentDetails(tournament.id)}
                          className="px-3 py-1 rounded bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 transition"
                        >
                          Детальніше
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500">
                          {tournament.startDate && `Дата початку: ${formatDate(tournament.startDate)}`}
                        </p>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <Dialog 
          open={!!selectedTournament} 
          onClose={() => setSelectedTournament(null)}
          maxWidth="sm"
          fullWidth
        >
          {detailsLoading ? (
            <DialogContent>
              <div className="py-4 text-center">Завантаження...</div>
            </DialogContent>
          ) : selectedTournament && (
            <>
              <DialogTitle>
                <div className="flex items-center justify-between">
                  <span>{selectedTournament.name}</span>
                  <div className="flex items-center space-x-2">
                    <TournamentStatusBadge status={selectedTournament.status} />
                    {user?.role === 'ADMIN' && selectedTournament.status === 'REGISTRATION_OPEN' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={handleStartTournament}
                          className="px-3 py-1 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                        >
                          Запустити
                        </button>
                        <button
                          onClick={handleCancelTournament}
                          className="px-3 py-1 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                        >
                          Скасувати
                        </button>
                      </div>
                    )}
                    {user?.role === 'ADMIN' && (selectedTournament.status === 'IN_PROGRESS' || selectedTournament.status === 'COMPLETED') && (
                      <button
                        onClick={() => handleRecalculation(selectedTournament.id)}
                        className="px-3 py-1 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700"
                      >
                        Примусовий перерахунок
                      </button>
                    )}
                    {selectedTournament.status === 'REGISTRATION_OPEN' && (
                      user?.role === 'ADMIN' ? (
                        <button
                          onClick={() => {
                            setUsersModalOpen(true);
                            fetchUsers();
                          }}
                          className="px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                        >
                          Додати учасника
                        </button>
                      ) : (
                        participants.some(p => p.userId === user?.id) ? (
                          <button
                            onClick={handleCurrentUserUnregister}
                            className="px-3 py-1 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                          >
                            Скасувати реєстрацію
                          </button>
                        ) : (
                          <button
                            onClick={handleCurrentUserRegister}
                            className="px-3 py-1 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                          >
                            Зареєструватися
                          </button>
                        )
                      )
                    )}
                    {user?.role === 'ADMIN' && selectedTournament.status === 'IN_PROGRESS' && (
                      <button
                        onClick={() => setMatchesModalOpen(true)}
                        className="px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                      >
                        Матчі
                      </button>
                    )}
                  </div>
                </div>
              </DialogTitle>
              <DialogContent>
                <div className="space-y-4">
                  <p className="text-gray-600">{selectedTournament.description}</p>
                  
                  <div className="bg-gray-50 p-4 rounded-lg mt-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium text-gray-900">Інформація про турнір</h4>
                      {user?.role === 'ADMIN' && selectedTournament.status === 'CREATED' && (
                        <button
                          onClick={() => handleOpenRegistration(selectedTournament.id)}
                          className="px-3 py-1 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                        >
                          Відкрити реєстрацію
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Початок:</span>
                        <div className="text-gray-900">{formatDate(selectedTournament.startDate)}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Кінець:</span>
                        <div className="text-gray-900">{formatDate(selectedTournament.endDate)}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Учасники:</span>
                        <div className="text-gray-900">{selectedTournament.registeredPlayers}/{selectedTournament.maxPlayers}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Раунд:</span>
                        <div className="text-gray-900">{selectedTournament.currentRound}/{selectedTournament.totalRounds}</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg mt-4">
                    <h4 className="font-medium text-gray-900 mb-2">Результати</h4>
                    {resultsLoading ? (
                      <div className="text-center py-4">Завантаження результатів...</div>
                    ) : results.length === 0 ? (
                      <div className="text-center py-4 text-gray-500">Результатів поки немає</div>
                    ) : (
                      <div>
                        <table className="min-w-full rounded-xl shadow-lg border border-blue-200 bg-blue-50">
                          <thead className="bg-blue-100 border-b-2 border-blue-300">
                            <tr>
                              <th scope="col" className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Гравець
                              </th>
                              <th scope="col" className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                В
                              </th>
                              <th scope="col" className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                П
                              </th>
                              <th scope="col" className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Н
                              </th>
                              <th scope="col" className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                ЗМ
                              </th>
                              <th scope="col" className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                ПМ
                              </th>
                              <th scope="col" className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                РМ
                              </th>
                              <th scope="col" className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <span className="tooltip-container">
                                  Б
                                  <div className="tooltip">
                                    Коефіцієнт Бухгольца
                                  </div>
                                </span>
                              </th>
                              <th scope="col" className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                О
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-blue-50 divide-y divide-blue-100">
                            {sortedResults.map((result, index) => (
                              <tr key={result.id} className="bg-blue-50">
                                <td className="px-2 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                                  <span className="inline-flex items-center">
                                    <span className="font-semibold text-indigo-600 mr-2">{index + 1}.</span>
                                    {result.username}
                                  </span>
                                </td>
                                <td className="px-2 py-2 whitespace-nowrap text-sm text-center text-gray-500">
                                  {result.wins}
                                </td>
                                <td className="px-2 py-2 whitespace-nowrap text-sm text-center text-gray-500">
                                  {result.losses}
                                </td>
                                <td className="px-2 py-2 whitespace-nowrap text-sm text-center text-gray-500">
                                  {result.draws}
                                </td>
                                <td className="px-2 py-2 whitespace-nowrap text-sm text-center text-gray-500">
                                  {result.goalsFor}
                                </td>
                                <td className="px-2 py-2 whitespace-nowrap text-sm text-center text-gray-500">
                                  {result.goalsAgainst}
                                </td>
                                <td className="px-2 py-2 whitespace-nowrap text-sm text-center text-gray-500">
                                  {result.goalDifference}
                                </td>
                                <td className="px-2 py-2 whitespace-nowrap text-sm text-center text-gray-500">
                                  {result.buchholzScore}
                                </td>
                                <td className="px-2 py-2 whitespace-nowrap text-sm text-center font-medium text-gray-900">
                                  {result.points}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">Учасники турніру</h4>
                      <button
                        className={`flex items-center gap-1 text-sm px-3 py-1 border rounded-md transition bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100 focus:outline-none`}
                        onClick={() => setParticipantsCollapsed((prev) => !prev)}
                      >
                        {participantsCollapsed ? 'Показати' : 'Сховати'}
                        <span style={{ display: 'inline-block', transition: 'transform 0.2s', transform: participantsCollapsed ? 'rotate(0deg)' : 'rotate(180deg)' }}>
                          ▼
                        </span>
                      </button>
                    </div>
                    {!participantsCollapsed && (
                      <>
                        <input
                          type="text"
                          placeholder="Пошук учасника..."
                          className="mb-3 w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                          value={participantSearch}
                          onChange={e => {
                            setParticipantSearch(e.target.value);
                            setShowAllParticipants(false);
                          }}
                        />
                        {participantsLoading ? (
                          <div className="text-center py-4">Завантаження учасників...</div>
                        ) : filteredParticipants.length === 0 ? (
                          <div className="text-center py-4 text-gray-500">Немає зареєстрованих учасників</div>
                        ) : (
                          <>
                            <div className="grid grid-cols-3 gap-4">
                              {(showAllParticipants ? filteredParticipants : filteredParticipants.slice(0, 6)).map((participant) => (
                                <div 
                                  key={participant.id}
                                  className="p-3 bg-gray-200 rounded-lg text-sm font-medium text-gray-900 text-center hover:bg-gray-300 transition-colors cursor-pointer relative"
                                >
                                  <div 
                                    onClick={() => handleParticipantClick(participant)}
                                    className="cursor-pointer"
                                  >
                                    {participant.userName}
                                  </div>
                                  
                                  {expandedParticipant === participant.id && participantDetails[participant.id] && (
                                    <div className="mt-3 space-y-2 text-left">
                                      <div className="flex items-center justify-between">
                                        <span className="text-xs text-gray-600">EA ID:</span>
                                        <div className="flex items-center gap-1">
                                          <span className={`text-xs font-medium ${!participantDetails[participant.id].eaId ? 'text-gray-400 italic' : ''}`}>
                                            {participantDetails[participant.id].eaId || 'Учасник не зазначив EA ID'}
                                          </span>
                                          {participantDetails[participant.id].eaId && (
                                            <button
                                              onClick={() => handleCopyField(participantDetails[participant.id].eaId || '', participant.id)}
                                              className="p-1 text-gray-400 hover:text-gray-600"
                                              title="Скопіювати EA ID"
                                            >
                                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                              </svg>
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <span className="text-xs text-gray-600">Telegram:</span>
                                        <div className="flex items-center gap-1">
                                          <span className={`text-xs font-medium ${!participantDetails[participant.id].telegram ? 'text-gray-400 italic' : ''}`}>
                                            {participantDetails[participant.id].telegram || 'Учасник не зазначив Telegram'}
                                          </span>
                                          {participantDetails[participant.id].telegram && (
                                            <button
                                              onClick={() => handleCopyField(participantDetails[participant.id].telegram || '', participant.id)}
                                              className="p-1 text-gray-400 hover:text-gray-600"
                                              title="Скопіювати Telegram"
                                            >
                                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                              </svg>
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {copiedId === participant.id && (
                                    <div 
                                      className="absolute top-0 right-0 mt-1 mr-1 px-2 py-0.5 bg-green-400/60 text-black text-xs font-semibold rounded"
                                      style={{ animation: 'fadeout 2s forwards' }}
                                    >
                                      Скопійовано!
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                            {filteredParticipants.length > 6 && !showAllParticipants && (
                              <div className="flex justify-center mt-3">
                                <button
                                  className="px-4 py-1 text-sm border rounded-md bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100"
                                  onClick={() => setShowAllParticipants(true)}
                                >
                                  Показати всіх
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </>
                    )}
                  </div>

                  <div className="bg-purple-50 p-4 rounded-lg mt-4">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={() => setActiveMatchesTab('my')}
                          className={`px-3 py-1 text-sm font-medium rounded-md ${activeMatchesTab === 'my' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                          Мої матчі
                        </button>
                        <button
                          onClick={() => {
                            setActiveMatchesTab('current');
                            selectedTournament && fetchTournamentDetails(selectedTournament.id);
                          }}
                          className={`px-3 py-1 text-sm font-medium rounded-md ${activeMatchesTab === 'current' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                          Поточні матчі
                        </button>
                      </div>
                      {user?.role === 'ADMIN' && selectedTournament?.status === 'IN_PROGRESS' && allMatchesCompleted && activeMatchesTab === 'current' && (
                        <button
                          onClick={handleNextRound}
                          disabled={nextRoundLoading}
                          className="px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                          {nextRoundLoading ? 'Перехід...' : 'Наступний раунд'}
                        </button>
                      )}
                    </div>

                    {activeMatchesTab === 'current' ? (
                      matchesLoading ? (
                        <div className="text-center py-4">Завантаження матчів...</div>
                      ) : matches.length === 0 ? (
                        <div className="text-center py-4 text-gray-500">Матчів не знайдено</div>
                      ) : (
                        <div className="space-y-3">
                          {matches.map((match) => (
                            <div 
                              key={match.id} 
                              className="bg-purple-100 p-4 rounded-lg shadow-sm border border-gray-200"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-500">
                                  Раунд {match.round}
                                </span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMatchStatusColor(match.status)}`}>
                                  {getMatchStatusLabel(match.status)}
                                </span>
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <div className="flex-1 text-center">
                                  <div className="font-medium">{match.player1Username}</div>
                                  <div className="text-2xl font-bold text-gray-900">
                                    {match.player1Score ?? '-'}
                                  </div>
                                </div>
                                
                                <div className="mx-4 text-gray-400">vs</div>
                                
                                <div className="flex-1 text-center">
                                  <div className="font-medium">{match.player2Username}</div>
                                  <div className="text-2xl font-bold text-gray-900">
                                    {match.player2Score ?? '-'}
                                  </div>
                                </div>
                              </div>

                              {match.scheduledTime && (
                                <div className="mt-2 text-center text-sm text-gray-500">
                                  {formatDate(match.scheduledTime)}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )
                    ) : (
                      !user ? (
                        <div className="text-center py-4 text-gray-500">Необхідно авторизуватися</div>
                      ) : myMatches.length === 0 ? (
                        <div className="text-center py-4 text-gray-500">У вас немає матчів</div>
                      ) : (
                        <div className="space-y-3">
                          {myMatches.map((match) => (
                            <div 
                              key={match.id} 
                              className="bg-purple-100 p-4 rounded-lg shadow-sm border border-gray-200"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-500">
                                  Раунд {match.round}
                                </span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMatchStatusColor(match.status)}`}>
                                  {getMatchStatusLabel(match.status)}
                                </span>
                              </div>

                              {editingMatch?.id === match.id ? (
                                <div className="space-y-4">
                                  <div className="flex items-center justify-between gap-4">
                                    <div className="flex-1">
                                      <div className="font-medium mb-1">{match.player1Username}</div>
                                      <input
                                        type="number"
                                        min="0"
                                        defaultValue={match.player1Score || 0}
                                        className="w-full px-2 py-1 border border-gray-300 rounded-md"
                                        id={`player1Score-${match.id}`}
                                      />
                                    </div>
                                    <div className="text-gray-400">vs</div>
                                    <div className="flex-1">
                                      <div className="font-medium mb-1">{match.player2Username}</div>
                                      <input
                                        type="number"
                                        min="0"
                                        defaultValue={match.player2Score || 0}
                                        className="w-full px-2 py-1 border border-gray-300 rounded-md"
                                        id={`player2Score-${match.id}`}
                                      />
                                    </div>
                                  </div>
                                  {updateError && (
                                    <div className="text-red-500 text-sm text-center">{updateError}</div>
                                  )}
                                  <div className="flex justify-end space-x-2">
                                    <button
                                      onClick={() => setEditingMatch(null)}
                                      className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                                    >
                                      Скасувати
                                    </button>
                                    <button
                                      onClick={() => {
                                        const player1Score = parseInt((document.getElementById(`player1Score-${match.id}`) as HTMLInputElement).value);
                                        const player2Score = parseInt((document.getElementById(`player2Score-${match.id}`) as HTMLInputElement).value);
                                        handleUpdateMatch(match.id, player1Score, player2Score);
                                      }}
                                      className="px-3 py-1 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                                    >
                                      Зберегти
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center justify-between">
                                  <div className="flex-1 text-center">
                                    <div className="font-medium">{match.player1Username}</div>
                                    <div className="text-2xl font-bold text-gray-900">
                                      {match.player1Score ?? '-'}
                                    </div>
                                  </div>
                                  <div className="mx-4 text-gray-400">vs</div>
                                  <div className="flex-1 text-center">
                                    <div className="font-medium">{match.player2Username}</div>
                                    <div className="text-2xl font-bold text-gray-900">
                                      {match.player2Score ?? '-'}
                                    </div>
                                  </div>
                                  {match.status !== 'COMPLETED' && (
                                    <button
                                      onClick={() => setEditingMatch(match)}
                                      className="ml-4 p-1 text-gray-400 hover:text-gray-600"
                                      title="Редагувати результат"
                                    >
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                      </svg>
                                    </button>
                                  )}
                                </div>
                              )}

                              {match.scheduledTime && (
                                <div className="mt-2 text-center text-sm text-gray-500">
                                  {formatDate(match.scheduledTime)}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )
                    )}
                  </div>
                </div>
              </DialogContent>
            </>
          )}
        </Dialog>

        <Dialog 
          open={createModalOpen} 
          onClose={() => setCreateModalOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <div className="flex items-center justify-between">
              <span>Створення турніру</span>
            </div>
          </DialogTitle>
          <DialogContent>
            <form onSubmit={handleCreateSubmit} className="space-y-6 pt-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Назва турніру
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Опис турніру
                </label>
                <textarea
                  name="description"
                  id="description"
                  required
                  rows={3}
                  className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="maxPlayers" className="block text-sm font-medium text-gray-700">
                  Максимальна кількість гравців
                </label>
                <input
                  type="number"
                  name="maxPlayers"
                  id="maxPlayers"
                  min="2"
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                  Дата та час початку
                </label>
                <input
                  type="datetime-local"
                  name="startDate"
                  id="startDate"
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                  Дата та час закінчення
                </label>
                <input
                  type="datetime-local"
                  name="endDate"
                  id="endDate"
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                />
              </div>

              {createError && (
                <div className="text-red-500 text-sm">{createError}</div>
              )}

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Скасувати
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {createLoading ? 'Створення...' : 'Створити турнір'}
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog
          open={usersModalOpen}
          onClose={() => setUsersModalOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <div className="flex items-center justify-between">
              <span>Додати учасника</span>
            </div>
          </DialogTitle>
          <DialogContent>
            {usersLoading ? (
              <div className="py-4 text-center">Завантаження користувачів...</div>
            ) : (
              <div className="space-y-4">
                <div className="sticky top-0 bg-white pt-4 pb-2 space-y-2">
                  <input
                    type="text"
                    placeholder="Пошук за ніком..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Ключ атрибута..."
                      value={attributeKey}
                      onChange={(e) => setAttributeKey(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <input
                      type="text"
                      placeholder="Значення атрибута..."
                      value={attributeValue}
                      onChange={(e) => setAttributeValue(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <button
                      onClick={fetchUsers}
                      className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                    >
                      Пошук
                    </button>
                  </div>
                </div>
                
                {filteredUsers.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    {searchQuery ? 'Користувачів не знайдено' : 'Немає доступних користувачів'}
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {filteredUsers.map(user => {
                      const isRegistered = participants.some(p => p.userId === user.id);
                      return (
                        <div
                          key={user.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div>
                            <div className="font-medium">{user.username}</div>
                            <div className="text-sm text-gray-500">
                              {user.telegram && `Telegram: ${user.telegram}`}
                              {user.telegram && user.eaId && ' • '}
                              {user.eaId && `EA ID: ${user.eaId}`}
                            </div>
                          </div>
                          {isRegistered ? (
                            <button
                              onClick={() => handleUnregisterUser(user.id)}
                              className="px-3 py-1 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md"
                            >
                              Видалити
                            </button>
                          ) : (
                            <button
                              onClick={() => handleRegisterUser(user.id)}
                              className="px-3 py-1 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md"
                            >
                              Додати
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog
          open={matchesModalOpen}
          onClose={() => {
            setMatchesModalOpen(false);
            setEditingMatch(null);
            setUpdateError('');
          }}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <div className="flex items-center justify-between">
              <span>Управління матчами</span>
              <button
                onClick={() => selectedTournament && fetchTournamentDetails(selectedTournament.id)}
                className="p-1 hover:bg-gray-100 rounded-full"
                title="Оновити"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </DialogTitle>
          <DialogContent>
            {matchesLoading ? (
              <div className="py-4 text-center">Завантаження матчів...</div>
            ) : matches.length === 0 ? (
              <div className="text-center py-4 text-gray-500">Матчів не знайдено</div>
            ) : (
              <div className="space-y-4">
                {updateError && (
                  <div className="text-red-500 text-sm">{updateError}</div>
                )}
                {matches.map((match) => (
                  <div 
                    key={match.id}
                    className="bg-purple-100 p-4 rounded-lg shadow-sm border border-gray-200"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-500">
                        Раунд {match.round}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMatchStatusColor(match.status)}`}>
                        {getMatchStatusLabel(match.status)}
                      </span>
                    </div>

                    {editingMatch?.id === match.id ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="font-medium mb-1">{match.player1Username}</div>
                            <input
                              type="number"
                              min="0"
                              defaultValue={match.player1Score || 0}
                              className="w-full px-2 py-1 border border-gray-300 rounded-md"
                              id={`player1Score-${match.id}`}
                            />
                          </div>
                          <div className="text-gray-400">vs</div>
                          <div className="flex-1">
                            <div className="font-medium mb-1">{match.player2Username}</div>
                            <input
                              type="number"
                              min="0"
                              defaultValue={match.player2Score || 0}
                              className="w-full px-2 py-1 border border-gray-300 rounded-md"
                              id={`player2Score-${match.id}`}
                            />
                          </div>
                        </div>
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => setEditingMatch(null)}
                            className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                          >
                            Скасувати
                          </button>
                          <button
                            onClick={() => {
                              const player1Score = parseInt((document.getElementById(`player1Score-${match.id}`) as HTMLInputElement).value);
                              const player2Score = parseInt((document.getElementById(`player2Score-${match.id}`) as HTMLInputElement).value);
                              handleUpdateMatch(match.id, player1Score, player2Score);
                            }}
                            className="px-3 py-1 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                          >
                            Зберегти
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex-1 text-center">
                          <div className="font-medium">{match.player1Username}</div>
                          <div className="text-2xl font-bold text-gray-900">
                            {match.player1Score ?? '-'}
                          </div>
                        </div>
                        <div className="mx-4 text-gray-400">vs</div>
                        <div className="flex-1 text-center">
                          <div className="font-medium">{match.player2Username}</div>
                          <div className="text-2xl font-bold text-gray-900">
                            {match.player2Score ?? '-'}
                          </div>
                        </div>
                        <button
                          onClick={() => setEditingMatch(match)}
                          className="ml-4 p-1 text-gray-400 hover:text-gray-600"
                          title="Редагувати результат"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      </div>
                    )}

                    {match.scheduledTime && (
                      <div className="mt-2 text-center text-sm text-gray-500">
                        {formatDate(match.scheduledTime)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Snackbar
          open={snackbarOpen}
          autoHideDuration={3000}
          onClose={() => setSnackbarOpen(false)}
          message={snackbarMsg}
        />
      </div>
    </AuthLayout>
  );
} 