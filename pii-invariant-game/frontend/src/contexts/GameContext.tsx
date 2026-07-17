import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import {
  groupsApi,
  gameApi,
  leaderboardApi,
} from '../services/api';
import type {
  LobbyGroup,
  RawAnswer,
  SubmitResult,
  LeaderboardResult,
  StartGameResult,
  CellState,
  Question,
} from '../types';

interface GameState {
  groupId: string | null;
  sessionId: string | null;
  selectionToken: string | null;
  status: 'idle' | 'ready' | 'playing' | 'submitted' | 'expired';
  startedAt: string | null;
  expiresAt: string | null;
  durationSeconds: number;
  questions: Question[];
  answers: Map<string, { state: CellState; points: number }>;
  score: {
    totalPoints: number;
    correctCount: number;
    wrongCount: number;
  } | null;
  submittedAt: string | null;
}

interface GameContextType {
  state: GameState;
  lobby: LobbyGroup[];
  leaderboard: LeaderboardResult | null;
  error: string | null;
  isLoading: boolean;

  // Lobby actions
  fetchLobby: () => Promise<void>;
  selectGroup: (groupId: string) => Promise<void>;
  releaseGroup: () => Promise<void>;

  // Game actions
  startGame: () => Promise<StartGameResult>;
  submitAnswers: (answers: RawAnswer[]) => Promise<void>;
  submitGame: () => Promise<SubmitResult>;
  fetchStatus: () => Promise<void>;
  refreshLeaderboard: () => Promise<void>;

  // Local state management
  markCell: (board: 'PII' | 'INVARIANT', externalId: string, field: string, isCorrect: boolean) => void;
  resetGame: () => void;
}

const initialState: GameState = {
  groupId: null,
  sessionId: null,
  selectionToken: null,
  status: 'idle',
  startedAt: null,
  expiresAt: null,
  durationSeconds: 600,
  questions: [],
  answers: new Map(),
  score: null,
  submittedAt: null,
};

const GameContext = createContext<GameContextType | undefined>(undefined);

interface GameProviderProps {
  children: ReactNode;
}

