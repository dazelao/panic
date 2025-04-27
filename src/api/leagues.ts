import { League, LeagueStatus, CreateLeagueRequest } from '@/types/league';
import { API_BASE_URL } from '@/config/api';

const API_URL = API_BASE_URL;

export const getLeagues = async (token: string, status?: LeagueStatus): Promise<League[]> => {
  const url = new URL(`${API_URL}/leagues`);
  if (status) {
    url.searchParams.append('status', status);
  }

  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch leagues');
  }

  return response.json();
};

export const getLeague = async (token: string, id: number): Promise<League> => {
  const response = await fetch(`${API_URL}/leagues/${id}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch league');
  }

  return response.json();
};

export const createLeague = async (token: string, data: CreateLeagueRequest): Promise<League> => {
  const response = await fetch(`${API_URL}/leagues`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to create league');
  }

  return response.json();
};

export const changeLeagueStatus = async (token: string, id: number, status: string): Promise<League> => {
  const response = await fetch(`${API_URL}/leagues/${id}/status`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) {
    throw new Error('Failed to change league status');
  }
  return response.json();
};

export const changeLeagueStatusRest = async (token: string, id: number, status: 'REGISTRATION' | 'ACTIVE' | 'FINISHED' | 'CANCELED'): Promise<League> => {
  let endpoint = '';
  if (status === 'REGISTRATION') endpoint = 'registration';
  else if (status === 'ACTIVE') endpoint = 'start';
  else if (status === 'FINISHED') endpoint = 'finish';
  else if (status === 'CANCELED') endpoint = 'cancel';
  else throw new Error('Unknown status');

  const response = await fetch(`${API_URL}/leagues/${id}/${endpoint}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) {
    throw new Error('Failed to change league status');
  }
  return response.json();
};

export interface User {
  id: number;
  username: string;
  telegram?: string;
  eaId?: string;
  role: string;
  attributes?: Record<string, string>;
}

export const getUsers = async (token: string): Promise<User[]> => {
  const response = await fetch(`${API_URL}/users`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch users');
  }

  return response.json();
};

export const addLeagueParticipant = async (token: string, leagueId: number, userId: number): Promise<void> => {
  const response = await fetch(`${API_URL}/leagues/${leagueId}/participants/${userId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to add participant');
  }
};

export async function addParticipant(token: string, leagueId: number, userId: number): Promise<League> {
  const response = await fetch(`${API_URL}/leagues/${leagueId}/participants`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ userId })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to add participant');
  }

  return response.json();
}

export interface LeagueMatch {
  id: number;
  userId1: number;
  userId2: number;
  username1: string;
  username2: string;
  goalsUser1: number | null;
  goalsUser2: number | null;
  resultUser1: string;
  resultUser2: string;
  createdDate: string;
  modifiedDate: string;
  leagueId: number;
  roundNumber: number;
  winnerId: number | null;
  loserId: number | null;
  isDraw: boolean;
}

export const getLeagueMatches = async (token: string, leagueId: number): Promise<LeagueMatch[]> => {
  const response = await fetch(`${API_URL}/league-matches/league/${leagueId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!response.ok) throw new Error('Failed to fetch league matches');
  return response.json();
};

export interface LeagueStanding {
  userId: number;
  username: string;
  position: number;
  points: number;
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalsScored: number;
  goalsConceded: number;
  goalDifference: number;
}

export interface LeagueStats {
  leagueId: number;
  leagueName: string;
  standings: LeagueStanding[];
}

export const getLeagueStats = async (token: string, leagueId: number): Promise<LeagueStats> => {
  const response = await fetch(`${API_URL}/league-stats/${leagueId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!response.ok) throw new Error('Failed to fetch league stats');
  return response.json();
};

export interface UpdateMatchResultRequest {
  matchId: number;
  goalsUser1: number;
  goalsUser2: number;
}

export const updateMatchResult = async (token: string, matchId: number, data: UpdateMatchResultRequest): Promise<LeagueMatch> => {
  const response = await fetch(`${API_URL}/league-matches/${matchId}/result`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to update match result');
  }

  return response.json();
};

export const generateMatches = async (token: string, leagueId: number): Promise<void> => {
  const response = await fetch(`${API_URL}/league-matches/generate/${leagueId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to generate matches');
  }
};

export const registerSelf = async (token: string, leagueId: number, userId: number): Promise<void> => {
  const response = await fetch(`${API_URL}/leagues/${leagueId}/participants`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId })
  });

  if (!response.ok) {
    throw new Error('Failed to register');
  }
};

export const unregisterSelf = async (token: string, leagueId: number, userId: number): Promise<void> => {
  const response = await fetch(`${API_URL}/leagues/${leagueId}/participants/${userId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to unregister');
  }
};

export const getUsersByAttribute = async (token: string, key?: string, value?: string): Promise<User[]> => {
  const url = new URL(`${API_URL}/users/by-attribute`);
  if (key) url.searchParams.append('key', key);
  if (value) url.searchParams.append('value', value);

  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch users by attribute');
  }

  return response.json();
};

export const addParticipantsBulk = async (token: string, leagueId: number, userIds: number[]): Promise<void> => {
  const response = await fetch(`${API_URL}/leagues/${leagueId}/participants/bulk`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userIds }),
  });

  if (!response.ok) {
    throw new Error('Failed to add participants');
  }
}; 