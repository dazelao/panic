'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AuthLayout from '@/components/AuthLayout';
import { useParams, useRouter } from 'next/navigation';
import { ApiService } from '@/config/apiService';

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
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
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
    return new Map([...grouped.entries()].sort((a, b) => a[0] - b[0]));
  };

  const getParticipantName = (userId: number) => {
    const participant = participants.find(p => p.id === userId);
    return participant?.username || 'Невідомий гравець';
  };

  const getRoundName = (roundNumber: number, totalRounds: number) => {
    if (roundNumber === totalRounds) return 'Фінал';
    if (roundNumber === totalRounds - 1) return 'Півфінал';
    return `Раунд ${roundNumber}`;
  };

  const isMatchWithUser = (match: Match) => {
    if (!selectedUserId) return false;
    return match.userId1 === selectedUserId || match.userId2 === selectedUserId;
  };

  const handleUserClick = (userId: number) => {
    setSelectedUserId(selectedUserId === userId ? null : userId);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (!token) return;

        const [tournament, matchesData, participantsData] = await Promise.all([
          ApiService.tournaments.get(token, Number(params.id)),
          ApiService.matches.getTournamentMatches(token, Number(params.id)),
          ApiService.tournaments.getParticipants(token, Number(params.id))
        ]);

        setTournamentName(tournament.name);
        setMatches(matchesData);
        setParticipants(participantsData);
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

  const groupedMatches = groupMatchesByRound(matches);
  const totalRounds = groupedMatches.size;

  return (
    <AuthLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from(groupedMatches.entries()).map(([round, roundMatches]) => (
              <div key={round} className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-indigo-600 mb-4">
                  {getRoundName(round, totalRounds)}
                </h2>
                <div className="space-y-4">
                  {roundMatches.map((match) => {
                    const isHighlighted = isMatchWithUser(match);
                    return (
                      <div 
                        key={match.id}
                        className={`relative rounded-lg overflow-hidden transition-all duration-300 ${
                          isHighlighted 
                            ? 'shadow-[0_4px_20px_rgba(0,0,0,0.2)] scale-[1.05] z-10' 
                            : 'border border-gray-200'
                        }`}
                      >
                        <div 
                          className={`p-3 cursor-pointer ${
                            match.winnerId === match.userId1 
                              ? 'border-l-4 border-green-500 bg-green-50' 
                              : isHighlighted && match.userId1 === selectedUserId
                                ? 'border-l-4 border-gray-500 bg-gray-100'
                                : 'border-l-4 border-transparent'
                          }`}
                          onClick={() => handleUserClick(match.userId1)}
                        >
                          <div className="text-sm font-medium text-gray-900">
                            {getParticipantName(match.userId1)}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {match.goalsUser1 !== null ? match.goalsUser1 : '-'}
                          </div>
                        </div>
                        <div 
                          className={`p-3 border-t border-gray-200 cursor-pointer ${
                            match.winnerId === match.userId2 
                              ? 'border-l-4 border-green-500 bg-green-50' 
                              : isHighlighted && match.userId2 === selectedUserId
                                ? 'border-l-4 border-gray-500 bg-gray-100'
                                : 'border-l-4 border-transparent'
                          }`}
                          onClick={() => handleUserClick(match.userId2)}
                        >
                          <div className="text-sm font-medium text-gray-900">
                            {getParticipantName(match.userId2)}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {match.goalsUser2 !== null ? match.goalsUser2 : '-'}
                          </div>
                        </div>
                        {isHighlighted && (
                          <div 
                            className="absolute inset-0 rounded-lg pointer-events-none z-20" 
                            style={{
                              border: '2px solid transparent',
                              borderImage: 'linear-gradient(to bottom, #2563eb 50%, #fbbf24 50%) 1'
                            }} 
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
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