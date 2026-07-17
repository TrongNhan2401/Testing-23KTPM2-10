import { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../../components/Icon';
import { Button } from '../../components/Button';
import { useGame } from '../../contexts/GameContext';

export function StartPage() {
  const navigate = useNavigate();
  const { state, startGame, releaseGroup, isLoading, error } = useGame();

  // Redirect if no group selected
  useEffect(() => {
    if (!state.groupId || !state.selectionToken) {
      navigate('/');
    }
  }, [state.groupId, state.selectionToken, navigate]);

  const handleStartGame = useCallback(async () => {
    try {
      await startGame();
      navigate('/game');
    } catch {
      // Error handled by context
    }
  }, [startGame, navigate]);

  const handleBack = useCallback(async () => {
    try {
      await releaseGroup();
      navigate('/');
    } catch {
      navigate('/');
    }
  }, [releaseGroup, navigate]);

  return (
    <section className="start-screen" aria-labelledby="start-title">
      <div className="start-container">
        <div className="brand-block">
          <div className="brand-mark">
            <span></span>
          </div>
          <h1 id="start-title">PII SENTINEL</h1>
        </div>

        <div className="start-info">
          <div className="info-card">
            <Icon name="users" size={32} />
            <div className="info-content">
              <span className="info-label">Đội thi</span>
              <span className="info-value">{state.groupId}</span>
            </div>
          </div>

          <div className="info-card">
            <Icon name="timer" size={32} />
            <div className="info-content">
              <span className="info-label">Thời gian</span>
              <span className="info-value">10 phút</span>
            </div>
          </div>

          <div className="info-card">
            <Icon name="target" size={32} />
            <div className="info-content">
              <span className="info-label">Nhiệm vụ</span>
              <span className="info-value">Phát hiện PII & Invariant</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="error-banner">
            <Icon name="alert" />
            <span>{error}</span>
          </div>
        )}

        <div className="rules-section">
          <h2>Luật chơi</h2>
          <ul className="rules-list">
            <li>
              <Icon name="check" size={16} />
              <span>
                <strong>+2 điểm</strong> cho mỗi ô đúng (có lỗi bảo mật)
              </span>
            </li>
            <li>
              <Icon name="x" size={16} />
              <span>
                <strong>−1 điểm</strong> cho mỗi ô sai
              </span>
            </li>
            <li>
              <Icon name="clock" size={16} />
              <span>
                <strong>10 phút</strong> cho cả 2 bảng
              </span>
            </li>
            <li>
              <Icon name="alert" size={16} />
              <span>
                <strong>Không được sửa</strong> sau khi click
              </span>
            </li>
            <li>
              <Icon name="submit" size={16} />
              <span>
                Có thể <strong>nộp sớm</strong> hoặc đợi hết giờ
              </span>
            </li>
          </ul>
        </div>

        <div className="start-actions">
          <Button
            variant="primary"
            size="lg"
            onClick={handleStartGame}
            isLoading={isLoading}
            leftIcon="play"
          >
            BẮT ĐẦU
          </Button>
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={isLoading}
          >
            Quay lại
          </Button>
        </div>
      </div>
    </section>
  );
}
