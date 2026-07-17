import { useCallback, useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameTable, Icon, Button, Timer, ScoreBadge, LoadingOverlay } from '../../components';
import { useGame } from '../../contexts/GameContext';
import { useTimer } from '../../hooks/useTimer';
import type { RawAnswer, PiiQuestion, InvariantQuestion } from '../../types';

export function GamePage() {
  const navigate = useNavigate();
  const { state, startGame, submitAnswers, submitGame, markCell, isLoading, error } = useGame();
  const [localError, setLocalError] = useState<string | null>(null);
  const pendingAnswersRef = useRef<RawAnswer[]>([]);

  // Time up handler - must be defined before useTimer
  const handleTimeUp = useCallback(async () => {
    if (state.status !== 'playing') return;
    try {
      // Submit any pending answers first
      if (pendingAnswersRef.current.length > 0) {
        await submitAnswers([...pendingAnswersRef.current]);
        pendingAnswersRef.current = [];
      }
      await submitGame();
      navigate('/leaderboard');
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to submit');
    }
  }, [state.status, submitAnswers, submitGame, navigate]);

  // Timer hook
  const {
    remainingSeconds,
    isExpired,
    start: startTimer,
  } = useTimer({
    onExpire: handleTimeUp,
  });

  // Redirect if not playing
  useEffect(() => {
    if (state.status !== 'playing' && !state.sessionId) {
      navigate('/');
    }
  }, [state.status, state.sessionId, navigate]);

  // Start game and timer
  useEffect(() => {
    const initGame = async () => {
      if (state.status !== 'playing' && state.groupId && state.selectionToken) {
        try {
          await startGame();
          if (state.startedAt && state.durationSeconds) {
            startTimer(state.durationSeconds, new Date(state.startedAt));
          } else {
            startTimer(600); // Default 10 minutes
          }
        } catch (err) {
          setLocalError(err instanceof Error ? err.message : 'Failed to start game');
        }
      } else if (state.expiresAt && state.status === 'playing') {
        // Resume timer from expiresAt
        const expiresAt = new Date(state.expiresAt);
        const now = new Date();
        const remaining = Math.floor((expiresAt.getTime() - now.getTime()) / 1000);
        if (remaining > 0) {
          startTimer(remaining, now);
        } else {
          handleTimeUp();
        }
      }
    };
    initGame();
  }, [state.status, state.groupId, state.selectionToken, state.expiresAt, state.startedAt, state.durationSeconds, startGame, startTimer, handleTimeUp]);

  // Auto-sync answers every 5 seconds
  useEffect(() => {
    if (state.status !== 'playing' || pendingAnswersRef.current.length === 0) return;

    const syncInterval = setInterval(async () => {
      if (pendingAnswersRef.current.length > 0) {
        try {
          await submitAnswers([...pendingAnswersRef.current]);
          pendingAnswersRef.current = [];
        } catch {
          // Will retry on next interval
        }
      }
    }, 5000);

    return () => clearInterval(syncInterval);
  }, [state.status, submitAnswers]);

  const handleCellClick = useCallback(
    (board: 'PII' | 'INVARIANT', externalId: string, field: string, _value: string) => {
      // Determine if correct based on question data
      const question = state.questions.find(
        (q) => q.board === board && q.externalId === externalId
      );

      let isCorrect = false;

      if (board === 'PII' && question) {
        const piiQ = question as PiiQuestion;
        // Check if this field is marked as having PII leak
        if (field === 'notes' && piiQ.notes) {
          // Check if notes contains PII patterns (simplified logic)
          isCorrect = containsPII(piiQ.notes);
        } else if (field === 'shipping' && piiQ.shipping) {
          isCorrect = containsPII(piiQ.shipping);
        }
      } else if (board === 'INVARIANT' && question) {
        const invQ = question as InvariantQuestion;
        // Invariant rule: totalPrice = items + tax + shipping, tax >= 0
        const items = parseFloat(invQ.items);
        const tax = parseFloat(invQ.tax);
        const shipping = parseFloat(invQ.shipping);
        const totalPrice = parseFloat(invQ.totalPrice);

        if (field === 'totalPrice') {
          isCorrect = items + tax + shipping !== totalPrice;
        } else if (field === 'tax') {
          isCorrect = tax < 0;
        }
      }

      // Mark locally
      markCell(board, externalId, field, isCorrect);

      // Queue for server sync
      pendingAnswersRef.current.push({ board, targetId: externalId, field });
    },
    [state.questions, markCell]
  );

  const handleSubmit = useCallback(async () => {
    if (state.status !== 'playing') return;

    try {
      // Submit pending answers
      if (pendingAnswersRef.current.length > 0) {
        await submitAnswers([...pendingAnswersRef.current]);
        pendingAnswersRef.current = [];
      }
      await submitGame();
      navigate('/leaderboard');
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to submit');
    }
  }, [state.status, submitAnswers, submitGame, navigate]);

  // Handle game over (auto-submit on expiry)
  useEffect(() => {
    if (isExpired && state.status === 'playing') {
      handleTimeUp();
    }
  }, [isExpired, state.status, handleTimeUp]);

  const displayError = error || localError;

  return (
    <section className="game-screen" aria-labelledby="game-title">
      {isLoading && <LoadingOverlay text="Đang xử lý..." />}

      <div className="game-content">
        <header className="game-header">
          <div className="game-brand">
            <div className="brand-mark brand-mark-small">
              <span></span>
            </div>
            <div>
              <strong>PII SENTINEL</strong>
              <span>STUDENT AREA</span>
            </div>
          </div>

          <div className="group-info">
            <span>ĐỘI THI</span>
            <strong>{state.groupId}</strong>
          </div>

          <Timer remainingSeconds={remainingSeconds} isExpired={isExpired} />

          <ScoreBadge
            totalPoints={state.score?.totalPoints || 0}
            correctCount={state.score?.correctCount || 0}
            wrongCount={state.score?.wrongCount || 0}
          />
        </header>

        {displayError && (
          <div className="error-banner">
            <Icon name="alert" />
            <span>{displayError}</span>
            <button onClick={() => setLocalError(null)}>×</button>
          </div>
        )}

        {state.questions.length > 0 ? (
          <GameTable
            questions={state.questions}
            answers={state.answers}
            onCellClick={handleCellClick}
            disabled={state.status !== 'playing'}
          />
        ) : (
          <div className="loading-questions">
            <p>Đang tải câu hỏi...</p>
          </div>
        )}

        <footer className="game-footer">
          <span>© 2026 PII Sentinel Security Solutions</span>
          <div>
            <a href="#privacy">Privacy Policy</a>
            <a href="#terms">Terms of Service</a>
          </div>
        </footer>

        <div className="submit-area">
          <Button
            variant="primary"
            size="lg"
            onClick={handleSubmit}
            disabled={state.status !== 'playing'}
            isLoading={isLoading}
            leftIcon="submit"
          >
            NỘP BÀI
          </Button>
          {remainingSeconds > 0 && (
            <span className="submit-hint">
              Hoặc đợi hết giờ để nộp tự động
            </span>
          )}
        </div>
      </div>
    </section>
  );
}

// Helper function to detect PII in text
function containsPII(text: string): boolean {
  if (!text) return false;

  // Check for phone numbers (Vietnamese format)
  const phonePattern = /(0[0-9]{9,10})|(\d{10,11})|(\+\d{1,3}\d{6,10})/;
  if (phonePattern.test(text.replace(/\s/g, ''))) return true;

  // Check for email patterns
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  if (emailPattern.test(text)) return true;

  // Check for full addresses (Vietnamese format)
  const addressPatterns = [
    /\d+\s+[a-zA-Zàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]+\s+(đường|phố|quận|huyện|phường|xã|thành phố|tỉnh)/i,
    /\d+\s+[a-zA-Z0-9]+,/i,
  ];

  for (const pattern of addressPatterns) {
    if (pattern.test(text)) return true;
  }

  // Check for names (simplified - looking for capitalized names)
  const namePattern = /(anh|chị|ông|bà|mr\.|ms\.|mrs\.)\s+[A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ][a-zàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]+/i;
  if (namePattern.test(text)) return true;

  return false;
}
