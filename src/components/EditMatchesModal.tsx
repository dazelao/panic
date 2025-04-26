import { Dialog } from '@mui/material';
import { LeagueMatch, updateMatchResult } from '@/api/leagues';
import { useState } from 'react';

interface EditMatchesModalProps {
  open: boolean;
  onClose: () => void;
  matches: LeagueMatch[];
  token: string;
  onSuccess: () => void;
}

export default function EditMatchesModal({ open, onClose, matches, token, onSuccess }: EditMatchesModalProps) {
  const [editingMatch, setEditingMatch] = useState<number | null>(null);
  const [goals1, setGoals1] = useState<string>('');
  const [goals2, setGoals2] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleUpdateResult = async (match: LeagueMatch) => {
    if (!token) return;
    if (goals1.trim() === '' || goals2.trim() === '') {
      setError('Введіть результат матчу');
      return;
    }

    const goalsUser1 = parseInt(goals1);
    const goalsUser2 = parseInt(goals2);

    if (isNaN(goalsUser1) || isNaN(goalsUser2) || goalsUser1 < 0 || goalsUser2 < 0) {
      setError('Некоректний результат');
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
      setError('');
      onSuccess();
    } catch (error) {
      setError('Помилка оновлення результату');
    }
  };

  const startEditing = (match: LeagueMatch) => {
    setEditingMatch(match.id);
    setGoals1(match.goalsUser1?.toString() || '0');
    setGoals2(match.goalsUser2?.toString() || '0');
    setError('');
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-black">Редагування матчів</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto max-h-[70vh]">
          <table className="w-full">
            <thead>
              <tr className="text-left text-black">
                <th className="py-2 px-4">Раунд</th>
                <th className="py-2 px-4">Гравець 1</th>
                <th className="py-2 px-4">Рахунок</th>
                <th className="py-2 px-4">Гравець 2</th>
                <th className="py-2 px-4">Дії</th>
              </tr>
            </thead>
            <tbody>
              {matches.map((match) => (
                <tr key={match.id} className="border-t">
                  <td className="py-2 px-4 text-black">{match.roundNumber}</td>
                  <td className="py-2 px-4 text-black">{match.username1}</td>
                  <td className="py-2 px-4">
                    {editingMatch === match.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          value={goals1}
                          onChange={(e) => setGoals1(e.target.value)}
                          className="w-12 text-center border rounded py-1"
                        />
                        <span className="text-black">:</span>
                        <input
                          type="number"
                          min="0"
                          value={goals2}
                          onChange={(e) => setGoals2(e.target.value)}
                          className="w-12 text-center border rounded py-1"
                        />
                      </div>
                    ) : (
                      <span className="text-black">
                        {match.goalsUser1 === null ? '-' : match.goalsUser1}:{match.goalsUser2 === null ? '-' : match.goalsUser2}
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-4 text-black">{match.username2}</td>
                  <td className="py-2 px-4">
                    {editingMatch === match.id ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateResult(match)}
                          className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                        >
                          Зберегти
                        </button>
                        <button
                          onClick={() => {
                            setEditingMatch(null);
                            setError('');
                          }}
                          className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                        >
                          Скасувати
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEditing(match)}
                        className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                      >
                        Редагувати
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {error && (
          <div className="mt-4 text-red-500 text-sm text-center">
            {error}
          </div>
        )}
      </div>
    </Dialog>
  );
} 