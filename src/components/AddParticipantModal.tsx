import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Autocomplete, CircularProgress, List, ListItem, ListItemText, Typography } from '@mui/material';
import { useState, useEffect } from 'react';
import { getUsers, User, addParticipant, unregisterSelf } from '@/api/leagues';
import { ApiService } from '@/config/apiService';

interface Participant {
  id: number;
  userId: number;
  username: string;
}

interface AddParticipantModalProps {
  open: boolean;
  onClose: () => void;
  leagueId: string;
  token: string;
  onSuccess: () => void;
}

export default function AddParticipantModal({ open, onClose, leagueId, token, onSuccess }: AddParticipantModalProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);

  const fetchUsers = async () => {
    try {
      const data = await getUsers(token);
      console.log('Fetched users:', data);
      setUsers(data);
    } catch (e) {
      console.error('Error fetching users:', e);
      setError('Помилка завантаження користувачів');
    }
  };

  const fetchParticipants = () => {
    ApiService.leagues.getParticipants(token, Number(leagueId))
      .then(data => {
        console.log('Fetched participants:', data);
        setParticipants(data);
      })
      .catch(error => {
        console.error('Error fetching participants:', error);
        setParticipants([]);
      });
  };

  useEffect(() => {
    if (open) {
      console.log('Modal opened with props:', { leagueId, token });
      fetchUsers();
      fetchParticipants();
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!selectedUser) return;
    setLoading(true);
    setError('');
    try {
      await addParticipant(token, Number(leagueId), selectedUser.id);
      setSelectedUser(null);
      fetchParticipants();
      onSuccess();
    } catch (e) {
      setError('Помилка додавання учасника');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (participant: Participant) => {
    console.log('Deleting participant:', participant);
    setDeleteLoading(participant.id);
    try {
      await unregisterSelf(token, Number(leagueId), participant.id);
      console.log('Successfully deleted participant');
      fetchParticipants();
    } catch (error) {
      console.error('Error deleting participant:', error);
      setError('Помилка видалення учасника');
    } finally {
      setDeleteLoading(null);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Управління учасниками</DialogTitle>
      <DialogContent>
        <div className="mb-4">
          <Autocomplete
            options={users}
            getOptionLabel={(option) => option.username}
            value={selectedUser}
            onChange={(_, newValue) => setSelectedUser(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Оберіть користувача"
                variant="outlined"
                fullWidth
                margin="normal"
              />
            )}
          />
        </div>
        
        <div className="mt-4">
          <h3 className="text-lg font-medium mb-2">Поточні учасники:</h3>
          <div className="space-y-2">
            {participants.map((participant) => (
              <div key={participant.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span>{participant.username}</span>
                <button
                  onClick={() => handleDelete(participant)}
                  disabled={deleteLoading === participant.id}
                  className={`p-1 rounded hover:bg-red-100 text-red-600 ${
                    deleteLoading === participant.id ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {deleteLoading === participant.id ? (
                    <span className="text-sm">✕</span>
                  ) : (
                    <span className="text-xl">✕</span>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        {error && <div className="text-red-500 mt-2">{error}</div>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Закрити
        </Button>
        <Button
          onClick={() => handleSubmit()}
          color="primary"
          variant="contained"
          disabled={!selectedUser || loading}
        >
          {loading ? 'Додавання...' : 'Додати'}
        </Button>
      </DialogActions>
    </Dialog>
  );
} 