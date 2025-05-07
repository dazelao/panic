import { useState, useEffect } from 'react';
import { getLeague, changeLeagueStatusRest, getLeagueMatches, LeagueMatch, getLeagueStats, LeagueStats, updateMatchResult, generateMatches, registerSelf, unregisterSelf } from '@/api/leagues';
import { League } from '@/types/league';
import AddParticipantModal from '@/components/AddParticipantModal';
import EditMatchesModal from '@/components/EditMatchesModal';
import BulkAddParticipantsModal from '@/components/BulkAddParticipantsModal';
import { ApiService } from '@/config/apiService';

interface Participant {
  id: number;
  userId: number;
  username: string;
  telegram?: string;
  eaId?: string;
  role?: string;
  attributes?: Record<string, string>;
}

interface LeagueDetailModalProps {
  league: League;
  token: string;
  user: any;
  onClose: () => void;
}

export default function LeagueDetailModal({ league, token, user, onClose }: LeagueDetailModalProps) {
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState('');
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState('');
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [matches, setMatches] = useState<LeagueMatch[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [stats, setStats] = useState<LeagueStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [editingMatch, setEditingMatch] = useState<number | null>(null);
  const [goals1, setGoals1] = useState('');
  const [goals2, setGoals2] = useState('');
  const [updateError, setUpdateError] = useState('');
  const [isEditMatchesModalOpen, setEditMatchesModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationCooldown, setGenerationCooldown] = useState(false);
  const [registrationLoading, setRegistrationLoading] = useState(false);
  const [isBulkAddModalOpen, setBulkAddModalOpen] = useState(false);

  const statusLabels: Record<string, string> = {
    DRAFT: 'Чернетка',
    REGISTRATION: 'Реєстрація',
    ACTIVE: 'Активна',
    FINISHED: 'Завершена',
    CANCELED: 'Скасована',
  };
  const statusColors: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-800',
    REGISTRATION: 'bg-yellow-100 text-yellow-800',
    ACTIVE: 'bg-green-100 text-green-800',
    FINISHED: 'bg-blue-100 text-blue-800',
    CANCELED: 'bg-red-100 text-red-800',
  };

  const handleStatusChange = async (newStatus: 'REGISTRATION' | 'ACTIVE' | 'FINISHED' | 'CANCELED') => {
    if (!token) return;
    setStatusLoading(true);
    setStatusError('');
    try {
      await changeLeagueStatusRest(token, Number(league.id), newStatus);
      fetchParticipants();
      fetchMatches();
      fetchStats();
    } catch (e) {
      setStatusError('Не вдалося змінити статус');
    } finally {
      setStatusLoading(false);
    }
  };

  const fetchParticipants = () => {
    if (!token) return;
    setParticipantsLoading(true);
    ApiService.leagues.getParticipants(token, Number(league.id))
      .then(setParticipants)
      .catch(() => setParticipants([]))
      .finally(() => setParticipantsLoading(false));
  };

  const handleParticipantClick = (participant: Participant) => {
    const text = `telegram: ${participant.telegram || ''}\neaId: ${participant.eaId || ''}`;
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopiedId(participant.id);
        setTimeout(() => setCopiedId(null), 2000);
      })
      .catch(() => {
        setSnackbarMsg('Помилка копіювання');
      });
  };

  const fetchMatches = () => {
    if (!token) return;
    setMatchesLoading(true);
    getLeagueMatches(token, Number(league.id))
      .then(setMatches)
      .catch(() => setMatches([]))
      .finally(() => setMatchesLoading(false));
  };

  const fetchStats = () => {
    if (!token) return;
    setStatsLoading(true);
    getLeagueStats(token, Number(league.id))
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setStatsLoading(false));
  };

  const handleUpdateResult = async (match: LeagueMatch) => {
    if (!token) return;
    if (goals1.trim() === '' || goals2.trim() === '') {
      setUpdateError('Введіть результат матчу');
      return;
    }
    const goalsUser1 = parseInt(goals1);
    const goalsUser2 = parseInt(goals2);
    if (isNaN(goalsUser1) || isNaN(goalsUser2) || goalsUser1 < 0 || goalsUser2 < 0) {
      setUpdateError('Некоректний результат');
      return;
    }
    try {
      await updateMatchResult(token, match.id, {
        matchId: match.id,
        goalsUser1,
        goalsUser2
      });
      setEditingMatch(null);
      setGoals1('');
      setGoals2('');
      setUpdateError('');
      fetchMatches();
      fetchStats();
    } catch (error) {
      setUpdateError('Помилка оновлення результату');
    }
  };

  const handleGenerateMatches = async () => {
    if (!token || isGenerating || generationCooldown) return;
    setIsGenerating(true);
    setGenerationCooldown(true);
    try {
      await generateMatches(token, Number(league.id));
      fetchMatches();
      setSnackbarMsg('Матчі успішно згенеровано');
    } catch (error) {
      setSnackbarMsg('Помилка при генерації матчів');
    } finally {
      setIsGenerating(false);
      setTimeout(() => {
        setGenerationCooldown(false);
      }, 10000);
    }
  };

  const handleRegister = async () => {
    if (!token || registrationLoading || !user) return;
    setRegistrationLoading(true);
    try {
      await registerSelf(token, Number(league.id), user.id);
      fetchParticipants();
      setSnackbarMsg('Ви успішно зареєструвались');
    } catch (error) {
      setSnackbarMsg('Помилка при реєстрації');
    } finally {
      setRegistrationLoading(false);
    }
  };

  const handleUnregister = async () => {
    if (!token || registrationLoading || !user) return;
    setRegistrationLoading(true);
    try {
      await unregisterSelf(token, Number(league.id), user.id);
      fetchParticipants();
      setSnackbarMsg('Реєстрацію скасовано');
    } catch (error) {
      setSnackbarMsg('Помилка при скасуванні реєстрації');
    } finally {
      setRegistrationLoading(false);
    }
  };

  useEffect(() => {
    fetchParticipants();
  }, [league.id, token]);

  useEffect(() => {
    fetchMatches();
  }, [league.id, token]);

  useEffect(() => {
    fetchStats();
  }, [league.id, token]);

  if (!league) return null;

  return (
    <div
      className="fixed inset-0 bg-[rgba(30,41,59,0.5)] flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-y-auto relative"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900 border-2 border-blue-500 rounded px-4 py-2 inline-block">{league.name}</h1>
            <div className="flex flex-col gap-2 items-end">
              {user?.role === 'ADMIN' && (
                <div className="flex gap-2 mb-2">
                  {String(league.status) === 'DRAFT' && (
                    <>
                      <button className="px-3 py-1 rounded bg-yellow-500 text-white text-xs font-medium hover:bg-yellow-600 transition disabled:opacity-60" onClick={() => handleStatusChange('REGISTRATION')} disabled={statusLoading}>{statusLoading ? '...' : 'Відкрити реєстрацію'}</button>
                      <button className="px-3 py-1 rounded bg-red-600 text-white text-xs font-medium hover:bg-red-700 transition disabled:opacity-60" onClick={() => handleStatusChange('CANCELED')} disabled={statusLoading}>{statusLoading ? '...' : 'Скасувати'}</button>
                    </>
                  )}
                  {String(league.status) === 'REGISTRATION' && (
                    <>
                      <button className="px-3 py-1 rounded bg-green-600 text-white text-xs font-medium hover:bg-green-700 transition disabled:opacity-60" onClick={() => handleStatusChange('ACTIVE')} disabled={statusLoading}>{statusLoading ? '...' : 'Активувати'}</button>
                      <button className="px-3 py-1 rounded bg-red-600 text-white text-xs font-medium hover:bg-red-700 transition disabled:opacity-60" onClick={() => handleStatusChange('CANCELED')} disabled={statusLoading}>{statusLoading ? '...' : 'Скасувати'}</button>
                    </>
                  )}
                  {String(league.status) === 'ACTIVE' && (
                    <button className="px-3 py-1 rounded bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition disabled:opacity-60" onClick={() => handleStatusChange('FINISHED')} disabled={statusLoading}>{statusLoading ? '...' : 'Завершити турнір'}</button>
                  )}
                  {statusError && <span className="text-xs text-red-500 ml-2">{statusError}</span>}
                </div>
              )}
              {user?.role === 'ADMIN' && String(league.status) === 'REGISTRATION' && (
                <div className="flex gap-2 mb-2">
                  <button className="px-3 py-1 rounded bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 transition" onClick={() => setAddModalOpen(true)}>Додати учасника</button>
                  <button className="px-3 py-1 rounded bg-purple-600 text-white text-xs font-medium hover:bg-purple-700 transition" onClick={() => setBulkAddModalOpen(true)}>Масове додавання</button>
                </div>
              )}
            </div>
          </div>
          <div className="mb-4 text-gray-900 text-base">{league.description}</div>
          <div className="flex items-center gap-4 mb-4">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusColors[league.status]}`}>{statusLabels[league.status] || league.status}</span>
          </div>
          <div className="space-y-2 divide-y divide-gray-100 text-gray-900 bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center pb-2">
              <h2 className="text-lg font-semibold text-black">Інформація про турнір</h2>
              <div className="flex gap-2">
                {user && String(league.status) === 'REGISTRATION' && (() => {
                  const isRegistered = participants.some(p => p.username === user.username);
                  return isRegistered ? (
                    <button onClick={handleUnregister} disabled={registrationLoading} className={`px-3 py-1.5 text-sm rounded text-white transition-all ${registrationLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600'}`}>{registrationLoading ? 'Обробка...' : 'Скасувати реєстрацію'}</button>
                  ) : (
                    <button onClick={handleRegister} disabled={registrationLoading || participants.length >= league.maxParticipants} className={`px-3 py-1.5 text-sm rounded text-white transition-all ${(registrationLoading || participants.length >= league.maxParticipants) ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'}`}>{registrationLoading ? 'Обробка...' : participants.length >= league.maxParticipants ? 'Місць немає' : 'Зареєструватися'}</button>
                  );
                })()}
                {user?.role === 'ADMIN' && matches.length === 0 && (
                  <button onClick={handleGenerateMatches} disabled={isGenerating || generationCooldown} className={`px-3 py-1.5 text-sm rounded text-white transition-all ${(isGenerating || generationCooldown) ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'}`}>{isGenerating ? 'Генерація...' : generationCooldown ? 'Зачекайте 10с' : 'Згенерувати матчі'}</button>
                )}
                {user?.role === 'ADMIN' && (
                  <button onClick={() => setEditMatchesModalOpen(true)} className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600">Редагувати матчі</button>
                )}
              </div>
            </div>
            <div className="pt-2"><b>Дата створення:</b> {new Date(league.createdDate).toLocaleString('uk-UA')}</div>
            <div className="pt-2"><b>Кількість учасників:</b> {league.status === 'REGISTRATION' ? `${league.currentParticipants} / ${league.maxParticipants}` : league.currentParticipants}{participantsLoading && <span className="ml-2 text-sm text-gray-500">(оновлення...)</span>}</div>
            {league.startDate && (<div className="pt-2"><b>Дата початку:</b> {new Date(league.startDate).toLocaleString('uk-UA')}</div>)}
            {league.endDate && (<div className="pt-2"><b>Дата завершення:</b> {new Date(league.endDate).toLocaleString('uk-UA')}</div>)}
            {league.winnerAttribute && (<div className="pt-2"><b>Атрибут переможця:</b> {league.winnerAttribute}</div>)}
            {league.winnerCount != null && (<div className="pt-2"><b>Кількість переможців:</b> {league.winnerCount}</div>)}
            {league.saveAttribute && (<div className="pt-2"><b>Атрибут збереження:</b> {league.saveAttribute}</div>)}
            {league.saveCount != null && (<div className="pt-2"><b>Кількість тих, хто зберігає місце:</b> {league.saveCount}</div>)}
            {league.loserAttribute && (<div className="pt-2"><b>Атрибут вибування:</b> {league.loserAttribute}</div>)}
            {league.loserCount != null && (<div className="pt-2"><b>Кількість тих, хто вибуває:</b> {league.loserCount}</div>)}
          </div>
          <div className="mt-6 bg-gray-50 p-4 rounded-lg">
            <b className="text-black">Учасники турніру:</b>
            {participantsLoading ? (
              <div className="py-2"><span>Завантаження...</span></div>
            ) : participants.length === 0 ? (
              <div className="py-2 text-black">Немає учасників</div>
            ) : (
              <div className="grid grid-cols-3 gap-2 py-2">
                {participants.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => handleParticipantClick(p)}
                    className="px-3 py-2 bg-gray-200 rounded-md text-sm cursor-pointer transition-all duration-200 hover:bg-gray-300 text-black"
                  >
                    {p.username}
                    {copiedId === p.id && (
                      <span className="text-xs text-green-600 ml-2">скопійовано</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="mt-8 bg-blue-50 p-4 rounded-lg">
            <h2 className="text-xl font-bold mb-4 text-black">Турнірна таблиця</h2>
            {statsLoading ? (
              <div className="text-black">Завантаження турнірної таблиці...</div>
            ) : !stats?.standings.length ? (
              <div className="text-black">Турнірна таблиця поки порожня</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr className="text-black">
                      <th className="px-4 py-2 text-left text-sm font-medium">Місце</th>
                      <th className="px-4 py-2 text-left text-sm font-medium">Гравець</th>
                      <th className="px-4 py-2 text-center text-sm font-medium">І</th>
                      <th className="px-4 py-2 text-center text-sm font-medium">В</th>
                      <th className="px-4 py-2 text-center text-sm font-medium">Н</th>
                      <th className="px-4 py-2 text-center text-sm font-medium">П</th>
                      <th className="px-4 py-2 text-center text-sm font-medium">ГЗ</th>
                      <th className="px-4 py-2 text-center text-sm font-medium">ГП</th>
                      <th className="px-4 py-2 text-center text-sm font-medium">РГ</th>
                      <th className="px-4 py-2 text-center text-sm font-medium">О</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {stats.standings.map((standing) => (
                      <tr key={standing.userId} className="text-black">
                        <td className="px-4 py-2 text-sm font-medium">{standing.position}</td>
                        <td className="px-4 py-2 text-sm font-medium">{standing.username}</td>
                        <td className="px-4 py-2 text-sm text-center">{standing.matchesPlayed}</td>
                        <td className="px-4 py-2 text-sm text-center">{standing.wins}</td>
                        <td className="px-4 py-2 text-sm text-center">{standing.draws}</td>
                        <td className="px-4 py-2 text-sm text-center">{standing.losses}</td>
                        <td className="px-4 py-2 text-sm text-center">{standing.goalsScored}</td>
                        <td className="px-4 py-2 text-sm text-center">{standing.goalsConceded}</td>
                        <td className="px-4 py-2 text-sm text-center">{standing.goalDifference}</td>
                        <td className="px-4 py-2 text-sm text-center font-bold">{standing.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div className="mt-8 bg-purple-50 p-4 rounded-lg">
            <h2 className="text-xl font-bold mb-4 text-black">Матчі турніру</h2>
            {matchesLoading ? (
              <div className="text-gray-500">Завантаження матчів...</div>
            ) : matches.length === 0 ? (
              <div className="text-gray-500">Матчів поки немає</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="w-24 px-4 py-2 text-center text-sm font-medium text-black">Раунд</th>
                      <th className="px-4 py-2 text-center text-sm font-medium text-black">Рахунок</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {matches.map((match) => (
                      <tr key={match.id} className={`${match.goalsUser1 === null && match.goalsUser2 === null && user && (user.id === match.userId1 || user.id === match.userId2) ? 'bg-blue-50' : ''}`}>
                        <td className="w-24 px-4 py-2 text-sm text-black text-center">{match.roundNumber}</td>
                        <td className="px-4 py-2">
                          <div className="max-w-2xl mx-auto flex items-center justify-center gap-6 text-sm text-black">
                            <div className="w-[140px] text-right">
                              <span className={`inline-block px-3 py-1.5 rounded ${match.goalsUser1 === null ? 'bg-gray-100' : (match.goalsUser1 ?? 0) > (match.goalsUser2 ?? 0) ? 'bg-green-100' : (match.goalsUser1 ?? 0) < (match.goalsUser2 ?? 0) ? 'bg-red-100' : 'bg-gray-100'}`}>{match.username1}</span>
                            </div>
                            <div className="w-24 text-center font-mono font-medium">
                              {match.goalsUser1 === null && match.goalsUser2 === null && user && (user.id === match.userId1 || user.id === match.userId2) ? (
                                <div className="flex items-center justify-center gap-2">
                                  <input type="number" min="0" value={editingMatch === match.id ? goals1 : ''} onClick={() => { if (editingMatch !== match.id) { setEditingMatch(match.id); setGoals1('0'); setGoals2('0'); }}} onChange={(e) => { setGoals1(e.target.value); }} placeholder="-" className="w-10 text-center border rounded py-1 cursor-pointer" />
                                  <span>:</span>
                                  <input type="number" min="0" value={editingMatch === match.id ? goals2 : ''} onClick={() => { if (editingMatch !== match.id) { setEditingMatch(match.id); setGoals1('0'); setGoals2('0'); }}} onChange={(e) => { setGoals2(e.target.value); }} placeholder="-" className="w-10 text-center border rounded py-1 cursor-pointer" />
                                  {editingMatch === match.id && (
                                    <button onClick={() => handleUpdateResult(match)} className="ml-2 px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600">✓</button>
                                  )}
                                </div>
                              ) : (
                                <>{match.goalsUser1 === null ? '-' : match.goalsUser1}:{match.goalsUser2 === null ? '-' : match.goalsUser2}</>
                              )}
                            </div>
                            <div className="w-[140px] text-left">
                              <span className={`inline-block px-3 py-1.5 rounded ${match.goalsUser2 === null ? 'bg-gray-100' : (match.goalsUser2 ?? 0) > (match.goalsUser1 ?? 0) ? 'bg-green-100' : (match.goalsUser2 ?? 0) < (match.goalsUser1 ?? 0) ? 'bg-red-100' : 'bg-gray-100'}`}>{match.username2}</span>
                            </div>
                          </div>
                          {updateError && editingMatch === match.id && (<div className="text-center text-red-500 text-xs mt-1">{updateError}</div>)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          {token && (
            <>
              <AddParticipantModal open={isAddModalOpen} onClose={() => setAddModalOpen(false)} leagueId={league.id.toString()} token={token} onSuccess={() => { setAddModalOpen(false); fetchParticipants(); }} />
              <BulkAddParticipantsModal open={isBulkAddModalOpen} onClose={() => setBulkAddModalOpen(false)} leagueId={league.id.toString()} token={token} onSuccess={() => { setBulkAddModalOpen(false); fetchParticipants(); }} />
            </>
          )}
          {user?.role === 'ADMIN' && token && (
            <EditMatchesModal open={isEditMatchesModalOpen} onClose={() => setEditMatchesModalOpen(false)} matches={matches} token={token} onSuccess={() => { fetchMatches(); fetchStats(); setEditMatchesModalOpen(false); }} />
          )}
        </div>
      </div>
    </div>
  );
} 