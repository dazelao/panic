export type LeagueStatus = 'DRAFT' | 'REGISTRATION' | 'ACTIVE' | 'FINISHED' | 'CANCELED';

export interface CreateLeagueRequest {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  maxParticipants: number;
  winnerAttribute?: string;
  winnerCount?: number;
  saveAttribute?: string;
  saveCount?: number;
  loserAttribute?: string;
  loserCount?: number;
}

export interface League {
  id: number;
  name: string;
  description: string;
  status: LeagueStatus;
  createdDate: string;
  startDate: string;
  endDate: string;
  participantCount: number;
  currentParticipants: number;
  maxParticipants: number;
  winnerAttribute?: string;
  winnerCount?: number;
  saveAttribute?: string;
  saveCount?: number;
  loserAttribute?: string;
  loserCount?: number;
}

export interface LeagueParticipant {
  id: number;
  userId: number;
  username: string;
  avatarUrl: string;
} 