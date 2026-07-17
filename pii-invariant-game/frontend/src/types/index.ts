// ==========================================
// API Types - Types matching backend API
// ==========================================

// Auth Types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  expiresAt: string;
  user: {
    username: string;
    role: string;
  };
}

export interface JwtPayload {
  sub: string;
  username: string;
  role: string;
  iat?: number;
  exp?: number;
}

// Group Types
export type GroupStatus = 'WAITING' | 'READY' | 'PLAYING' | 'FINISHED';

export interface LobbyGroup {
  groupId: string;
  name: string;
  status: GroupStatus;
}

export interface PublicGroup extends LobbyGroup {
  selectionToken: string | null;
  selectionExpiresAt: string | null;
  updatedAt: string;
}

export interface SelectGroupRequest {
  groupId: string;
}

export interface SelectGroupResult {
  groupId: string;
  status: GroupStatus;
  selectionToken: string;
  selectionExpiresAt: string;
}

export interface StartGameResult {
  groupId: string;
  status: GroupStatus;
  sessionId: string;
  startedAt: string;
  expiresAt: string;
  durationSeconds: number;
}

// Game Types
export interface PiiQuestion {
  board: 'PII';
  externalId: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  shipping: string | null;
}

export interface InvariantQuestion {
  board: 'INVARIANT';
  externalId: string;
  items: string;
  tax: string;
  shipping: string;
  totalPrice: string;
}

export type Question = PiiQuestion | InvariantQuestion;

export interface GameQuestionsResult {
  groupId: string;
  sessionId: string;
  startedAt: string;
  expiresAt: string;
  questions: Question[];
}

export interface RawAnswer {
  board: 'PII' | 'INVARIANT';
  targetId: string;
  field: string;
}

export interface SubmittedAnswer {
  board: 'PII' | 'INVARIANT';
  targetId: string;
  field: string;
  isCorrect: boolean | null;
  points: number | null;
  createdAt: string;
}

export interface SubmitAnswersResult {
  sessionId: string;
  expiresAt: string;
  answers: SubmittedAnswer[];
}

export interface Score {
  totalPoints: number;
  correctCount: number;
  wrongCount: number;
}

export interface SubmitResult {
  groupId: string;
  sessionId: string;
  status: 'SUBMITTED' | 'EXPIRED';
  submittedAt: string;
  score: Score;
}

export interface GameStatusResult {
  groupId: string;
  sessionId: string;
  status: GroupStatus;
  startedAt: string;
  expiresAt: string;
  submittedAt: string | null;
  score: Score | null;
}

// Leaderboard Types
export interface LeaderboardEntry {
  rank: number;
  groupId: string;
  latestSessionId: string;
  latestScore: number;
  lastSubmittedAt: string;
}

export interface LeaderboardResult {
  entries: LeaderboardEntry[];
}

// Feedback Types
export interface SubmitFeedbackRequest {
  groupId?: string;
  sessionId?: string;
  rating: number;
  learned?: string;
  unclear?: string;
}

export interface FeedbackEntry {
  id: string;
  groupId: string | null;
  sessionId: string | null;
  rating: number;
  comment?: string | null;
  createdAt: string;
}

export interface ListFeedbackResponse {
  entries: FeedbackEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface FeedbackResponse {
  id: string;
  groupId: string | null;
  sessionId: string | null;
  rating: number;
  comment: string | null;
  createdAt: string;
}

// Question Management Types (Admin)
export interface PiiQuestionDoc {
  _id?: string;
  externalId: string;
  fullName?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
  shipping?: string | null;
  correctNotes: boolean;
  correctShipping: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvariantQuestionDoc {
  _id?: string;
  externalId: string;
  items: number;
  tax: number;
  shipping: number;
  totalPrice: number;
  isViolation: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePiiQuestionRequest {
  externalId: string;
  fullName?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  shipping?: string;
  correctNotes: boolean;
  correctShipping: boolean;
  isActive: boolean;
}

export interface CreateInvariantQuestionRequest {
  externalId: string;
  items: number;
  tax: number;
  shipping: number;
  totalPrice: number;
  isViolation: boolean;
  isActive: boolean;
}

// Error Types
export interface ApiError {
  error: string;
  message?: string;
  success?: boolean;
}

// UI State Types
export type GameScreen = 'login' | 'start' | 'game' | 'leaderboard' | 'feedback' | 'thankyou';
export type AdminScreen = 'login' | 'dashboard' | 'leaderboard' | 'feedback' | 'questions';

// Cell State for game
export type CellState = 'pending' | 'correct' | 'wrong';

export interface GameCell {
  board: 'PII' | 'INVARIANT';
  externalId: string;
  field: string;
  value: string;
  state: CellState;
  points: number;
}

// Group with icon for login
export interface GroupWithIcon {
  groupId: string;
  name: string;
  status: GroupStatus;
  icon: string;
}
