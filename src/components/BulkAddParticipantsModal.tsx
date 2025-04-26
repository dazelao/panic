import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Checkbox, FormControlLabel } from '@mui/material';
import { useState } from 'react';
import { getUsersByAttribute, addParticipantsBulk, User } from '@/api/leagues';

interface BulkAddParticipantsModalProps {
  open: boolean;
  onClose: () => void;
  leagueId: string;
  token: string;
  onSuccess: () => void;
}

export default function BulkAddParticipantsModal({ open, onClose, leagueId, token, onSuccess }: BulkAddParticipantsModalProps) {
  const [attributeKey, setAttributeKey] = useState('');
  const [attributeValue, setAttributeValue] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchPerformed, setSearchPerformed] = useState(false);

  const handleSearch = async () => {
    if (!attributeKey && !attributeValue) {
      setError('Введіть ключ або значення атрибуту');
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      const foundUsers = await getUsersByAttribute(token, attributeKey, attributeValue);
      setUsers(foundUsers);
      setSearchPerformed(true);
      if (foundUsers.length === 0) {
        setError('Користувачів не знайдено');
      }
    } catch (e) {
      setError('Помилка пошуку користувачів');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUser = (userId: number) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(users.map(u => u.id)));
    }
  };

  const handleSubmit = async () => {
    if (selectedUsers.size === 0) {
      setError('Оберіть користувачів для додавання');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await addParticipantsBulk(token, Number(leagueId), Array.from(selectedUsers));
      onSuccess();
      onClose();
    } catch (e) {
      setError('Помилка додавання користувачів');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Масове додавання учасників</DialogTitle>
      <DialogContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            <TextField
              label="Ключ атрибуту"
              value={attributeKey}
              onChange={(e) => setAttributeKey(e.target.value)}
              size="small"
              className="flex-1"
            />
            <TextField
              label="Значення атрибуту"
              value={attributeValue}
              onChange={(e) => setAttributeValue(e.target.value)}
              size="small"
              className="flex-1"
            />
            <Button
              onClick={handleSearch}
              variant="contained"
              disabled={loading}
              className="whitespace-nowrap"
            >
              {loading ? 'Пошук...' : 'Знайти'}
            </Button>
          </div>

          {searchPerformed && users.length > 0 && (
            <div className="mt-4">
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedUsers.size === users.length}
                    indeterminate={selectedUsers.size > 0 && selectedUsers.size < users.length}
                    onChange={handleSelectAll}
                  />
                }
                label="Обрати всіх"
              />
              <div className="max-h-60 overflow-y-auto mt-2">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center p-2 hover:bg-gray-50">
                    <Checkbox
                      checked={selectedUsers.has(user.id)}
                      onChange={() => handleToggleUser(user.id)}
                    />
                    <span className="ml-2">{user.username}</span>
                    {user.telegram && (
                      <span className="ml-2 text-gray-500 text-sm">{user.telegram}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && <div className="text-red-500 mt-2">{error}</div>}
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Скасувати
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || selectedUsers.size === 0}
        >
          {loading ? 'Додавання...' : 'Додати обраних'}
        </Button>
      </DialogActions>
    </Dialog>
  );
} 