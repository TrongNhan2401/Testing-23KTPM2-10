import axios, { type AxiosInstance, type InternalAxiosRequestConfig, isAxiosError, type AxiosError } from 'axios';
import type {
  LoginRequest,
  LoginResponse,
  LobbyGroup,
  PublicGroup,
  SelectGroupResult,
  StartGameResult,
  GameQuestionsResult,
  RawAnswer,
  SubmitAnswersResult,
  SubmitResult,
  GameStatusResult,
  LeaderboardResult,
  SubmitFeedbackRequest,
  FeedbackResponse,
  ListFeedbackResponse,
  CreatePiiQuestionRequest,
  CreateInvariantQuestionRequest,
  PiiQuestionDoc,
  InvariantQuestionDoc,
} from '../types';

// API Base URL - can be configured via environment variable
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('authToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear storage
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
    }
    return Promise.reject(error);
  }
);

// Helper to extract error message
const getErrorMessage = (error: unknown): string => {
  if (isAxiosError(error)) {
    const data = error.response?.data as { error?: string; message?: string };
    return data?.error || data?.message || error.message || 'An error occurred';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

// ==========================================
// Auth API
// ==========================================

export const authApi = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    try {
      const response = await api.post<LoginResponse>('/auth/login', credentials);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
  },

  getStoredAuth: (): { token: string; user: { username: string; role: string } } | null => {
    const token = localStorage.getItem('authToken');
    const userStr = localStorage.getItem('authUser');
    if (token && userStr) {
      try {
        return { token, user: JSON.parse(userStr) };
      } catch {
        return null;
      }
    }
    return null;
  },

  setStoredAuth: (token: string, user: { username: string; role: string }) => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('authUser', JSON.stringify(user));
  },
};

// ==========================================
// Groups API
// ==========================================

export const groupsApi = {
  getLobby: async (): Promise<LobbyGroup[]> => {
    try {
      const response = await api.get<LobbyGroup[]>('/groups');
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  getGroup: async (groupId: string): Promise<PublicGroup> => {
    try {
      const response = await api.get<PublicGroup>(`/groups/${groupId}`);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  selectGroup: async (groupId: string): Promise<SelectGroupResult> => {
    try {
      const response = await api.post<SelectGroupResult>('/groups/select', { groupId });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  releaseGroup: async (groupId: string, selectionToken: string): Promise<PublicGroup> => {
    try {
      const response = await api.post<PublicGroup>('/groups/release', {
        groupId,
        selectionToken,
      });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },
};

// ==========================================
// Game API
// ==========================================

export const gameApi = {
  startGame: async (groupId: string, selectionToken: string): Promise<StartGameResult> => {
    try {
      const response = await api.post<StartGameResult>('/game/start', {
        groupId,
        selectionToken,
      });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  getQuestions: async (
    groupId: string,
    selectionToken: string
  ): Promise<GameQuestionsResult> => {
    try {
      const response = await api.get<GameQuestionsResult>(
        `/game/${groupId}/questions`,
        { params: { selectionToken } }
      );
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  submitAnswers: async (
    groupId: string,
    selectionToken: string,
    answers: RawAnswer[]
  ): Promise<SubmitAnswersResult> => {
    try {
      const response = await api.post<SubmitAnswersResult>(
        `/game/${groupId}/answer`,
        { answers },
        { params: { selectionToken } }
      );
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  submitGame: async (
    groupId: string,
    selectionToken: string,
    clientSubmittedAt?: string
  ): Promise<SubmitResult> => {
    try {
      const response = await api.post<SubmitResult>(
        `/game/${groupId}/submit`,
        { clientSubmittedAt },
        { params: { selectionToken } }
      );
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  getStatus: async (groupId: string): Promise<GameStatusResult> => {
    try {
      const response = await api.get<GameStatusResult>(`/game/${groupId}/status`);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },
};

// ==========================================
// Leaderboard API
// ==========================================

export const leaderboardApi = {
  getLeaderboard: async (): Promise<LeaderboardResult> => {
    try {
      const response = await api.get<LeaderboardResult>('/leaderboard');
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },
};

// ==========================================
// Feedback API
// ==========================================

export const feedbackApi = {
  submit: async (data: SubmitFeedbackRequest): Promise<FeedbackResponse> => {
    try {
      const response = await api.post<FeedbackResponse>('/feedback', data);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  list: async (
    params?: { sessionId?: string; groupId?: string; page?: number; limit?: number }
  ): Promise<ListFeedbackResponse> => {
    try {
      const response = await api.get<ListFeedbackResponse>('/feedback', { params });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },
};

// ==========================================
// Admin Questions API
// ==========================================

export const questionsApi = {
  // PII Questions
  getPiiQuestions: async (): Promise<PiiQuestionDoc[]> => {
    try {
      const response = await api.get<PiiQuestionDoc[]>('/admin/questions/pii');
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  createPiiQuestion: async (data: CreatePiiQuestionRequest): Promise<PiiQuestionDoc> => {
    try {
      const response = await api.post<PiiQuestionDoc>('/admin/questions/pii', data);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  updatePiiQuestion: async (
    id: string,
    data: Partial<CreatePiiQuestionRequest>
  ): Promise<PiiQuestionDoc> => {
    try {
      const response = await api.put<PiiQuestionDoc>(`/admin/questions/pii/${id}`, data);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  deletePiiQuestion: async (id: string): Promise<void> => {
    try {
      await api.delete(`/admin/questions/pii/${id}`);
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  // Invariant Questions
  getInvariantQuestions: async (): Promise<InvariantQuestionDoc[]> => {
    try {
      const response = await api.get<InvariantQuestionDoc[]>('/admin/questions/invariant');
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  createInvariantQuestion: async (
    data: CreateInvariantQuestionRequest
  ): Promise<InvariantQuestionDoc> => {
    try {
      const response = await api.post<InvariantQuestionDoc>('/admin/questions/invariant', data);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  updateInvariantQuestion: async (
    id: string,
    data: Partial<CreateInvariantQuestionRequest>
  ): Promise<InvariantQuestionDoc> => {
    try {
      const response = await api.put<InvariantQuestionDoc>(
        `/admin/questions/invariant/${id}`,
        data
      );
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  deleteInvariantQuestion: async (id: string): Promise<void> => {
    try {
      await api.delete(`/admin/questions/invariant/${id}`);
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },
};

// Export api instance for direct use if needed
export { api };
export { getErrorMessage };
