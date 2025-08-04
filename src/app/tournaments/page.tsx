'use client';

import AuthLayout from '@/components/AuthLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ApiService, apiRequest } from '@/config/apiService';

interface Tournament {
  id: number;
  name: string;
  description: string;
  status: 'DRAFT' | 'IN_PROGRESS' | 'FINISHED' | 'CLOSED';
  maxParticipants: number;
  startDate: string | null;
  modifiedAt: string;
  currentRound: number;
  participantsCount: number;
}

interface Participant {
  id: number;
  username: string;
  eaId: string;
  telegram: string;
}

interface User {
  id: number;
  username: string;
  role: string;
  telegram?: string;
  eaId?: string;
}

interface Match {
  id: number;
  userId1: number;
  userId2: number;
  goalsUser1: number | null;
  goalsUser2: number | null;
  resultUser1: string | null;
  resultUser2: string | null;
  tournamentId: number;
  roundNumber: number;
  winnerId: number | null;
  loserId: number | null;
  drawUser1: number | null;
  drawUser2: number | null;
  matchStatus: string;
}

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [copiedParticipant, setCopiedParticipant] = useState<number | null>(null);
  const [registering, setRegistering] = useState(false);
  const [startingTournament, setStartingTournament] = useState(false);
  const [showUserSelector, setShowUserSelector] = useState(false);
  const [showParticipantManager, setShowParticipantManager] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [matches, setMatches] = useState<Match[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [generatingNextRound, setGeneratingNextRound] = useState(false);
  const [activeMatches, setActiveMatches] = useState<Match[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creatingTournament, setCreatingTournament] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    maxParticipants: 16
  });
  const [showCreateFromSwissModal, setShowCreateFromSwissModal] = useState(false);
  const [creatingFromSwissTournament, setCreatingFromSwissTournament] = useState(false);
  const [createFromSwissForm, setCreateFromSwissForm] = useState({
    swissTournamentId: 0,
    minPosition: 1,
    maxPosition: 15,
    tournamentName: '',
    tournamentDescription: '',
    maxParticipants: 15
  });
  const [finishingTournament, setFinishingTournament] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'my'>('my');
  const [updatingMatch, setUpdatingMatch] = useState<number | null>(null);
  const [matchResult, setMatchResult] = useState({
    goalsUser1: 0,
    goalsUser2: 0
  });
  const [statusFilter, setStatusFilter] = useState<Tournament['status'] | 'ALL'>('ALL');
  const [showMatchHistory, setShowMatchHistory] = useState(false);
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [loadingAllMatches, setLoadingAllMatches] = useState(false);
  const [showCreateTypeModal, setShowCreateTypeModal] = useState(false);
  const [participantSearch, setParticipantSearch] = useState('');
  const [showAllParticipants, setShowAllParticipants] = useState(false);
  const [showAllParticipantsExpanded, setShowAllParticipantsExpanded] = useState(false);
  const { token, user } = useAuth();
  const router = useRouter();

  const filteredUsers = useMemo(() => {
    const search = userSearch.toLowerCase();
    return allUsers.filter(u => u.username.toLowerCase().includes(search));
  }, [allUsers, userSearch]);

  const filteredParticipants = useMemo(() => {
    const search = participantSearch.toLowerCase();
    return participants.filter(p => p.username.toLowerCase().includes(search));
  }, [participants, participantSearch]);

  // Скидаємо тільки розгорнутий стан при зміні пошуку
  useEffect(() => {
    setShowAllParticipantsExpanded(false);
  }, [participantSearch]);

  const getStatusPriority = (status: Tournament['status']) => {
    const priorities = {
      'DRAFT': 0,
      'IN_PROGRESS': 1,
      'FINISHED': 2,
      'CLOSED': 3
    };
    return priorities[status];
  };

  const filteredAndSortedTournaments = useMemo(() => {
    let filtered = tournaments;
    
    // Применяем фильтр
    if (statusFilter !== 'ALL') {
      filtered = tournaments.filter(t => t.status === statusFilter);
    }

    // Сортируем по приоритету статуса
    return [...filtered].sort((a, b) => {
      const priorityA = getStatusPriority(a.status);
      const priorityB = getStatusPriority(b.status);
      return priorityA - priorityB;
    });
  }, [tournaments, statusFilter]);

  const fetchAllUsers = async () => {
    if (!token) return;
    setLoadingUsers(true);
    try {
      const data = await ApiService.users.getAll(token);
      setAllUsers(data);
    } catch (error) {
      // setError('Не вдалося отримати користувачів');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleAddParticipant = async (userId: number) => {
    if (!selectedTournament || !token) return;

    try {
      await ApiService.tournaments.addParticipant(token, selectedTournament.id, userId);
      
      // Обновляем список участников
      const data = await ApiService.tournaments.getParticipants(token, selectedTournament.id);
      setParticipants(data);
    } catch (error) {
      // setError('Не вдалося добавити учасника');
    }
  };

  const handleRemoveParticipant = async (userId: number) => {
    if (!selectedTournament || !token) return;

    try {
      await ApiService.tournaments.removeParticipant(token, selectedTournament.id, userId);
      setParticipants(prev => prev.filter(p => p.id !== userId));
    } catch (error) {
      // setError('Не вдалося удалить участника');
    }
  };

  const isParticipant = (tournamentParticipants: Participant[]) => {
    return tournamentParticipants.some(p => p.id === user?.id);
  };

  const handleRegistration = async () => {
    if (!selectedTournament || !user || registering || !token) return;

    setRegistering(true);
    try {
      const isCurrentParticipant = isParticipant(participants);
      if (isCurrentParticipant) {
        await ApiService.tournaments.removeParticipant(token, selectedTournament.id, user.id);
      } else {
        await ApiService.tournaments.addParticipant(token, selectedTournament.id, user.id);
      }
      
      // Обновляем список участников
      const data = await ApiService.tournaments.getParticipants(token, selectedTournament.id);
      setParticipants(data);
    } catch (error) {
      // setError('Не вдалося зареєструватися');
    } finally {
      setRegistering(false);
    }
  };

  const copyParticipantInfo = (participant: Participant) => {
    const info = `EA ID: ${participant.eaId}\nTelegram: ${participant.telegram}`;
    navigator.clipboard.writeText(info);
    setCopiedParticipant(participant.id);
    setTimeout(() => setCopiedParticipant(null), 2000);
  };

  const handleStartTournament = async () => {
    if (!selectedTournament || startingTournament || !token) return;

    setStartingTournament(true);
    try {
      const updatedTournament = await ApiService.tournaments.start(token, selectedTournament.id);
      setTournaments(prev => prev.map(t => 
        t.id === updatedTournament.id ? updatedTournament : t
      ));
      setSelectedTournament(updatedTournament);
    } catch (error) {
      // setError('Не вдалося запустити турнір');
    } finally {
      setStartingTournament(false);
    }
  };

  const handleContinueSwissTournament = async () => {
    if (!selectedTournament || startingTournament || !token) return;

    setStartingTournament(true);
    try {
      await apiRequest('/lchstate/tournament/start', 'POST', token, {
        tournamentId: selectedTournament.id
      });
      
      // Reload tournaments list to show updated tournaments
      const data = await ApiService.tournaments.getAll(token);
      setTournaments(data);
      
      // Find and update the selected tournament
      const updatedTournament = data.find((t: Tournament) => t.id === selectedTournament.id);
      if (updatedTournament) {
        setSelectedTournament(updatedTournament);
      } else {
        setSelectedTournament(null);
      }
    } catch (error) {
      // setError('Не вдалося продовжити швейцарський турнір');
    } finally {
      setStartingTournament(false);
    }
  };

  const handleNextRound = async () => {
    if (!selectedTournament || generatingNextRound || !token) return;

    setGeneratingNextRound(true);
    try {
      const updatedTournament = await ApiService.tournaments.nextRound(token, selectedTournament.id);
      setTournaments(prev => prev.map(t => 
        t.id === updatedTournament.id ? updatedTournament : t
      ));
      setSelectedTournament(updatedTournament);

      // Обновляем список матчей
      const matchesData = await ApiService.matches.getTournamentMatches(token, selectedTournament.id);
      setMatches(matchesData);

      // Фильтруем активные матчи
      const activeOnes = matchesData.filter((match: Match) => match.matchStatus !== 'завершен');
      setActiveMatches(activeOnes);
    } catch (error) {
      // setError('Не вдалося сгенерировать следующий раунд');
    } finally {
      setGeneratingNextRound(false);
    }
  };

  const handleCreateTournament = async () => {
    if (creatingTournament || !token) return;

    setCreatingTournament(true);
    try {
      const newTournament = await ApiService.tournaments.create(token, createForm);
      setTournaments(prev => [...prev, newTournament]);
      setShowCreateModal(false);
      setCreateForm({
        name: '',
        description: '',
        maxParticipants: 16
      });
    } catch (error) {
      // setError('Не вдалося створити турнір');
    } finally {
      setCreatingTournament(false);
    }
  };

  const handleCreateFromSwissTournament = async () => {
    if (creatingFromSwissTournament || !token) return;

    setCreatingFromSwissTournament(true);
    try {
      await apiRequest('/lchstate/tournament/create-from-swiss', 'POST', token, createFromSwissForm);
      
      // Reload tournaments list to show the new tournament
      const data = await ApiService.tournaments.getAll(token);
      setTournaments(data);
      
      setShowCreateFromSwissModal(false);
      setCreateFromSwissForm({
        swissTournamentId: 0,
        minPosition: 1,
        maxPosition: 15,
        tournamentName: '',
        tournamentDescription: '',
        maxParticipants: 15
      });
    } catch (error) {
      // setError('Не вдалося створити турнір з швейцарської сітки');
    } finally {
      setCreatingFromSwissTournament(false);
    }
  };

  const handleFinishTournament = async () => {
    if (!selectedTournament || finishingTournament || !token) return;

    setFinishingTournament(true);
    try {
      const updatedTournament = await ApiService.tournaments.finish(token, selectedTournament.id);
      setTournaments(prev => prev.map(t => 
        t.id === updatedTournament.id ? updatedTournament : t
      ));
      setSelectedTournament(updatedTournament);
    } catch (error) {
      // setError('Не вдалося завершити турнір');
    } finally {
      setFinishingTournament(false);
    }
  };

  const handleUpdateMatchResult = async (matchId: number) => {
    if (!selectedTournament || !user || !token) return;
    
    // Проверка на равный счет
    if (matchResult.goalsUser1 === matchResult.goalsUser2) {
      // setError('Рахунок не може бути рівним. Повинен бути переможець.');
      return;
    }

    try {
      await ApiService.matches.updateResult(token, {
        matchId,
        tournamentId: selectedTournament.id,
        roundNumber: matches.find(m => m.id === matchId)?.roundNumber,
        goalsUser1: matchResult.goalsUser1,
        goalsUser2: matchResult.goalsUser2
      });

      // Обновляем список матчей
      const matchesData = await ApiService.matches.getTournamentMatches(token, selectedTournament.id);
      setMatches(matchesData);
      
      // Обновляем активные матчи
      const activeOnes = matchesData.filter((match: Match) => match.matchStatus !== 'завершен');
      setActiveMatches(activeOnes);
      
      setUpdatingMatch(null);
      setMatchResult({ goalsUser1: 0, goalsUser2: 0 });
    } catch (error) {
      // setError('Не вдалося обновити результат матча');
    }
  };

  const getMyMatches = () => {
    if (!user) return [];
    const myMatches = matches.filter(match => 
      (match.userId1 === user.id || match.userId2 === user.id) && 
      match.matchStatus !== 'завершен'
    );
    return myMatches;
  };

  const fetchAllMatches = async () => {
    if (!selectedTournament || !token) return;
    
    setLoadingAllMatches(true);
    try {
      const data = await ApiService.matches.getTournamentMatches(token, selectedTournament.id);
      setAllMatches(data);
    } catch (error) {
      // setError('Не вдалося отримати всі матчі');
    } finally {
      setLoadingAllMatches(false);
    }
  };

  useEffect(() => {
    const fetchTournaments = async () => {
      if (!token) return;
      try {
        const data = await ApiService.tournaments.getAll(token);
        setTournaments(data);
      } catch (error) {
        // setError('Не вдалося отримати турніри');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchTournaments();
    }
  }, [token]);

  useEffect(() => {
    const fetchParticipants = async () => {
      if (!selectedTournament || !token) return;
      
      setLoadingParticipants(true);
      try {
        const data = await ApiService.tournaments.getParticipants(token, selectedTournament.id);
        setParticipants(data);
      } catch (error) {
        // setError('Не вдалося отримати учасників');
      } finally {
        setLoadingParticipants(false);
      }
    };

    if (selectedTournament) {
      fetchParticipants();
    } else {
      setParticipants([]);
    }
  }, [selectedTournament, token]);

  useEffect(() => {
    const fetchMatches = async () => {
      if (!selectedTournament || !token) return;
      
      setLoadingMatches(true);
      try {
        const data = await ApiService.matches.getTournamentMatches(token, selectedTournament.id);
        setMatches(data);
        
        // Фильтруем активные матчи
        const activeOnes = data.filter((match: Match) => match.matchStatus !== 'завершен');
        setActiveMatches(activeOnes);
      } catch (error) {
        // setError('Не вдалося отримати матчі');
      } finally {
        setLoadingMatches(false);
      }
    };

    if (selectedTournament) {
      fetchMatches();
    } else {
      setMatches([]);
      setActiveMatches([]);
    }
  }, [selectedTournament, token]);

  const getStatusText = (status: Tournament['status']) => {
    switch (status) {
      case 'DRAFT': return 'Чернетка';
      case 'IN_PROGRESS': return 'В процесі';
      case 'FINISHED': return 'Завершено';
      case 'CLOSED': return 'Закрито';
      default: return status;
    }
  };

  const getStatusColor = (status: Tournament['status']) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-800';
      case 'IN_PROGRESS': return 'bg-green-100 text-green-800';
      case 'FINISHED': return 'bg-blue-100 text-blue-800';
      case 'CLOSED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('uk-UA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getParticipantName = (userId: number) => {
    const participant = participants.find(p => p.id === userId);
    return participant?.username || 'Невідомий гравець';
  };

  const getMatchResult = (match: Match) => {
    if (match.matchStatus !== 'завершен') {
      return 'В процесі';
    }
    return `${match.goalsUser1} : ${match.goalsUser2}`;
  };

  const groupMatchesByRound = (matches: Match[]) => {
    const grouped = new Map<number, Match[]>();
    matches.forEach(match => {
      if (!grouped.has(match.roundNumber)) {
        grouped.set(match.roundNumber, []);
      }
      grouped.get(match.roundNumber)?.push(match);
    });
    return new Map([...grouped.entries()].sort((a, b) => b[0] - a[0]));
  };

  return (
    <AuthLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight border-b border-slate-200 pb-2 bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
            Single elimination
          </h1>
        </div>
        <div className="flex items-center justify-between gap-4 mb-6">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as Tournament['status'] | 'ALL')}
            className="min-w-[180px] px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm text-black"
          >
            <option value="ALL" className="text-black">Всі турніри</option>
            <option value="DRAFT" className="text-black">Чернетка</option>
            <option value="IN_PROGRESS" className="text-black">В процесі</option>
            <option value="FINISHED" className="text-black">Завершено</option>
            <option value="CLOSED" className="text-black">Закрито</option>
          </select>
          {user?.role === 'ADMIN' && (
            <button 
              onClick={() => setShowCreateTypeModal(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm font-medium"
            >
              Створити турнір
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <ul className="divide-y divide-gray-200">
              {filteredAndSortedTournaments.map((tournament) => (
                <li key={tournament.id} className="hover:bg-gray-50">
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col flex-grow">
                        <div className="flex items-center">
                          <h3 className="text-lg font-medium text-gray-900 mr-3">{tournament.name}</h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(tournament.status)}`}>
                            {getStatusText(tournament.status)}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-500">{tournament.description}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex flex-col items-end text-sm text-gray-500">
                          <div>Учасників: {tournament.participantsCount} / {tournament.maxParticipants}</div>
                          {tournament.currentRound > 0 && (
                            <div>Раунд: {tournament.currentRound}</div>
                          )}
                        </div>
                        <button 
                          onClick={() => setSelectedTournament(tournament)}
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

        {/* Create Tournament Type Modal */}
        {showCreateTypeModal && (
          <div className="fixed inset-0 bg-[rgba(30,41,59,0.5)] flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-sm w-full">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-xl font-semibold text-black">Виберіть тип турніру</h3>
                <button
                  onClick={() => setShowCreateTypeModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>
              <div className="px-6 py-6 flex flex-col gap-4">
                <button
                  onClick={() => {
                    setShowCreateTypeModal(false);
                    setShowCreateModal(true);
                  }}
                  className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-lg font-medium"
                >
                  Стандартний турнір
                </button>
                <button
                  onClick={() => {
                    setShowCreateTypeModal(false);
                    setShowCreateFromSwissModal(true);
                  }}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-lg font-medium"
                >
                  Продовження швейцарки
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Tournament Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-[rgba(30,41,59,0.5)] flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-black">
                    Створення турніру
                  </h3>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <span className="text-2xl">&times;</span>
                  </button>
                </div>
              </div>
              <div className="px-6 py-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Назва турніру
                    </label>
                    <input
                      type="text"
                      value={createForm.name}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                      className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900"
                      placeholder="Введіть назву турніру"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Опис
                    </label>
                    <textarea
                      value={createForm.description}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900"
                      placeholder="Введіть опис турніру"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Максимальна кількість учасників
                    </label>
                    <input
                      type="number"
                      min="2"
                      value={createForm.maxParticipants}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, maxParticipants: parseInt(e.target.value) }))}
                      className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900"
                    />
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="mr-3 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Скасувати
                </button>
                <button
                  onClick={handleCreateTournament}
                  disabled={creatingTournament || !createForm.name || !createForm.description || createForm.maxParticipants < 2}
                  className={`px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                    (creatingTournament || !createForm.name || !createForm.description || createForm.maxParticipants < 2) 
                      ? 'opacity-50 cursor-not-allowed' 
                      : ''
                  }`}
                >
                  {creatingTournament ? 'Створення...' : 'Створити'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Tournament from Swiss Modal */}
        {showCreateFromSwissModal && (
          <div className="fixed inset-0 bg-[rgba(30,41,59,0.5)] flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-black">
                    Створення турніру з швейцарської сітки
                  </h3>
                  <button
                    onClick={() => setShowCreateFromSwissModal(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <span className="text-2xl">&times;</span>
                  </button>
                </div>
              </div>
              <div className="px-6 py-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      ID швейцарського турніру
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={createFromSwissForm.swissTournamentId}
                      onChange={(e) => setCreateFromSwissForm(prev => ({ ...prev, swissTournamentId: parseInt(e.target.value) || 0 }))}
                      className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900"
                      placeholder="Введіть ID швейцарського турніру"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Мінімальна позиція
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={createFromSwissForm.minPosition}
                        onChange={(e) => setCreateFromSwissForm(prev => ({ ...prev, minPosition: parseInt(e.target.value) || 1 }))}
                        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Максимальна позиція
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={createFromSwissForm.maxPosition}
                        onChange={(e) => setCreateFromSwissForm(prev => ({ ...prev, maxPosition: parseInt(e.target.value) || 1 }))}
                        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Назва турніру
                    </label>
                    <input
                      type="text"
                      value={createFromSwissForm.tournamentName}
                      onChange={(e) => setCreateFromSwissForm(prev => ({ ...prev, tournamentName: e.target.value }))}
                      className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900"
                      placeholder="Введіть назву турніру"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Опис турніру
                    </label>
                    <textarea
                      value={createFromSwissForm.tournamentDescription}
                      onChange={(e) => setCreateFromSwissForm(prev => ({ ...prev, tournamentDescription: e.target.value }))}
                      rows={3}
                      className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900"
                      placeholder="Введіть опис турніру"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Максимальна кількість учасників
                    </label>
                    <input
                      type="number"
                      min="2"
                      value={createFromSwissForm.maxParticipants}
                      onChange={(e) => setCreateFromSwissForm(prev => ({ ...prev, maxParticipants: parseInt(e.target.value) || 2 }))}
                      className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900"
                    />
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
                <button
                  onClick={() => setShowCreateFromSwissModal(false)}
                  className="mr-3 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Скасувати
                </button>
                <button
                  onClick={handleCreateFromSwissTournament}
                  disabled={creatingFromSwissTournament || 
                    !createFromSwissForm.tournamentName || 
                    !createFromSwissForm.tournamentDescription || 
                    createFromSwissForm.maxParticipants < 2 ||
                    createFromSwissForm.swissTournamentId < 1
                  }
                  className={`px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                    (creatingFromSwissTournament || 
                      !createFromSwissForm.tournamentName || 
                      !createFromSwissForm.tournamentDescription || 
                      createFromSwissForm.maxParticipants < 2 ||
                      createFromSwissForm.swissTournamentId < 1
                    ) 
                      ? 'opacity-50 cursor-not-allowed' 
                      : ''
                  }`}
                >
                  {creatingFromSwissTournament ? 'Створення...' : 'Створити'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal */}
        {selectedTournament && (
          <div
            className="fixed inset-0 bg-[rgba(30,41,59,0.5)] flex items-center justify-center p-4"
            onClick={(e) => {
              // Закриваємо модальне вікно тільки якщо клік був на фоні, а не на контенті
              if (e.target === e.currentTarget) {
                setSelectedTournament(null);
                setParticipantSearch('');
                setShowAllParticipants(false);
                setShowAllParticipantsExpanded(false);
              }
            }}
          >
            <div
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-black">
                    {selectedTournament.name}
                  </h3>
                </div>
              </div>
              <div className="overflow-y-auto flex-1">
                <div className="px-6 py-4">
                  <dl className="space-y-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Опис</dt>
                      <dd className="mt-1 text-sm text-gray-900">{selectedTournament.description}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Статус</dt>
                      <dd className="mt-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${getStatusColor(selectedTournament.status)}`}>
                          {getStatusText(selectedTournament.status)}
                        </span>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Учасники</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {selectedTournament.participantsCount} / {selectedTournament.maxParticipants}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Поточний раунд</dt>
                      <dd className="mt-1 text-sm text-gray-900">{selectedTournament.currentRound}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Дата початку</dt>
                      <dd className="mt-1 text-sm text-gray-900">{formatDate(selectedTournament.startDate)}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Останнє оновлення</dt>
                      <dd className="mt-1 text-sm text-gray-900">{formatDate(selectedTournament.modifiedAt)}</dd>
                    </div>
                  </dl>
                  <div className="mt-6 space-y-3">
                    {selectedTournament.status === 'DRAFT' && (
                      <>
                        <button
                          onClick={handleRegistration}
                          disabled={registering}
                          className={`w-full px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            isParticipant(participants)
                              ? 'bg-red-600 text-white hover:bg-red-700'
                              : 'bg-green-600 text-white hover:bg-green-700'
                          } ${registering ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {registering ? (
                            <span>Обробка...</span>
                          ) : isParticipant(participants) ? (
                            'Скасувати реєстрацію'
                          ) : (
                            'Зареєструватися'
                          )}
                        </button>

                        {user?.role === 'ADMIN' && (
                          <button
                            onClick={handleStartTournament}
                            disabled={startingTournament || selectedTournament.participantsCount < 2}
                            className={`w-full px-4 py-2 rounded-md text-sm font-medium transition-colors
                              ${selectedTournament.participantsCount < 2 
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-indigo-600 text-white hover:bg-indigo-700'
                              } ${startingTournament ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {startingTournament ? (
                              <span>Запуск турніру...</span>
                            ) : selectedTournament.participantsCount < 2 ? (
                              'Потрібно мінімум 2 учасника'
                            ) : (
                              'Запустити турнір'
                            )}
                          </button>
                        )}

                        {user?.role === 'ADMIN' && (
                          <button
                            onClick={handleContinueSwissTournament}
                            disabled={startingTournament}
                            className={`w-full mt-2 px-4 py-2 rounded-md text-sm font-medium transition-colors
                              bg-green-600 text-white hover:bg-green-700
                              ${startingTournament ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {startingTournament ? (
                              <span>Продовження турніру...</span>
                            ) : (
                              'Продовжити швейцарський турнір'
                            )}
                          </button>
                        )}
                      </>
                    )}
                    
                    {selectedTournament.status === 'IN_PROGRESS' && user?.role === 'ADMIN' && (
                      <>
                        <button
                          onClick={handleNextRound}
                          disabled={generatingNextRound}
                          className={`w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm font-medium ${
                            generatingNextRound ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          {generatingNextRound ? 'Генерація наступного раунду...' : 'Згенерувати наступний раунд'}
                        </button>

                        <button
                          onClick={handleFinishTournament}
                          disabled={finishingTournament}
                          className={`w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm font-medium ${
                            finishingTournament ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          {finishingTournament ? 'Завершення турніру...' : 'Завершити турнір'}
                        </button>
                      </>
                    )}
                    
                    {selectedTournament.status !== 'DRAFT' && (
                      <button
                        onClick={() => {
                          router.push(`/tournaments/${selectedTournament.id}/bracket`);
                          setSelectedTournament(null);
                        }}
                        className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm font-medium"
                      >
                        Переглянути турнірну сітку
                      </button>
                    )}
                  </div>
                </div>

                {/* Participants List */}
                <div className="border-t border-gray-200">
                  <div className="px-6 py-4">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-lg font-medium text-black">Учасники турніру</h4>
                      <div className="flex items-center space-x-2">
                        {user?.role === 'ADMIN' && selectedTournament?.status === 'DRAFT' && (
                          <button
                            onClick={() => {
                              setShowParticipantManager(true);
                              fetchAllUsers();
                            }}
                            className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                          >
                            Управління учасниками
                          </button>
                        )}
                        <button
                          onClick={() => setShowAllParticipants(!showAllParticipants)}
                          className="px-3 py-1 text-sm bg-blue-100 text-blue-600 border border-blue-300 rounded hover:bg-blue-200 transition-colors flex items-center"
                        >
                          {showAllParticipants ? 'Сховати' : 'Показати'}
                          <span className={`ml-1 transition-transform ${showAllParticipants ? 'rotate-180' : ''}`}>
                            ▼
                          </span>
                        </button>
                      </div>
                    </div>
                    
                    {showAllParticipants && (
                      <>
                        {/* Search participants */}
                        <div className="mb-4">
                          <input
                            type="text"
                            placeholder="Пошук учасника..."
                            value={participantSearch}
                            onChange={(e) => setParticipantSearch(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black"
                          />
                        </div>
                    
                    {loadingParticipants ? (
                      <div className="text-center py-4">
                        <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-indigo-600 border-r-transparent"></div>
                      </div>
                    ) : participants.length > 0 ? (
                      <div>
                        <div className="grid grid-cols-3 gap-2">
                          {(showAllParticipantsExpanded ? filteredParticipants : filteredParticipants.slice(0, 6)).map(participant => (
                          <div 
                            key={participant.id}
                            onClick={() => setCopiedParticipant(copiedParticipant === participant.id ? null : participant.id)}
                            className="px-3 py-2 bg-gray-50 rounded-md text-sm cursor-pointer transition-all duration-200 hover:bg-gray-100 text-black"
                          >
                            <div className="font-medium">{participant.username}</div>
                            {copiedParticipant === participant.id && (
                              <div className="mt-1 text-xs text-gray-600">
                                <div 
                                  className="flex items-center justify-between hover:bg-gray-100 p-1 rounded cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(participant.eaId);
                                    // Показуємо фідбек для мобільних пристроїв
                                    const textSpan = e.currentTarget.querySelector('span:first-child') as HTMLElement;
                                    if (textSpan) {
                                      const originalText = textSpan.textContent;
                                      textSpan.textContent = 'Скопійовано!';
                                      textSpan.style.color = '#059669';
                                      setTimeout(() => {
                                        textSpan.textContent = originalText;
                                        textSpan.style.color = '';
                                      }, 1000);
                                    }
                                  }}
                                >
                                  <span>EA ID: {participant.eaId}</span>
                                  <span className="text-blue-500 ml-1">📋</span>
                                </div>
                                <div 
                                  className="flex items-center justify-between hover:bg-gray-100 p-1 rounded cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(participant.telegram);
                                    // Показуємо фідбек для мобільних пристроїв
                                    const textSpan = e.currentTarget.querySelector('span:first-child') as HTMLElement;
                                    if (textSpan) {
                                      const originalText = textSpan.textContent;
                                      textSpan.textContent = 'Скопійовано!';
                                      textSpan.style.color = '#059669';
                                      setTimeout(() => {
                                        textSpan.textContent = originalText;
                                        textSpan.style.color = '';
                                      }, 1000);
                                    }
                                  }}
                                >
                                  <span>Telegram: {participant.telegram}</span>
                                  <span className="text-blue-500 ml-1">📋</span>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                        </div>
                        
                        {filteredParticipants.length > 6 && !showAllParticipantsExpanded && (
                          <div className="text-center mt-3">
                            <button
                              onClick={() => setShowAllParticipantsExpanded(true)}
                              className="px-4 py-2 text-sm bg-blue-100 text-blue-600 border border-blue-300 rounded hover:bg-blue-200 transition-colors"
                            >
                              Показати всіх
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-black italic">
                        Немає учасників
                      </div>
                    )}
                      </>
                    )}
                  </div>
                </div>

                {/* Matches Tabs */}
                {selectedTournament.status === 'IN_PROGRESS' && (
                  <div className="border-t border-gray-200">
                    <div className="px-6 py-4">
                      <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8">
                          <button
                            onClick={() => setActiveTab('active')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm ${
                              activeTab === 'active'
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                          >
                            Активні матчі
                          </button>
                          <button
                            onClick={() => setActiveTab('my')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm ${
                              activeTab === 'my'
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                          >
                            Мої матчі
                          </button>
                        </nav>
                      </div>

                      <div className="mt-4">
                        <h4 className="text-lg font-medium text-black mb-4">
                          {activeTab === 'active' ? 'Активні матчі' : 'Мої матчі'}
                        </h4>
                        {loadingMatches ? (
                          <div className="text-center py-4">
                            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-indigo-600 border-r-transparent"></div>
                          </div>
                        ) : activeTab === 'active' ? (
                          activeMatches.length > 0 ? (
                            <div className="space-y-3">
                              {activeMatches.map(match => (
                                <div key={match.id} className="bg-white rounded-lg shadow p-4 mb-4">
                                  <div className="text-sm font-medium text-gray-500 mb-2">
                                    Раунд {match.roundNumber}
                                  </div>
                                  <div className="flex items-center justify-between mb-4">
                                    <div className="flex-1">
                                      <div className="text-sm font-medium text-black">
                                        {getParticipantName(match.userId1)}
                                      </div>
                                    </div>
                                    <div className="flex items-center px-4">
                                      <span className="text-sm font-medium text-gray-600">VS</span>
                                    </div>
                                    <div className="flex-1 text-right">
                                      <div className="text-sm font-medium text-black">
                                        {getParticipantName(match.userId2)}
                                      </div>
                                    </div>
                                  </div>

                                  {user?.role === 'ADMIN' && (
                                    <>
                                      {updatingMatch === match.id ? (
                                        <div className="mt-4">
                                          <div className="flex items-center justify-center space-x-4">
                                            <div className="flex flex-col items-center">
                                              <span className="text-sm font-medium text-black mb-1">
                                                {getParticipantName(match.userId1)}
                                              </span>
                                              <input
                                                type="number"
                                                min="0"
                                                value={matchResult.goalsUser1}
                                                onChange={(e) => setMatchResult(prev => ({
                                                  ...prev,
                                                  goalsUser1: parseInt(e.target.value) || 0
                                                }))}
                                                className="w-16 px-2 py-1 text-center border rounded text-black bg-white"
                                              />
                                            </div>
                                            <span className="text-gray-500">:</span>
                                            <div className="flex flex-col items-center">
                                              <span className="text-sm font-medium text-black mb-1">
                                                {getParticipantName(match.userId2)}
                                              </span>
                                              <input
                                                type="number"
                                                min="0"
                                                value={matchResult.goalsUser2}
                                                onChange={(e) => setMatchResult(prev => ({
                                                  ...prev,
                                                  goalsUser2: parseInt(e.target.value) || 0
                                                }))}
                                                className="w-16 px-2 py-1 text-center border rounded text-black bg-white"
                                              />
                                            </div>
                                          </div>
                                          <div className="flex justify-center mt-4 space-x-2">
                                            <button
                                              onClick={async () => {
                                                await handleUpdateMatchResult(match.id);
                                                await fetchAllMatches(); // Обновляем историю матчей после изменения
                                              }}
                                              className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                                            >
                                              Зберегти
                                            </button>
                                            <button
                                              onClick={() => {
                                                setUpdatingMatch(null);
                                                setMatchResult({ goalsUser1: 0, goalsUser2: 0 });
                                              }}
                                              className="px-4 py-2 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
                                            >
                                              Скасувати
                                            </button>
                                          </div>
                                        </div>
                                      ) : (
                                        <button
                                          onClick={() => setUpdatingMatch(match.id)}
                                          className="w-full mt-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700"
                                        >
                                          Внести результат
                                        </button>
                                      )}
                                    </>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-sm text-black italic">
                              Немає активних матчів
                            </div>
                          )
                        ) : (
                          <div className="space-y-3">
                            {getMyMatches().map(match => (
                              <div key={match.id} className="bg-white rounded-lg shadow p-4 mb-4">
                                <div className="text-sm font-medium text-gray-500 mb-2">
                                  Раунд {match.roundNumber}
                                </div>
                                <div className="flex items-center justify-between mb-4">
                                  <div className="flex-1">
                                    <div className="text-sm font-medium text-black">
                                      {getParticipantName(match.userId1)}
                                    </div>
                                  </div>
                                  <div className="flex items-center px-4">
                                    <span className="text-sm font-medium text-gray-600">VS</span>
                                  </div>
                                  <div className="flex-1 text-right">
                                    <div className="text-sm font-medium text-black">
                                      {getParticipantName(match.userId2)}
                                    </div>
                                  </div>
                                </div>

                                {updatingMatch === match.id ? (
                                  <div className="mt-4">
                                    <div className="flex items-center justify-center space-x-4">
                                      <div className="flex flex-col items-center">
                                        <span className="text-sm font-medium text-black mb-1">
                                          {getParticipantName(match.userId1)}
                                        </span>
                                        <input
                                          type="number"
                                          min="0"
                                          value={matchResult.goalsUser1}
                                          onChange={(e) => setMatchResult(prev => ({
                                            ...prev,
                                            goalsUser1: parseInt(e.target.value) || 0
                                          }))}
                                          className="w-16 px-2 py-1 text-center border rounded text-black bg-white"
                                        />
                                      </div>
                                      <span className="text-gray-500">:</span>
                                      <div className="flex flex-col items-center">
                                        <span className="text-sm font-medium text-black mb-1">
                                          {getParticipantName(match.userId2)}
                                        </span>
                                        <input
                                          type="number"
                                          min="0"
                                          value={matchResult.goalsUser2}
                                          onChange={(e) => setMatchResult(prev => ({
                                            ...prev,
                                            goalsUser2: parseInt(e.target.value) || 0
                                          }))}
                                          className="w-16 px-2 py-1 text-center border rounded text-black bg-white"
                                        />
                                      </div>
                                    </div>
                                    <div className="flex justify-center mt-4 space-x-2">
                                      <button
                                        onClick={async () => {
                                          await handleUpdateMatchResult(match.id);
                                          await fetchAllMatches(); // Обновляем историю матчей после изменения
                                        }}
                                        className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                                      >
                                        Зберегти
                                      </button>
                                      <button
                                        onClick={() => {
                                          setUpdatingMatch(null);
                                          setMatchResult({ goalsUser1: 0, goalsUser2: 0 });
                                        }}
                                        className="px-4 py-2 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
                                      >
                                        Скасувати
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setUpdatingMatch(match.id)}
                                    className="w-full mt-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700"
                                  >
                                    Внести результат
                                  </button>
                                )}
                              </div>
                            ))}
                            {getMyMatches().length === 0 && (
                              <div className="text-sm text-black italic">
                                У вас немає активних матчів
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {user?.role === 'ADMIN' && (
                  <div className="border-t border-gray-200 px-6 py-4">
                    <button
                      onClick={() => {
                        fetchAllMatches();
                        setShowMatchHistory(true);
                      }}
                      className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm font-medium"
                    >
                      Історія матчів
                    </button>
                  </div>
                )}
              </div>

              {/* Match History Modal */}
              {showMatchHistory && (
                <div className="fixed inset-0 bg-[rgba(30,41,59,0.5)] flex items-center justify-center p-4 z-50">
                  <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-semibold text-black">
                          Історія матчів
                        </h3>
                        <button
                          onClick={() => setShowMatchHistory(false)}
                          className="text-gray-400 hover:text-gray-500"
                        >
                          <span className="text-2xl">&times;</span>
                        </button>
                      </div>
                    </div>
                    <div className="overflow-y-auto flex-1 p-6">
                      {loadingAllMatches ? (
                        <div className="text-center py-4">
                          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-indigo-600 border-r-transparent"></div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {allMatches.map((match) => (
                            <div key={match.id} className="bg-gray-50 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-500">
                                  Раунд {match.roundNumber}
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className={`text-sm font-medium ${
                                    match.matchStatus === 'завершен' ? 'text-green-600' : 'text-yellow-600'
                                  }`}>
                                    {match.matchStatus}
                                  </span>
                                  {user?.role === 'ADMIN' && (
                                    <button
                                      onClick={() => {
                                        setUpdatingMatch(match.id);
                                        setMatchResult({
                                          goalsUser1: match.goalsUser1 || 0,
                                          goalsUser2: match.goalsUser2 || 0
                                        });
                                      }}
                                      className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                                    >
                                      Редагувати
                                    </button>
                                  )}
                                </div>
                              </div>
                              {updatingMatch === match.id ? (
                                <div className="mt-4">
                                  <div className="flex items-center justify-center space-x-4">
                                    <div className="flex flex-col items-center">
                                      <span className="text-sm font-medium text-black mb-1">
                                        {getParticipantName(match.userId1)}
                                      </span>
                                      <input
                                        type="number"
                                        min="0"
                                        value={matchResult.goalsUser1}
                                        onChange={(e) => setMatchResult(prev => ({
                                          ...prev,
                                          goalsUser1: parseInt(e.target.value) || 0
                                        }))}
                                        className="w-16 px-2 py-1 text-center border rounded text-black bg-white"
                                      />
                                    </div>
                                    <span className="text-gray-500">:</span>
                                    <div className="flex flex-col items-center">
                                      <span className="text-sm font-medium text-black mb-1">
                                        {getParticipantName(match.userId2)}
                                      </span>
                                      <input
                                        type="number"
                                        min="0"
                                        value={matchResult.goalsUser2}
                                        onChange={(e) => setMatchResult(prev => ({
                                          ...prev,
                                          goalsUser2: parseInt(e.target.value) || 0
                                        }))}
                                        className="w-16 px-2 py-1 text-center border rounded text-black bg-white"
                                      />
                                    </div>
                                  </div>
                                  <div className="flex justify-center mt-4 space-x-2">
                                    <button
                                      onClick={async () => {
                                        await handleUpdateMatchResult(match.id);
                                        await fetchAllMatches(); // Обновляем историю матчей после изменения
                                      }}
                                      className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                                    >
                                      Зберегти
                                    </button>
                                    <button
                                      onClick={() => {
                                        setUpdatingMatch(null);
                                        setMatchResult({ goalsUser1: 0, goalsUser2: 0 });
                                      }}
                                      className="px-4 py-2 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
                                    >
                                      Скасувати
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="text-sm font-medium text-black">
                                      {getParticipantName(match.userId1)}
                                    </div>
                                    {match.goalsUser1 !== null && (
                                      <div className="text-sm text-gray-500">
                                        Голів: {match.goalsUser1}
                                      </div>
                                    )}
                                    {match.resultUser1 && (
                                      <div className="text-sm text-gray-500">
                                        Результат: {match.resultUser1}
                                      </div>
                                    )}
                                  </div>
                                  <div className="px-4 text-lg font-bold text-gray-700">
                                    {match.goalsUser1 !== null ? `${match.goalsUser1} : ${match.goalsUser2}` : 'VS'}
                                  </div>
                                  <div className="flex-1 text-right">
                                    <div className="text-sm font-medium text-black">
                                      {getParticipantName(match.userId2)}
                                    </div>
                                    {match.goalsUser2 !== null && (
                                      <div className="text-sm text-gray-500">
                                        Голів: {match.goalsUser2}
                                      </div>
                                    )}
                                    {match.resultUser2 && (
                                      <div className="text-sm text-gray-500">
                                        Результат: {match.resultUser2}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Participant Management Modal */}
        {showParticipantManager && user?.role === 'ADMIN' && (
          <div className="fixed inset-0 bg-[rgba(30,41,59,0.5)] flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
              <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-black">
                    Управління учасниками турніру
                  </h3>
                  <button
                    onClick={() => setShowParticipantManager(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <span className="text-2xl">&times;</span>
                  </button>
                </div>
                <div className="mt-4">
                  <input
                    type="text"
                    placeholder="Пошук користувача..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="overflow-y-auto flex-1">
                <div className="px-6 py-4">
                  <div className="flex space-x-4">
                    {/* Available Users */}
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-black mb-2">Доступні користувачі</h4>
                      <div className="border rounded-md h-[calc(100vh-400px)] overflow-y-auto">
                        {loadingUsers ? (
                          <div className="flex items-center justify-center h-full">
                            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-indigo-600 border-r-transparent"></div>
                          </div>
                        ) : (
                          <div className="divide-y divide-gray-200">
                            {filteredUsers
                              .filter(u => !participants.some(p => p.id === u.id))
                              .map(user => (
                                <div
                                  key={user.id}
                                  onClick={() => handleAddParticipant(user.id)}
                                  className="p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                                >
                                  <div className="font-medium text-black">{user.username}</div>
                                  <div className="text-sm text-black">
                                    {user.telegram && `Telegram: ${user.telegram}`}
                                    {user.telegram && user.eaId && ' • '}
                                    {user.eaId && `EA ID: ${user.eaId}`}
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Current Participants */}
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-black mb-2">Поточні учасники</h4>
                      <div className="border rounded-md h-[calc(100vh-400px)] overflow-y-auto">
                        <div className="divide-y divide-gray-200">
                          {participants.map(participant => (
                            <div
                              key={participant.id}
                              className="p-3 hover:bg-gray-50 transition-colors group"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-medium text-black">{participant.username}</div>
                                  <div className="text-sm text-black">
                                    {participant.telegram && `Telegram: ${participant.telegram}`}
                                    {participant.telegram && participant.eaId && ' • '}
                                    {participant.eaId && `EA ID: ${participant.eaId}`}
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleRemoveParticipant(participant.id)}
                                  className="opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-700 transition-opacity"
                                >
                                  Видалити
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
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