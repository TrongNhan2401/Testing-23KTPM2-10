import { useNavigate } from 'react-router-dom';
import { Icon } from '../../components/Icon';
import { Button } from '../../components/Button';
import { useGame } from '../../contexts/GameContext';

export function ThankYouPage() {
  const navigate = useNavigate();
  const { state, resetGame } = useGame();

  const handleFinish = () => {
    resetGame();
    navigate('/');
  };

  return (
    <section className="thankyou-screen" aria-labelledby="thankyou-title">
      <div className="thankyou-container">
        <div className="confetti">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="confetti-piece" style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              backgroundColor: ['#4CAF50', '#2196F3', '#FF9800', '#E91E63', '#9C27B0'][Math.floor(Math.random() * 5)],
            }} />
          ))}
        </div>

        <div className="thankyou-content">
          <div className="brand-mark-large">
            <span></span>
          </div>

          <h1 id="thankyou-title">CẢM ƠN!</h1>
          <p className="subtitle">Cảm ơn {state.groupId} đã tham gia!</p>

          <div className="final-score">
            <span className="score-label">Điểm cuối cùng</span>
            <span className={`score-value ${(state.score?.totalPoints || 0) < 0 ? 'negative' : ''}`}>
              {state.score?.totalPoints || 0}
            </span>
          </div>

          <div className="score-summary">
            <div className="summary-item">
              <Icon name="check" size={20} />
              <span>{state.score?.correctCount || 0} câu đúng</span>
            </div>
            <div className="summary-item">
              <Icon name="x" size={20} />
              <span>{state.score?.wrongCount || 0} câu sai</span>
            </div>
          </div>

          <div className="thankyou-message">
            <p>
              Chúc các bạn học tập tốt!
            </p>
            <p>
              Đã ghi nhận phản hồi của bạn.
            </p>
          </div>

          <div className="thankyou-actions">
            <Button
              variant="primary"
              size="lg"
              onClick={handleFinish}
            >
              Quay lại màn hình chính
            </Button>
          </div>
        </div>

        <div className="thankyou-footer">
          <span>© 2026 PII Sentinel Security Solutions</span>
        </div>
      </div>
    </section>
  );
}
