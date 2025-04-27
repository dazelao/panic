'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AuthLayout from '@/components/AuthLayout';
import { useParams, useRouter } from 'next/navigation';

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

export default function TournamentBracketPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [tournamentName, setTournamentName] = useState('');
  const { token } = useAuth();
  const params = useParams();
  const router = useRouter();

  const groupMatchesByRound = (matches: Match[]) => {
    const grouped = new Map<number, Match[]>();
    matches.forEach(match => {
      if (!grouped.has(match.roundNumber)) {
        grouped.set(match.roundNumber, []);
      }
      grouped.get(match.roundNumber)?.push(match);
    });
    // Сортируем от ранних раундов к финалу
    return new Map([...grouped.entries()].sort((a, b) => a[0] - b[0]));
  };

  const getParticipantName = (userId: number) => {
    const participant = participants.find(p => p.id === userId);
    return participant?.username || 'Невідомий гравець';
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [tournamentResponse, matchesResponse, participantsResponse] = await Promise.all([
          fetch(`http://localhost:8080/api/tournament/${params.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch(`http://localhost:8080/api/matches/tournament/${params.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch(`http://localhost:8080/api/tournament/${params.id}/participants`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);

        if (tournamentResponse.ok) {
          const tournament = await tournamentResponse.json();
          setTournamentName(tournament.name);
        }
        if (matchesResponse.ok) {
          const matchesData = await matchesResponse.json();
          setMatches(matchesData);
        }
        if (participantsResponse.ok) {
          const participantsData = await participantsResponse.json();
          setParticipants(participantsData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (token && params.id) {
      fetchData();
    }
  }, [token, params.id]);

  return (
    <AuthLayout>
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <button
              onClick={() => router.back()}
              className="text-indigo-600 hover:text-indigo-700 mb-2 flex items-center"
            >
              ← Назад до турніру
            </button>
            <h1 className="text-2xl font-bold text-black">{tournamentName}</h1>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
          </div>
        ) : matches.length > 0 ? (
          <div className="relative bg-white p-8 rounded-lg overflow-x-auto min-h-[600px] border border-gray-200">
            <div className="absolute top-4 left-1/2 -translate-x-1/2">
              <div className="text-indigo-600 text-xl font-bold tracking-wider px-6 py-2 border-2 border-indigo-600 rounded">
                PLAYOFFS
              </div>
            </div>
            <div className="flex justify-start items-center mt-16 pl-8">
              <div className="flex gap-32 items-start">
                {Array.from(groupMatchesByRound(matches)).map(([round, roundMatches], roundIndex, rounds) => {
                  const matchGap = Math.pow(2, roundIndex + 2) * 40;
                  return (
                    <div 
                      key={round} 
                      className="flex flex-col relative"
                      style={{
                        gap: `${matchGap}px`,
                        marginTop: roundIndex === 0 ? '0' : `${matchGap / 2}px`
                      }}
                    >
                      {roundMatches.map((match, matchIndex) => {
                        const isEvenMatch = matchIndex % 2 === 0;
                        const hasNextRound = roundIndex < rounds.length - 1;

                        return (
                          <div 
                            key={match.id} 
                            className="relative"
                          >
                            <div className="w-[240px] bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm relative z-10">
                              <div className={`p-3 ${
                                match.winnerId === match.userId1 
                                  ? 'border-l-4 border-green-500 bg-green-50' 
                                  : 'border-l-4 border-transparent'
                              }`}>
                                <div className="text-sm font-medium text-gray-900">
                                  {getParticipantName(match.userId1)}
                                </div>
                                <div className="text-sm text-gray-600 mt-1">
                                  {match.goalsUser1 !== null ? match.goalsUser1 : '-'}
                                </div>
                              </div>
                              <div className={`p-3 border-t border-gray-200 ${
                                match.winnerId === match.userId2 
                                  ? 'border-l-4 border-green-500 bg-green-50' 
                                  : 'border-l-4 border-transparent'
                              }`}>
                                <div className="text-sm font-medium text-gray-900">
                                  {getParticipantName(match.userId2)}
                                </div>
                                <div className="text-sm text-gray-600 mt-1">
                                  {match.goalsUser2 !== null ? match.goalsUser2 : '-'}
                                </div>
                              </div>
                            </div>

                            {hasNextRound && (
                              <>
                                {/* Горизонтальная линия от матча */}
                                <div 
                                  className="absolute bg-gray-300"
                                  style={{
                                    width: '32px',
                                    height: '2px',
                                    right: '-32px',
                                    top: '50%',
                                    transform: 'translateY(-50%)'
                                  }}
                                />
                                
                                {/* Вертикальная линия */}
                                {isEvenMatch && (
                                  <div 
                                    className="absolute bg-gray-300"
                                    style={{
                                      width: '2px',
                                      height: `${matchGap}px`,
                                      right: '-32px',
                                      top: '50%'
                                    }}
                                  />
                                )}
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-black py-12">
            Немає матчів для відображення
          </div>
        )}
      </div>
    </AuthLayout>
  );
} 