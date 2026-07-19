import { apiClient } from './client';

export interface HackathonProject {
  id: string;
  name: string;
  description?: string | null;
  hackathonName?: string | null;
  tags: string[];
  juryRating?: number | null;
  repoUrl?: string | null;
  demoUrl?: string | null;
  imageUrl?: string | null;
}

export interface GitHubStats {
  topLanguages: Record<string, number>;
  totalRepos: number;
  totalStars: number;
  totalCommits: number;
  totalForks: number;
  lastSyncedAt: string;
}

export interface StudentSearchResult {
  id: string;
  name: string;
  email: string;
  bio?: string | null;
  skills: string[];
  avatarUrl?: string | null;
  githubUsername?: string | null;
  topLanguages: Record<string, number>;
  projectCount: number;
  matchScore: number;
  leaderboardScore: number;
}

export interface StudentDetail {
  id: string;
  name: string;
  email: string;
  bio?: string | null;
  skills: string[];
  avatarUrl?: string | null;
  linkedinUrl?: string | null;
  portfolioUrl?: string | null;
  githubUsername?: string | null;
  githubStats?: GitHubStats | null;
  projects: HackathonProject[];
  score: number;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  bio?: string | null;
  skills: string[];
  avatarUrl?: string | null;
  githubUsername?: string | null;
  totalStars: number;
  totalRepos: number;
  topLanguages: Record<string, number>;
  projectCount: number;
  avgJuryRating: string | null;
  score: number;
  rank: number;
}

export const studentsApi = {
  search: (keywords: string) =>
    apiClient.get<{ results: StudentSearchResult[]; total: number; keywords: string[] }>(
      '/students/search',
      { params: { q: keywords } }
    ),
  leaderboard: (limit = 50) =>
    apiClient.get<{ leaderboard: LeaderboardEntry[]; total: number }>('/students/leaderboard', {
      params: { limit },
    }),
  getById: (id: string) => apiClient.get<StudentDetail>(`/students/${id}`),
  syncGithub: (studentId: string) =>
    apiClient.post<{ message: string; topLanguages: Record<string, number> }>(
      `/students/sync-github/${studentId}`
    ),
};
