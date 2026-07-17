import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../../components/Icon';
import { Button } from '../../components/Button';
import { LeaderboardTable } from '../../components/LeaderboardTable';
import { useGame } from '../../contexts/GameContext';

export function LeaderboardPage() {
  const navigate = useNavigate();
  const { state, leaderboard, refreshLeaderboard } = useGame();

  // Redirect if game not submitted
  useEffect(() => {
    if (state.status !== 'submitted' && state.status !== 'expired') {
      navigate('/');
    }
  }, [state.status, navigate]);

  // Poll leaderboard every 3 seconds
  useEffect(() => {
    refreshLeaderboard();
    const interval = setInterval(refreshLeaderboard, 3000);
    return () => clearInterval(interval);
  }, [refreshLeaderboard]);

  const handleContinue = () => {
    navigate('/feedback');
  };

  const myRank = leaderboard?.entries.find(
    (e) => e.groupId === state.groupId
  );

  return (
    <section className="leaderboard-screen" aria-labelledby="leaderboard-title">
      <div className="leaderboard-container">
        <div className="leaderboard-header">
          <div className="brand-mark">
            <span></span>
          </div>
          <h1 id="leaderboard-title">KẾT QUẢ</h1>
          <p>Trò chơi đã kết thúc</p>
        </div>

        {/* My Score Card */}
        {state.score && (
          <div className="my-score-card">
            <div className="my-score-header">
              <Icon name="user" size={24} />
              <span>{state.groupId}</span>
              {myRank && (
                <span className="my-rank">
                  Hạng #{myRank.rank}
                </span>
              )}
            </div>
            <div className="my-score-body">
              <div className="score-main">
                <span className="score-label">Tổng điểm</span>
                <span className={`score-value ${state.score.totalPoints < 0 ? 'negative' : ''}`}>
                  {state.score.totalPoints}
                </span>
              </div>
              <div className="score-breakdown">
                <div className="breakdown-item correct">
                  <Icon name="check" size={16} />
                  <span>{state.score.correctCount} đúng</span>
                </div>
                <div className="breakdown-item wrong">
                  <Icon name="x" size={16} />
                  <span>{state.score.wrongCount} sai</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard */}
        <div className="leaderboard-section">
          <h2>
            <Icon name="trophy" size={24} />
            Bảng xếp hạng
          </h2>
          <LeaderboardTable
            entries={leaderboard?.entries || []}
            currentGroupId={state.groupId || undefined}
          />
        </div>

        <div className="leaderboard-actions">
          <Button
            variant="primary"
            size="lg"
            onClick={handleContinue}
            rightIcon="chevronRight"
          >
            Tiếp tục - One Minute Paper
          </Button>
        </div>
      </div>
    </section>
  );
}
