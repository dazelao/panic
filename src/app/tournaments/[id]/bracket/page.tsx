'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AuthLayout from '@/components/AuthLayout';
import { useParams, useRouter } from 'next/navigation';
import { ApiService } from '@/config/apiService';
import MatchCard from '@/components/MatchCard';
import { BracketView } from '@/components/BracketView';
import gsap from 'gsap';

interface Match {
  id: number;
  userId1: number;
  userId2: number;
  goalsUser1: number;
  goalsUser2: number;
  resultUser1: string;
  resultUser2: string;
  tournamentId: number;
  roundNumber: number;
  winnerId: number | null;
  loserId: number | null;
  drawUser1: number | null;
  drawUser2: number | null;
  matchStatus: string;
}

interface Participant {
  id: number;
  username: string;
  eaId: string;
  telegram: string;
}

// Добавим интерфейс для потенциальных участников матча
interface PotentialMatch {
  possibleParticipants: number[];
}

export default function TournamentBracketPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [tournamentName, setTournamentName] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [totalRounds, setTotalRounds] = useState(0);
  const [bracketMode, setBracketMode] = useState<'compact' | 'detailed'>('detailed');
  const [potentialMatches, setPotentialMatches] = useState<Map<string, PotentialMatch>>(new Map());
  const { token } = useAuth();
  const params = useParams();
  const router = useRouter();
  const compactViewRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState('');

  const calculateTotalRounds = (participantsCount: number): number => {
    // Расчет количества раундов на основе логарифма по основанию 2
    // log₂(n) = log(n) / log(2)
    return Math.ceil(Math.log(participantsCount) / Math.log(2));
  };

  const getExpectedMatchesInRound = (round: number, totalRoundsCount: number): number => {
    // Для финала - 1 матч, для предыдущих раундов - 2^(totalRounds - round)
    return Math.pow(2, totalRoundsCount - round);
  };

  // Функция для вычисления потенциальных матчей на основе текущих результатов
  const calculatePotentialMatches = (allMatches: Match[]) => {
    const calculated = new Map<string, PotentialMatch>();
    
    // Группируем матчи по раундам
    const matchesByRound = new Map<number, Match[]>();
    allMatches.forEach(match => {
      if (!matchesByRound.has(match.roundNumber)) {
        matchesByRound.set(match.roundNumber, []);
      }
      matchesByRound.get(match.roundNumber)?.push(match);
    });
    
    // Сортируем раунды по возрастанию
    const sortedRounds = Array.from(matchesByRound.keys()).sort((a, b) => a - b);
    
    // Для каждого раунда, кроме последнего
    for (let i = 0; i < sortedRounds.length; i++) {
      const currentRound = sortedRounds[i];
      const currentMatches = matchesByRound.get(currentRound) || [];
      
      // Сортируем матчи текущего раунда по возрастанию ID
      currentMatches.sort((a, b) => a.id - b.id);
      
      // Обрабатываем матчи текущего раунда попарно
      for (let j = 0; j < currentMatches.length; j += 2) {
        const match1 = currentMatches[j];
        const match2 = j + 1 < currentMatches.length ? currentMatches[j + 1] : null;
        
        if (match1 && match2) {
          // Вычисляем потенциальных участников для следующего раунда
          const nextRound = currentRound + 1;
          const nextMatchIndex = Math.floor(j / 2);
          const key = `${nextRound}-${nextMatchIndex}`;
          
          // Собираем потенциальных участников из обоих матчей
          const possibleParticipants: number[] = [];
          
          // Из первого матча
          if (match1.winnerId !== null) {
            possibleParticipants.push(match1.winnerId);
          } else {
            possibleParticipants.push(match1.userId1, match1.userId2);
          }
          
          // Из второго матча
          if (match2.winnerId !== null) {
            possibleParticipants.push(match2.winnerId);
          } else {
            possibleParticipants.push(match2.userId1, match2.userId2);
          }
          
          calculated.set(key, { possibleParticipants });
        }
      }
    }
    
    return calculated;
  };

  const groupMatchesByRound = (matches: Match[]) => {
    const grouped = new Map<number, Match[]>();
    
    // Создаем пустые массивы для всех ожидаемых раундов
    for (let i = 1; i <= totalRounds; i++) {
      grouped.set(i, []);
    }
    
    // Заполняем существующими матчами
    matches.forEach(match => {
      if (grouped.has(match.roundNumber)) {
        grouped.get(match.roundNumber)?.push(match);
      } else {
        grouped.set(match.roundNumber, [match]);
      }
    });
    
    // Сортируем матчи в каждом раунде
    grouped.forEach((matchesInRound, roundNumber) => {
      // Сортировка может зависеть от требований
      matchesInRound.sort((a, b) => a.id - b.id);
    });
    
    return new Map([...grouped.entries()].sort((a, b) => a[0] - b[0]));
  };

  const getParticipantName = (userId: number) => {
    const participant = participants.find(p => p.id === userId);
    return participant?.username || 'Невідомий гравець';
  };

  const getRoundName = (roundNumber: number, maxRounds: number) => {
    if (roundNumber === maxRounds) return 'Фінал';
    if (roundNumber === maxRounds - 1) return 'Півфінал';
    if (roundNumber === maxRounds - 2) return 'Чвертьфінал';
    if (roundNumber === maxRounds - 3) return '1/8 фіналу';
    if (roundNumber === maxRounds - 4) return '1/16 фіналу';
    if (roundNumber === maxRounds - 5) return '1/32 фіналу';
    return `Раунд ${roundNumber}`;
  };

  const isMatchWithUser = (match: Match) => {
    if (!selectedUserId) return false;
    return match.userId1 === selectedUserId || match.userId2 === selectedUserId;
  };

  // Функция для определения потенциальных будущих матчей с участником
  const isPotentialMatchForUser = (round: number, matchIndex: number) => {
    if (!selectedUserId) return false;
    
    const key = `${round}-${matchIndex}`;
    const potentialMatch = potentialMatches.get(key);
    
    if (potentialMatch) {
      return potentialMatch.possibleParticipants.includes(selectedUserId);
    }
    
    return false;
  };

  // Функция для получения строки с возможными оппонентами
  const getPotentialOpponents = (round: number, matchIndex: number) => {
    const key = `${round}-${matchIndex}`;
    const potentialMatch = potentialMatches.get(key);
    
    if (!potentialMatch) return 'Майбутній матч';
    
    // Если матч уже определен полностью (2 участника)
    if (potentialMatch.possibleParticipants.length === 2) {
      return `${getParticipantName(potentialMatch.possibleParticipants[0])} vs ${getParticipantName(potentialMatch.possibleParticipants[1])}`;
    }
    
    // Если в матче есть уже определенные участники и возможные
    if (potentialMatch.possibleParticipants.length >= 2) {
      // Группируем участников по их текущим матчам
      const groups = new Map<number, number[]>();
      potentialMatch.possibleParticipants.forEach(userId => {
        // Находим матч, в котором участвует пользователь
        const userMatch = matches.find(m => 
          m.roundNumber === round - 1 && 
          (m.userId1 === userId || m.userId2 === userId)
        );
        
        if (userMatch) {
          if (!groups.has(userMatch.id)) {
            groups.set(userMatch.id, []);
          }
          groups.get(userMatch.id)?.push(userId);
        }
      });
      
      // Формируем строку с потенциальными оппонентами
      const opponents: string[] = [];
      groups.forEach(userIds => {
        if (userIds.length === 1) {
          // Если победитель матча уже определен
          opponents.push(getParticipantName(userIds[0]));
        } else {
          // Если победитель не определен, показываем вариации
          opponents.push(`${getParticipantName(userIds[0])}/${getParticipantName(userIds[1])}`);
        }
      });
      
      if (opponents.length > 0) {
        return opponents.join(' vs ');
      }
    }
    
    return 'Очікуємо результатів';
  };

  const handleUserClick = (userId: number) => {
    setSelectedUserId(selectedUserId === userId ? null : userId);
  };

  const toggleBracketMode = () => {
    setBracketMode(prevMode => prevMode === 'compact' ? 'detailed' : 'compact');
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        if (!token) return;

        const [tournament, matchesData, participantsData] = await Promise.all([
          ApiService.tournaments.get(token, Number(params.id)),
          ApiService.matches.getTournamentMatches(token, Number(params.id)),
          ApiService.tournaments.getParticipants(token, Number(params.id))
        ]);

        setTournamentName(tournament.name);
        setMatches(matchesData);
        setParticipants(participantsData);
        
        // Рассчитываем общее количество раундов на основе числа участников
        const calculatedTotalRounds = calculateTotalRounds(participantsData.length);
        setTotalRounds(calculatedTotalRounds);
        
        // Вычисляем потенциальные матчи
        const calculatedPotentialMatches = calculatePotentialMatches(matchesData);
        setPotentialMatches(calculatedPotentialMatches);
      } catch (error) {
        setError('Не вдалося отримати дані сітки');
      } finally {
        setLoading(false);
      }
    };

    if (token && params.id) {
      fetchData();
    }
  }, [token, params.id]);

  const groupedMatches = groupMatchesByRound(matches);

  // Определяем классы для Grid в зависимости от количества раундов
  const getGridCols = () => {
    // Адаптируем количество колонок в зависимости от количества раундов
    if (totalRounds <= 3) return 'grid-cols-1 md:grid-cols-3';
    if (totalRounds <= 4) return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4';
    if (totalRounds <= 6) return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6';
    return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7';
  };

  // Animation for compact view
  useEffect(() => {
    // Only run animation when in compact mode and not loading
    if (bracketMode !== 'compact' || loading || !compactViewRef.current) return;
    
    // Get all round cards
    const roundCards = compactViewRef.current.querySelectorAll('.round-card');
    // Get all match cards in compact view
    const matchCards = compactViewRef.current.querySelectorAll('.match-item');
    
    // Hide all elements initially
    gsap.set(roundCards, {
      y: -40,
      opacity: 0,
      scale: 0.95
    });
    
    gsap.set(matchCards, {
      y: -30,
      opacity: 0,
      scale: 0.9
    });
    
    // Create the animation timeline
    const tl = gsap.timeline();
    
    // First animate the round cards
    tl.to(roundCards, {
      y: 0,
      opacity: 1,
      scale: 1,
      stagger: 0.1,
      duration: 0.4,
      ease: "back.out(1.2)",
      delay: 0.2
    });
    
    // Then animate the match cards
    tl.to(matchCards, {
      y: 0,
      opacity: 1,
      scale: 1,
      stagger: {
        each: 0.05,
        from: "start",
        grid: "auto"
      },
      duration: 0.4,
      ease: "back.out(1.2)"
    }, "-=0.2");
    
    // Clean up on mode change
    return () => {
      tl.kill();
    };
  }, [bracketMode, loading, matches.length]);

  return (
    <AuthLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex-1">
            <button
              onClick={() => router.back()}
              className="text-indigo-600 hover:text-indigo-700 mb-2 flex items-center"
            >
              ← Назад до турніру
            </button>
            <div className="flex items-center mb-1">
              <h1 className="text-2xl font-bold text-black mr-4">{tournamentName}</h1>
              <button
                onClick={toggleBracketMode}
                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
              >
                {bracketMode === 'compact' ? 'Детальний вигляд' : 'Компактний вигляд'}
              </button>
            </div>
            <p className="text-sm text-gray-500">Учасників: {participants.length}, Раундів: {totalRounds}</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
          </div>
        ) : (
          bracketMode === 'detailed' ? (
            <div className="bg-white p-4 rounded-lg shadow overflow-auto">
              <div className="w-full" style={{ minWidth: totalRounds * 250 + 'px' }}>
                <BracketView
                  matches={matches}
                  totalRounds={totalRounds}
                  getParticipantName={getParticipantName}
                  selectedUserId={selectedUserId}
                  onUserClick={handleUserClick}
                  potentialMatches={potentialMatches}
                />
              </div>
            </div>
          ) : (
            <div ref={compactViewRef} className={`grid ${getGridCols()} gap-6`}>
              {Array.from(groupedMatches.entries()).map(([round, roundMatches]) => {
                const expectedMatches = getExpectedMatchesInRound(round, totalRounds);
                const placeholderMatches = Array.from({ length: Math.max(0, expectedMatches - roundMatches.length) });
                
                return (
                  <div key={round} className="bg-white rounded-lg shadow p-6 round-card">
                    <h2 className="text-lg font-semibold text-indigo-600 mb-4">
                      {getRoundName(round, totalRounds)}
                    </h2>
                    <div className="space-y-4">
                      {roundMatches.length > 0 ? (
                        roundMatches.map((match, index) => {
                          const isHighlighted = isMatchWithUser(match);
                          
                          return (
                            <div key={match.id} className="match-item">
                              <MatchCard
                                teamOne={{
                                  id: match.userId1,
                                  name: getParticipantName(match.userId1),
                                  score: match.goalsUser1,
                                  isWinner: match.winnerId === match.userId1
                                }}
                                teamTwo={{
                                  id: match.userId2,
                                  name: getParticipantName(match.userId2),
                                  score: match.goalsUser2,
                                  isWinner: match.winnerId === match.userId2
                                }}
                                isHighlighted={isHighlighted}
                                highlightedUserId={selectedUserId}
                                onUserClick={handleUserClick}
                              />
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center text-gray-500 italic text-sm match-item">
                          Матчі ще не створені
                        </div>
                      )}
                      
                      {/* Плейсхолдеры для будущих матчей */}
                      {placeholderMatches.map((_, index) => {
                        const matchIndex = roundMatches.length + index;
                        const isPotential = isPotentialMatchForUser(round, matchIndex);
                        const opponentsText = getPotentialOpponents(round, matchIndex);
                        
                        return (
                          <div 
                            key={`placeholder-${round}-${matchIndex}`}
                            className={`p-4 border border-dashed rounded-lg match-item ${
                              isPotential ? 'bg-indigo-50 border-indigo-300' : 'border-gray-200'
                            }`}
                          >
                            <div className="text-center text-sm">
                              {opponentsText || 'Очікуємо матчів'}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>
    </AuthLayout>
  );
} 