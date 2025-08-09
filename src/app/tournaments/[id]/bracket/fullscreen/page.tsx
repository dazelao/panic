'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useParams, useRouter } from 'next/navigation';
import { ApiService } from '@/config/apiService';
import { BracketView } from '@/components/BracketView';

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

interface PotentialMatch {
  possibleParticipants: number[];
}

export default function FullscreenBracketPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [tournamentName, setTournamentName] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [totalRounds, setTotalRounds] = useState(0);
  const [potentialMatches, setPotentialMatches] = useState<Map<string, PotentialMatch>>(new Map());
  const { token } = useAuth();
  const params = useParams();
  const router = useRouter();

  const calculateTotalRounds = (participantsCount: number): number => {
    return Math.ceil(Math.log(participantsCount) / Math.log(2));
  };

  const calculatePotentialMatches = (allMatches: Match[]) => {
    const calculated = new Map<string, PotentialMatch>();
    
    const matchesByRound = new Map<number, Match[]>();
    allMatches.forEach(match => {
      if (!matchesByRound.has(match.roundNumber)) {
        matchesByRound.set(match.roundNumber, []);
      }
      matchesByRound.get(match.roundNumber)?.push(match);
    });
    
    const sortedRounds = Array.from(matchesByRound.keys()).sort((a, b) => a - b);
    
    for (let i = 0; i < sortedRounds.length; i++) {
      const currentRound = sortedRounds[i];
      const currentMatches = matchesByRound.get(currentRound) || [];
      
      currentMatches.sort((a, b) => a.id - b.id);
      
      for (let j = 0; j < currentMatches.length; j += 2) {
        const match1 = currentMatches[j];
        const match2 = j + 1 < currentMatches.length ? currentMatches[j + 1] : null;
        
        if (match1 && match2) {
          const nextRound = currentRound + 1;
          const nextMatchIndex = Math.floor(j / 2);
          const key = `${nextRound}-${nextMatchIndex}`;
          
          const possibleParticipants: number[] = [];
          
          if (match1.winnerId !== null) {
            possibleParticipants.push(match1.winnerId);
          } else {
            possibleParticipants.push(match1.userId1, match1.userId2);
          }
          
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

  const getParticipantName = (userId: number) => {
    const participant = participants.find(p => p.id === userId);
    return participant?.username || 'Невідомий гравець';
  };

  const handleUserClick = (userId: number) => {
    setSelectedUserId(selectedUserId === userId ? null : userId);
  };

  const handleBack = () => {
    router.push('/tournaments');
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        if (!token) return;

        const [tournament, matchesData, participantsData] = await Promise.all([
          ApiService.tournaments.get(token, Number(params.id)),
          ApiService.matches.getTournamentMatches(token, Number(params.id)),
          ApiService.tournaments.getParticipants(token, Number(params.id))
        ]);

        setTournamentName(tournament.name);
        setMatches(matchesData);
        setParticipants(participantsData);
        
        const calculatedTotalRounds = calculateTotalRounds(participantsData.length);
        setTotalRounds(calculatedTotalRounds);
        
        const calculatedPotentialMatches = calculatePotentialMatches(matchesData);
        setPotentialMatches(calculatedPotentialMatches);
      } catch (error) {
        console.error('Помилка завантаження турнірної сітки:', error);
      } finally {
        setLoading(false);
      }
    };

    if (token && params.id) {
      fetchData();
    }
  }, [token, params.id]);

  return (
    <div className="min-h-screen bg-white">
      {/* Минимальная шапка */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBack}
              className="text-indigo-600 hover:text-indigo-700 flex items-center space-x-1"
            >
              <span>←</span>
              <span>Назад</span>
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">{tournamentName}</h1>
              <p className="text-sm text-gray-500">
                Учасників: {participants.length}, Раундів: {totalRounds}
              </p>
            </div>
          </div>
          
          {/* Простые контролы */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => window.print()}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
            >
              Друк
            </button>
            <button
              onClick={handleBack}
              className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200"
            >
              Закрити
            </button>
          </div>
        </div>
      </div>

      {/* Полноэкранная турнирная сетка */}
      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
          </div>
        ) : (
          <BracketView
            matches={matches}
            totalRounds={totalRounds}
            getParticipantName={getParticipantName}
            selectedUserId={selectedUserId}
            onUserClick={handleUserClick}
            potentialMatches={potentialMatches}
            participantsCount={participants.length}
          />
        )}
      </div>
    </div>
  );
} 