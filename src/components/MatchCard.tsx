import React from 'react';

interface MatchCardProps {
  teamOne: {
    id: number;
    name: string;
    score: number | null;
    isWinner: boolean;
  };
  teamTwo: {
    id: number;
    name: string;
    score: number | null;
    isWinner: boolean;
  };
  isHighlighted?: boolean;
  highlightedUserId?: number | null;
  onUserClick: (userId: number) => void;
  compact?: boolean;
  fontSize?: string;
  padding?: string;
}

export const MatchCard: React.FC<MatchCardProps> = ({ 
  teamOne, 
  teamTwo, 
  isHighlighted = false,
  highlightedUserId,
  onUserClick,
  compact = false,
  fontSize = 'text-sm',
  padding = 'p-3'
}) => {
  return (
    <div 
      className={`relative rounded-lg overflow-hidden transition-all duration-300 ${
        isHighlighted 
          ? 'shadow-[0_4px_20px_rgba(0,0,0,0.2)] scale-[1.05] z-10' 
          : 'border border-gray-200'
      }`}
    >
      {/* Команда 1 */}
      <div 
        className={`${padding} cursor-pointer ${
          teamOne.isWinner
            ? 'border-l-4 border-green-500 bg-green-50' 
            : isHighlighted && teamOne.id === highlightedUserId
              ? 'border-l-4 border-gray-500 bg-gray-100'
              : 'border-l-4 border-transparent'
        }`}
        onClick={() => onUserClick(teamOne.id)}
      >
        <div className="flex justify-between items-center">
          <div className={`font-medium text-gray-900 ${fontSize} ${compact ? 'truncate' : ''}`} title={teamOne.name}>
            {compact && teamOne.name.length > 10 ? `${teamOne.name.substring(0, 10)}...` : teamOne.name}
          </div>
          <div className={`font-semibold text-gray-700 ml-2 ${fontSize}`}>
            {teamOne.score !== null ? teamOne.score : '-'}
          </div>
        </div>
      </div>
      
      {/* Команда 2 */}
      <div 
        className={`${padding} border-t border-gray-200 cursor-pointer ${
          teamTwo.isWinner
            ? 'border-l-4 border-green-500 bg-green-50' 
            : isHighlighted && teamTwo.id === highlightedUserId
              ? 'border-l-4 border-gray-500 bg-gray-100'
              : 'border-l-4 border-transparent'
        }`}
        onClick={() => onUserClick(teamTwo.id)}
      >
        <div className="flex justify-between items-center">
          <div className={`font-medium text-gray-900 ${fontSize} ${compact ? 'truncate' : ''}`} title={teamTwo.name}>
            {compact && teamTwo.name.length > 10 ? `${teamTwo.name.substring(0, 10)}...` : teamTwo.name}
          </div>
          <div className={`font-semibold text-gray-700 ml-2 ${fontSize}`}>
            {teamTwo.score !== null ? teamTwo.score : '-'}
          </div>
        </div>
      </div>
      
      {/* Подсветка для выбранного пользователя */}
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
};

export default MatchCard; 