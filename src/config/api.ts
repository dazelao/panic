// API конфигурация
export const API_BASE_URL = 'http://31.202.133.123:8080/api';
export const AUTH_API_URL = `${API_BASE_URL}/auth`;

// Хелперы для построения URL
export const getTournamentUrl = (path: string) => `${API_BASE_URL}/tournament${path}`;
export const getSwissUrl = (path: string) => `${API_BASE_URL}/swiss${path}`;
export const getMatchesUrl = (path: string) => `${API_BASE_URL}/matches${path}`;
export const getUsersUrl = (path: string = '') => `${API_BASE_URL}/users${path}`;
export const getLeaguesUrl = (path: string) => `${API_BASE_URL}/leagues${path}`;
export const getPattonUrl = (path: string) => `${API_BASE_URL}/patton${path}`; 