export function GameProvider({ children }: GameProviderProps) {
  const [state, setState] = useState<GameState>(initialState);
  const [lobby, setLobby] = useState<LobbyGroup[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Refresh leaderboard
  const refreshLeaderboard = useCallback(async () => {
    try {
      const result = await leaderboardApi.getLeaderboard();
      setLeaderboard(result);
    } catch (err) {
      console.error('Failed to refresh leaderboard:', err);
    }
  }, []);

  // Fetch lobby on mount
  const fetchLobby = useCallback(async () => {
    try {
      setIsLoading(true);
      const groups = await groupsApi.getLobby();
      setLobby(groups);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch lobby');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Select a group (lock it)
  const selectGroup = useCallback(async (groupId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await groupsApi.selectGroup(groupId);

      // Store selection token in localStorage for persistence
      localStorage.setItem('gameGroupId', groupId);
      localStorage.setItem('gameSelectionToken', result.selectionToken);

      setState((prev) => ({
        ...prev,
        groupId,
        selectionToken: result.selectionToken,
        status: 'ready',
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to select group');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Release group lock
  const releaseGroup = useCallback(async () => {
    if (!state.groupId || !state.selectionToken) return;

    try {
      setIsLoading(true);
      await groupsApi.releaseGroup(state.groupId, state.selectionToken);

      // Clear localStorage
      localStorage.removeItem('gameGroupId');
      localStorage.removeItem('gameSelectionToken');

      setState(initialState);
      await fetchLobby();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to release group');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [state.groupId, state.selectionToken, fetchLobby]);

  // Start the game
  const startGame = useCallback(async (): Promise<StartGameResult> => {
    if (!state.groupId || !state.selectionToken) {
      throw new Error('No group selected');
    }

    try {
      setIsLoading(true);
      setError(null);
      const result = await gameApi.startGame(state.groupId, state.selectionToken);

      // Fetch questions
      const questionsResult = await gameApi.getQuestions(state.groupId, state.selectionToken);

      setState((prev) => ({
        ...prev,
        sessionId: result.sessionId,
        status: 'playing',
        startedAt: result.startedAt,
        expiresAt: result.expiresAt,
        durationSeconds: result.durationSeconds,
        questions: questionsResult.questions,
      }));

      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start game');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [state.groupId, state.selectionToken]);

  // Submit answers (partial)
  const submitAnswers = useCallback(
    async (answers: RawAnswer[]) => {
      if (!state.groupId || !state.selectionToken) {
        throw new Error('No game session');
      }

      try {
        setIsLoading(true);
        await gameApi.submitAnswers(state.groupId, state.selectionToken, answers);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to submit answers');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [state.groupId, state.selectionToken]
  );

  // Submit game (final)
  const submitGame = useCallback(async (): Promise<SubmitResult> => {
    if (!state.groupId || !state.selectionToken) {
      throw new Error('No game session');
    }

    try {
      setIsLoading(true);
      setError(null);
      const result = await gameApi.submitGame(
        state.groupId,
        state.selectionToken,
        new Date().toISOString()
      );

      setState((prev) => ({
        ...prev,
        status: result.status === 'EXPIRED' ? 'expired' : 'submitted',
        score: result.score,
        submittedAt: result.submittedAt,
      }));

      // Refresh leaderboard
      await refreshLeaderboard();

      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit game');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [state.groupId, state.selectionToken, refreshLeaderboard]);

  // Fetch game status
  const fetchStatus = useCallback(async () => {
    if (!state.groupId) return;

    try {
      const status = await gameApi.getStatus(state.groupId);

      setState((prev) => ({
        ...prev,
        status:
          status.status === 'FINISHED'
            ? 'submitted'
            : prev.status,
        score: status.score,
        submittedAt: status.submittedAt,
      }));
    } catch (err) {
      // Silently fail for status polling
      console.error('Failed to fetch status:', err);
    }
  }, [state.groupId]);

  // Mark a cell (for local scoring before submit)
  const markCell = useCallback(
    (board: 'PII' | 'INVARIANT', externalId: string, field: string, isCorrect: boolean) => {
      const key = `${board}:${externalId}:${field}`;
      const points = isCorrect ? 2 : -1;

      setState((prev) => {
        const newAnswers = new Map(prev.answers);
        newAnswers.set(key, { state: isCorrect ? 'correct' : 'wrong', points });

        // Calculate running score
        let totalPoints = 0;
        let correctCount = 0;
        let wrongCount = 0;
        newAnswers.forEach((answer) => {
          totalPoints += answer.points;
          if (answer.points > 0) correctCount++;
          else wrongCount++;
        });

        return {
          ...prev,
          answers: newAnswers,
          score: { totalPoints, correctCount, wrongCount },
        };
      });
    },
    []
  );

  // Reset game state
  const resetGame = useCallback(() => {
    localStorage.removeItem('gameGroupId');
    localStorage.removeItem('gameSelectionToken');
    setState(initialState);
  }, []);

  // Restore session on mount
  useEffect(() => {
    const savedGroupId = localStorage.getItem('gameGroupId');
    const savedToken = localStorage.getItem('gameSelectionToken');

    if (savedGroupId && savedToken) {
      setState((prev) => ({
        ...prev,
        groupId: savedGroupId,
        selectionToken: savedToken,
        status: 'ready',
      }));
    }

    fetchLobby();
  }, [fetchLobby]);

  const value: GameContextType = {
    state,
    lobby,
    leaderboard,
    error,
    isLoading,
    fetchLobby,
    selectGroup,
    releaseGroup,
    startGame,
    submitAnswers,
    submitGame,
    fetchStatus,
    refreshLeaderboard,
    markCell,
    resetGame,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextType {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
