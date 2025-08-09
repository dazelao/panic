import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import MatchCard from './MatchCard';
import gsap from 'gsap';

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
  participantsCount?: number;
}

// Оптимальные настройки в зависимости от количества участников
const getBracketSettings = (participantsCount: number) => {
  if (participantsCount <= 32) return { 
    matchHeight: 70, 
    roundWidth: 220, 
    rowGap: 20,
    fontSize: 'text-sm',
    padding: 'p-3'
  };
  if (participantsCount <= 128) return { 
    matchHeight: 50, 
    roundWidth: 180, 
    rowGap: 16,
    fontSize: 'text-xs',
    padding: 'p-2'
  };
  if (participantsCount <= 512) return { 
    matchHeight: 40, 
    roundWidth: 160, 
    rowGap: 14,
    fontSize: 'text-xs',
    padding: 'p-2'
  };
  return { 
    matchHeight: 35, 
    roundWidth: 140, 
    rowGap: 12,
    fontSize: 'text-xs',
    padding: 'p-1'
  };
};

export const BracketView: React.FC<BracketViewProps> = ({
  matches,
  totalRounds,
  getParticipantName,
  selectedUserId,
  onUserClick,
  potentialMatches,
  participantsCount = 0
}) => {
  const bracketRef = useRef<HTMLDivElement>(null);
  
  // Настройки отображения
  const settings = useMemo(() => getBracketSettings(participantsCount), [participantsCount]);
  const { matchHeight: cellHeight, roundWidth, rowGap, fontSize, padding } = settings;

  // Группируем матчи по раундам
  const matchesByRound = useMemo(() => {
    const grouped = new Map<number, Match[]>();
    for (let i = 1; i <= totalRounds; i++) {
      grouped.set(i, []);
    }
    
    matches.forEach(match => {
      if (grouped.has(match.roundNumber)) {
        grouped.get(match.roundNumber)?.push(match);
      }
    });
    
    // Сортируем матчи в каждом раунде
    grouped.forEach((roundMatches) => {
      roundMatches.sort((a, b) => a.id - b.id);
    });
    
    return grouped;
  }, [matches, totalRounds]);
  
  // Функция для определения потенциальных будущих матчей с участником
  const isPotentialMatchForUser = useCallback((round: number, matchIndex: number) => {
    if (!selectedUserId) return false;
    
    const key = `${round}-${matchIndex}`;
    const potentialMatch = potentialMatches.get(key);
    
    if (potentialMatch) {
      return potentialMatch.possibleParticipants.includes(selectedUserId);
    }
    
    return false;
  }, [selectedUserId, potentialMatches]);
  
  // Функция для получения строки с возможными оппонентами
  const getPotentialOpponents = useCallback((round: number, matchIndex: number) => {
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
  }, [potentialMatches, getParticipantName, matches]);
  
  // Функция для получения высоты раунда (с увеличенными отступами для первого раунда)
  const getRoundHeight = useCallback((round: number) => {
    const matchesInRound = Math.pow(2, totalRounds - round);
    const effectiveRowGap = round === 1 ? rowGap * 2 : rowGap;
    return matchesInRound * cellHeight + (matchesInRound - 1) * effectiveRowGap;
  }, [totalRounds, cellHeight, rowGap]);
  
  // Функция для вычисления верхней позиции матча
  const getMatchTopPosition = useCallback((round: number, matchIndex: number) => {
    const matchesInRound = Math.pow(2, totalRounds - round);
    
    let totalHeight, heightPerMatch;
    
    if (round === 1) {
      // Увеличиваем отступы только для первого раунда
      const firstRoundGap = rowGap * 2;
      totalHeight = matchesInRound * cellHeight + (matchesInRound - 1) * firstRoundGap;
      heightPerMatch = totalHeight / matchesInRound;
    } else {
      // Для остальных раундов позиционируем относительно первого раунда
      const firstRoundHeight = getRoundHeight(1);
      heightPerMatch = firstRoundHeight / matchesInRound;
    }
    
    return matchIndex * heightPerMatch + (heightPerMatch - cellHeight) / 2;
  }, [totalRounds, cellHeight, rowGap, getRoundHeight]);
  
  const getRoundName = useCallback((roundNumber: number) => {
    if (roundNumber === totalRounds) return 'Фінал';
    if (roundNumber === totalRounds - 1) return 'Півфінал';
    if (roundNumber === totalRounds - 2) return 'Чвертьфінал';
    if (roundNumber === totalRounds - 3) return '1/8 фіналу';
    if (roundNumber === totalRounds - 4) return '1/16 фіналу';
    if (roundNumber === totalRounds - 5) return '1/32 фіналу';
    return `Раунд ${roundNumber}`;
  }, [totalRounds]);

  // Анимация появления
  useEffect(() => {
    if (!bracketRef.current) return;
    
    const matchCards = bracketRef.current.querySelectorAll('.match-card-container');
    const connectorLines = bracketRef.current.querySelectorAll('.connector-line');
    const roundHeaders = bracketRef.current.querySelectorAll('.round-header');
    
    gsap.set(roundHeaders, { y: -30, opacity: 0 });
    gsap.set(matchCards, { y: -50, opacity: 0, scale: 0.9 });
    gsap.set(connectorLines, { opacity: 0, scale: 0.5, transformOrigin: "center left" });
    
    const tl = gsap.timeline();
    
    tl.to(roundHeaders, {
      y: 0, opacity: 1, stagger: 0.1, duration: 0.3, ease: "power2.out", delay: 0.1
    })
    .to(matchCards, {
      y: 0, opacity: 1, scale: 1,
      stagger: { each: 0.05, from: "start", grid: "auto" },
      duration: 0.4, ease: "back.out(1.2)",
    }, "-=0.1")
    .to(connectorLines, {
      opacity: 1, scale: 1,
      stagger: { each: 0.02, from: "start" },
      duration: 0.3, ease: "power2.out"
    }, "-=0.2");
    
    return () => {
      tl.kill();
    };
  }, [matches.length]);
  
  return (
    <div className="relative w-full overflow-auto">
      <div 
        ref={bracketRef} 
        className="relative w-full py-4"
        style={{ minWidth: totalRounds * roundWidth + 'px' }}
      >
        <div className="flex flex-col">
          {/* Заголовки раундов */}
          <div className="flex mb-6">
            {Array.from({ length: totalRounds }).map((_, index) => {
              const round = index + 1;
              return (
                <div 
                  key={`header-${round}`} 
                  className={`text-center py-2 font-semibold text-indigo-600 border-b round-header ${fontSize}`}
                  style={{ width: roundWidth }}
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
                  className="relative"
                  style={{ 
                    width: roundWidth,
                    height: getRoundHeight(1) 
                  }}
                >
                  {/* Отображаем матчи */}
                  {roundMatches.map((match, idx) => {
                    const isHighlighted = selectedUserId && (match.userId1 === selectedUserId || match.userId2 === selectedUserId);
                    const topPosition = getMatchTopPosition(round, idx);
                    
                    return (
                      <div 
                        key={match.id} 
                        className="absolute w-[calc(100%-24px)] mx-3 match-card-container"
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
                          compact={participantsCount > 128}
                          fontSize={fontSize}
                          padding={padding}
                        />
                      </div>
                    );
                  })}
                  
                  {/* Плейсхолдеры для будущих матчей */}
                  {roundMatches.length < expectedMatchCount && 
                    Array.from({ length: expectedMatchCount - roundMatches.length }).map((_, idx) => {
                      const matchIndex = roundMatches.length + idx;
                      const isPotential = isPotentialMatchForUser(round, matchIndex);
                      const opponentsText = getPotentialOpponents(round, matchIndex);
                      const topPosition = getMatchTopPosition(round, matchIndex);
                      
                      return (
                        <div 
                          key={`placeholder-${round}-${matchIndex}`} 
                          className={`absolute w-[calc(100%-24px)] mx-3 border border-dashed rounded-lg match-card-container ${padding} ${
                            isPotential ? 'bg-indigo-50 border-indigo-300' : 'text-gray-400 border-gray-200'
                          }`}
                          style={{ top: topPosition, height: cellHeight }}
                        >
                          <div className={`text-center font-medium h-full flex items-center justify-center ${fontSize}`}>
                            {opponentsText || 'Очікуємо матчів'}
                          </div>
                        </div>
                      );
                    })}
                  
                  {/* Соединительные линии */}
                  {round < totalRounds && (
                    <>
                      {Array.from({ length: Math.pow(2, totalRounds - round - 1) }).map((_, idx) => {
                        const matchIndex1 = idx * 2;
                        const matchIndex2 = idx * 2 + 1;
                        const topPos1 = getMatchTopPosition(round, matchIndex1) + cellHeight / 2;
                        const topPos2 = getMatchTopPosition(round, matchIndex2) + cellHeight / 2;
                        const nextRoundTopPos = getMatchTopPosition(round + 1, idx) + cellHeight / 2;
                        
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
                            <div
                              className={`absolute h-[2px] connector-line ${isHighlighted ? 'bg-indigo-500' : 'bg-gray-300'}`}
                              style={{ top: topPos1, left: 'calc(100% - 12px)', width: '12px' }}
                            />
                            <div
                              className={`absolute h-[2px] connector-line ${isHighlighted ? 'bg-indigo-500' : 'bg-gray-300'}`}
                              style={{ top: topPos2, left: 'calc(100% - 12px)', width: '12px' }}
                            />
                            <div
                              className={`absolute w-[2px] connector-line ${isHighlighted ? 'bg-indigo-500' : 'bg-gray-300'}`}
                              style={{
                                top: Math.min(topPos1, topPos2),
                                left: 'calc(100% - 1px)',
                                height: Math.abs(topPos2 - topPos1)
                              }}
                            />
                            <div
                              className={`absolute h-[2px] connector-line ${isHighlighted ? 'bg-indigo-500' : 'bg-gray-300'}`}
                              style={{ top: nextRoundTopPos, left: '100%', width: '12px', zIndex: 5 }}
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
    </div>
  );
};

export default BracketView; 