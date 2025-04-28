import { API_BASE_URL } from './api';

// Базовая функция для выполнения fetch-запросов
export const apiRequest = async (
  endpoint: string,
  method: string = 'GET',
  token?: string,
  body?: any
) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const options: RequestInit = {
    method,
    headers,
  };
  
  if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    options.body = JSON.stringify(body);
  }
  
  const response = await fetch(url, options);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API request failed: ${response.status} ${errorText}`);
  }
  
  // Проверяем, есть ли тело ответа
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  
  return null;
};

// Готовые методы для различных API эндпоинтов
export const ApiService = {
  // Турниры
  tournaments: {
    getAll: (token: string) => 
      apiRequest('/tournament', 'GET', token),
    get: (token: string, id: number) => 
      apiRequest(`/tournament/${id}`, 'GET', token),
    create: (token: string, data: any) => 
      apiRequest('/tournament', 'POST', token, data),
    start: (token: string, id: number) => 
      apiRequest(`/tournament/start/${id}`, 'POST', token),
    nextRound: (token: string, id: number) => 
      apiRequest(`/tournament/next-round/${id}`, 'POST', token),
    finish: (token: string, id: number) => 
      apiRequest(`/tournament/finish/${id}`, 'POST', token),
    getParticipants: (token: string, id: number) => 
      apiRequest(`/tournament/${id}/participants`, 'GET', token),
    addParticipant: (token: string, tournamentId: number, userId?: number, data?: any) => 
      userId 
        ? apiRequest(`/tournament/${tournamentId}/participant`, 'POST', token, { userId }) 
        : apiRequest(`/tournament/${tournamentId}/participant`, 'POST', token, data),
    removeParticipant: (token: string, tournamentId: number, userId: number) => 
      apiRequest(`/tournament/${tournamentId}/participant/${userId}`, 'DELETE', token),
  },
  
  // Матчи
  matches: {
    getTournamentMatches: (token: string, tournamentId: number) => 
      apiRequest(`/matches/tournament/${tournamentId}`, 'GET', token),
    updateResult: (token: string, data: any) => 
      apiRequest('/matches/result', 'PUT', token, data),
  },
  
  // Пользователи
  users: {
    getAll: (token: string) => 
      apiRequest('/users', 'GET', token),
    getByAttribute: (token: string, key?: string, value?: string) => {
      let endpoint = '/users';
      if (key && value) {
        endpoint = `/users/by-attribute?key=${key}&value=${value}`;
      }
      return apiRequest(endpoint, 'GET', token);
    },
    getAttributes: (token: string, userId: number) => 
      apiRequest(`/users/${userId}/attributes`, 'GET', token),
    updateAttribute: (token: string, userId: number, key: string, value: string) => 
      apiRequest(`/users/${userId}/attributes`, 'PUT', token, { key, value }),
    deleteAttribute: (token: string, userId: number, key: string) => 
      apiRequest(`/users/${userId}/attributes/${key}`, 'DELETE', token),
  },
  
  // Швейцарская система
  swiss: {
    getTournaments: (token: string) => 
      apiRequest('/swiss/tournaments', 'GET', token),
    getTournament: (token: string, id: number) => 
      apiRequest(`/swiss/tournaments/${id}`, 'GET', token),
    getParticipants: (token: string, id: number) => 
      apiRequest(`/swiss/tournaments/${id}/participants`, 'GET', token),
    getCurrentMatches: (token: string, id: number) => 
      apiRequest(`/swiss/tournaments/${id}/matches/current`, 'GET', token),
    getResults: (token: string, id: number) => 
      apiRequest(`/swiss/tournaments/${id}/results`, 'GET', token),
    openTournament: (token: string, id: number) => 
      apiRequest(`/swiss/tournaments/${id}/open`, 'POST', token),
    closeTournament: (token: string, id: number) => 
      apiRequest(`/swiss/tournaments/${id}/close`, 'POST', token),
    startTournament: (token: string, id: number) => 
      apiRequest(`/swiss/tournaments/${id}/start`, 'POST', token),
    cancelTournament: (token: string, id: number) => 
      apiRequest(`/swiss/tournaments/${id}/cancel`, 'POST', token),
    nextRound: (token: string, id: number) => 
      apiRequest(`/swiss/tournaments/${id}/next-round`, 'POST', token),
    register: (token: string, tournamentId: number, userId?: number) => 
      userId
        ? apiRequest(`/swiss/tournaments/${tournamentId}/register/${userId}`, 'POST', token)
        : apiRequest(`/swiss/tournaments/${tournamentId}/register`, 'POST', token),
    unregister: (token: string, tournamentId: number, userId?: number) => 
      userId
        ? apiRequest(`/swiss/tournaments/${tournamentId}/unregister/${userId}`, 'POST', token)
        : apiRequest(`/swiss/tournaments/${tournamentId}/unregister`, 'POST', token),
    updateMatchResult: (token: string, matchId: number, data: any) => 
      apiRequest(`/swiss/matches/${matchId}/update`, 'POST', token, data),
  },
  
  // Лиги
  leagues: {
    getAll: (token: string, status?: string) => {
      let endpoint = '/leagues';
      if (status) {
        endpoint = `/leagues?status=${status}`;
      }
      return apiRequest(endpoint, 'GET', token);
    },
    get: (token: string, id: number) => 
      apiRequest(`/leagues/${id}`, 'GET', token),
    create: (token: string, data: any) => 
      apiRequest('/leagues', 'POST', token, data),
    changeStatus: (token: string, id: number, status: string) => 
      apiRequest(`/leagues/${id}/status`, 'PUT', token, { status }),
    changeStatusRest: (token: string, id: number, endpoint: string) => 
      apiRequest(`/leagues/${id}/${endpoint}`, 'POST', token),
    getParticipants: (token: string, id: number) => 
      apiRequest(`/leagues/${id}/participants`, 'GET', token),
    addParticipant: (token: string, leagueId: number, userId: number) => 
      apiRequest(`/leagues/${leagueId}/participants`, 'POST', token, { userId }),
    addParticipantsBulk: (token: string, leagueId: number, userIds: number[]) => 
      apiRequest(`/leagues/${leagueId}/participants/bulk`, 'POST', token, { userIds }),
    getMatches: (token: string, leagueId: number) => 
      apiRequest(`/league-matches/league/${leagueId}`, 'GET', token),
    getStats: (token: string, leagueId: number) => 
      apiRequest(`/league-stats/${leagueId}`, 'GET', token),
    updateMatchResult: (token: string, matchId: number, data: any) => 
      apiRequest(`/league-matches/${matchId}/result`, 'POST', token, data),
    generateMatches: (token: string, leagueId: number) => 
      apiRequest(`/league-matches/generate/${leagueId}`, 'POST', token),
  },
  
  // Паттон
  patton: {
    createGroupsDto: (token: string, data: any) => 
      apiRequest('/patton/create-groups-dto', 'POST', token, data),
  }
}; 