import React from 'react';
import MatchCard from './MatchCard';

interface Match {
  id: number;
  userId1: number;
  userId2: number;
  goalsUser1: number | null;
  goalsUser2: number | null;
  roundNumber: number;
  winnerId: number | null;
}

interface BracketViewProps {
  matches: Match[];
  totalRounds: number;
  getParticipantName: (userId: number) => string;
  selectedUserId: number | null;
  onUserClick: (userId: number) => void;
  potentialMatches: Map<string, { possibleParticipants: number[] }>;
}

export const BracketView: React.FC<BracketViewProps> = ({
  matches,
  totalRounds,
  getParticipantName,
  selectedUserId,
  onUserClick,
  potentialMatches
}) => {
  // Группируем матчи по раундам
  const matchesByRound = new Map<number, Match[]>();
  for (let i = 1; i <= totalRounds; i++) {
    matchesByRound.set(i, []);
  }
  
  matches.forEach(match => {
    if (matchesByRound.has(match.roundNumber)) {
      matchesByRound.get(match.roundNumber)?.push(match);
    }
  });
  
  // Сортируем матчи в каждом раунде
  matchesByRound.forEach((roundMatches, round) => {
    roundMatches.sort((a, b) => a.id - b.id);
  });
  
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
    
    if (!potentialMatch) return '';
    
    if (potentialMatch.possibleParticipants.length === 2) {
      return `${getParticipantName(potentialMatch.possibleParticipants[0])} vs ${getParticipantName(potentialMatch.possibleParticipants[1])}`;
    }
    
    const opponents: string[] = [];
    const groups = new Map<number, number[]>();
    
    // Группируем участников по их возможным матчам
    potentialMatch.possibleParticipants.forEach(userId => {
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
    
    groups.forEach(userIds => {
      if (userIds.length === 1) {
        opponents.push(getParticipantName(userIds[0]));
      } else {
        opponents.push(`${getParticipantName(userIds[0])}/${getParticipantName(userIds[1])}`);
      }
    });
    
    return opponents.join(' vs ');
  };
  
  // Вычисляем максимальное количество матчей в 1-м раунде
  const firstRoundMatchCount = Math.pow(2, totalRounds - 1);
  
  // Вычисляем высоту ячейки и отступы между ними
  const cellHeight = 80; // px
  const rowGap = 20; // px
  
  // Функция для получения высоты раунда (с учетом отступов)
  const getRoundHeight = (round: number) => {
    const matchesInRound = Math.pow(2, totalRounds - round);
    return matchesInRound * cellHeight + (matchesInRound - 1) * rowGap;
  };
  
  // Функция для вычисления верхней позиции матча
  const getMatchTopPosition = (round: number, matchIndex: number) => {
    const matchesInRound = Math.pow(2, totalRounds - round);
    const totalHeight = getRoundHeight(1);
    const heightPerMatch = totalHeight / matchesInRound;
    return matchIndex * heightPerMatch + (heightPerMatch - cellHeight) / 2;
  };
  
  const getRoundName = (roundNumber: number) => {
    if (roundNumber === totalRounds) return 'Фінал';
    if (roundNumber === totalRounds - 1) return 'Півфінал';
    if (roundNumber === totalRounds - 2) return 'Чвертьфінал';
    if (roundNumber === totalRounds - 3) return '1/8 фіналу';
    if (roundNumber === totalRounds - 4) return '1/16 фіналу';
    if (roundNumber === totalRounds - 5) return '1/32 фіналу';
    return `Раунд ${roundNumber}`;
  };
  
  return (
    <div className="relative w-full overflow-x-auto py-4">
      <div className="flex flex-col">
        {/* Заголовки раундов - интегрированы в скролл */}
        <div className="flex mb-6">
          {Array.from({ length: totalRounds }).map((_, index) => {
            const round = index + 1;
            return (
              <div 
                key={`header-${round}`} 
                className="flex-1 text-center py-2 font-semibold text-indigo-600 border-b"
              >
                {getRoundName(round)}
              </div>
            );
          })}
        </div>
        
        {/* Содержимое сетки */}
        <div className="flex w-full" style={{ minHeight: getRoundHeight(1) + 40 }}>
          {Array.from({ length: totalRounds }).map((_, index) => {
            const round = index + 1;
            const roundMatches = matchesByRound.get(round) || [];
            const expectedMatchCount = Math.pow(2, totalRounds - round);
            
            return (
              <div 
                key={`round-${round}`} 
                className="flex-1 relative"
                style={{ height: getRoundHeight(1) }}
              >
                {/* Отображаем существующие матчи */}
                {roundMatches.map((match, idx) => {
                  const isHighlighted = selectedUserId && (match.userId1 === selectedUserId || match.userId2 === selectedUserId);
                  const topPosition = getMatchTopPosition(round, idx);
                  
                  return (
                    <div 
                      key={match.id} 
                      className="absolute w-[calc(100%-24px)] mx-3"
                      style={{ top: topPosition }}
                    >
                      <MatchCard
                        teamOne={{
                          id: match.userId1,
                          name: getParticipantName(match.userId1),
                          score: match.goalsUser1,
                          isWinner: Boolean(match.winnerId === match.userId1)
                        }}
                        teamTwo={{
                          id: match.userId2,
                          name: getParticipantName(match.userId2),
                          score: match.goalsUser2,
                          isWinner: Boolean(match.winnerId === match.userId2)
                        }}
                        isHighlighted={Boolean(isHighlighted)}
                        highlightedUserId={selectedUserId}
                        onUserClick={onUserClick}
                      />
                    </div>
                  );
                })}
                
                {/* Отображаем плейсхолдеры для будущих матчей */}
                {roundMatches.length < expectedMatchCount && Array.from({ length: expectedMatchCount - roundMatches.length }).map((_, idx) => {
                  const matchIndex = roundMatches.length + idx;
                  const isPotential = isPotentialMatchForUser(round, matchIndex);
                  const opponentsText = getPotentialOpponents(round, matchIndex);
                  const topPosition = getMatchTopPosition(round, matchIndex);
                  
                  return (
                    <div 
                      key={`placeholder-${round}-${matchIndex}`} 
                      className={`absolute w-[calc(100%-24px)] mx-3 p-3 border border-dashed rounded-lg ${
                        isPotential ? 'bg-indigo-50 border-indigo-300' : 'text-gray-400 border-gray-200'
                      }`}
                      style={{ top: topPosition, height: cellHeight }}
                    >
                      <div className="text-center text-sm font-medium h-full flex items-center justify-center">
                        {opponentsText || 'Очікуємо матчів'}
                      </div>
                    </div>
                  );
                })}
                
                {/* Соединительные линии для матчей */}
                {round < totalRounds && (
                  <>
                    {Array.from({ length: Math.pow(2, totalRounds - round - 1) }).map((_, idx) => {
                      const matchIndex1 = idx * 2;
                      const matchIndex2 = idx * 2 + 1;
                      const topPos1 = getMatchTopPosition(round, matchIndex1) + cellHeight / 2;
                      const topPos2 = getMatchTopPosition(round, matchIndex2) + cellHeight / 2;
                      const nextRoundTopPos = getMatchTopPosition(round + 1, idx) + cellHeight / 2;
                      
                      // Определяем, есть ли выбранный пользователь в этих матчах или плейсхолдерах
                      const match1 = roundMatches[matchIndex1];
                      const match2 = roundMatches[matchIndex2];
                      const isPotentialForUser = isPotentialMatchForUser(round + 1, idx);
                      
                      let isHighlighted = false;
                      if (selectedUserId) {
                        if (match1 && (match1.userId1 === selectedUserId || match1.userId2 === selectedUserId)) {
                          isHighlighted = true;
                        } else if (match2 && (match2.userId1 === selectedUserId || match2.userId2 === selectedUserId)) {
                          isHighlighted = true;
                        } else if (isPotentialForUser) {
                          isHighlighted = true;
                        }
                      }
                      
                      return (
                        <React.Fragment key={`connector-${round}-${idx}`}>
                          {/* Горизонтальная линия от 1-го матча */}
                          <div
                            className={`absolute h-[2px] ${isHighlighted ? 'bg-indigo-500' : 'bg-gray-300'}`}
                            style={{
                              top: topPos1,
                              left: 'calc(100% - 12px)',
                              width: '12px'
                            }}
                          />
                          {/* Горизонтальная линия от 2-го матча */}
                          <div
                            className={`absolute h-[2px] ${isHighlighted ? 'bg-indigo-500' : 'bg-gray-300'}`}
                            style={{
                              top: topPos2,
                              left: 'calc(100% - 12px)',
                              width: '12px'
                            }}
                          />
                          {/* Вертикальная соединительная линия */}
                          <div
                            className={`absolute w-[2px] ${isHighlighted ? 'bg-indigo-500' : 'bg-gray-300'}`}
                            style={{
                              top: Math.min(topPos1, topPos2),
                              left: 'calc(100% - 1px)',
                              height: Math.abs(topPos2 - topPos1)
                            }}
                          />
                          {/* Горизонтальная линия к следующему раунду */}
                          <div
                            className={`absolute h-[2px] ${isHighlighted ? 'bg-indigo-500' : 'bg-gray-300'}`}
                            style={{
                              top: nextRoundTopPos,
                              left: '100%',
                              width: '12px',
                              zIndex: 5
                            }}
                          />
                        </React.Fragment>
                      );
                    })}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BracketView; 