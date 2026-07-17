import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../../components/Icon';
import { Button } from '../../components/Button';
import { LoadingOverlay } from '../../components/Loading';
import { feedbackApi } from '../../services/api';
import { useGame } from '../../contexts/GameContext';

export function FeedbackPage() {
  const navigate = useNavigate();
  const { state } = useGame();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [learned, setLearned] = useState('');
  const [unclear, setUnclear] = useState('');
  const [rating, setRating] = useState<number>(0);

  // Redirect if game not submitted
  useEffect(() => {
    if (state.status !== 'submitted' && state.status !== 'expired') {
      navigate('/');
    }
  }, [state.status, navigate]);

  const handleSubmit = useCallback(async () => {
    if (!learned.trim()) {
      setError('Vui lòng nhập một điều đã học được');
      return;
    }
    if (!unclear.trim()) {
      setError('Vui lòng nhập một điều còn thắc mắc');
      return;
    }
    if (rating === 0) {
      setError('Vui lòng đánh giá mức độ hữu ích');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await feedbackApi.submit({
        groupId: state.groupId || undefined,
        sessionId: state.sessionId || undefined,
        rating,
        learned: learned.trim(),
        unclear: unclear.trim(),
      });
      navigate('/thankyou');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit feedback');
    } finally {
      setIsLoading(false);
    }
  }, [learned, unclear, rating, state.groupId, state.sessionId, navigate]);

  return (
    <section className="feedback-screen" aria-labelledby="feedback-title">
      {isLoading && <LoadingOverlay text="Đang gửi phản hồi..." />}

      <div className="feedback-container">
        <div className="feedback-header">
          <div className="brand-mark">
            <span></span>
          </div>
          <h1 id="feedback-title">ONE MINUTE PAPER</h1>
          <p>Phản hồi nhanh về buổi học</p>
        </div>

        {error && (
          <div className="error-banner">
            <Icon name="alert" />
            <span>{error}</span>
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}

        <form className="feedback-form" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          {/* Question 1: Learned */}
          <div className="form-group">
            <label htmlFor="learned">
              <Icon name="check" size={20} />
              <span>Một điều bạn đã học được hôm nay?</span>
            </label>
            <textarea
              id="learned"
              value={learned}
              onChange={(e) => setLearned(e.target.value)}
              placeholder="VD: Tôi đã học được cách nhận biết thông tin cá nhân trong văn bản..."
              maxLength={500}
              rows={4}
              required
            />
            <span className="char-count">{learned.length}/500</span>
          </div>

          {/* Question 2: Unclear */}
          <div className="form-group">
            <label htmlFor="unclear">
              <Icon name="question" size={20} />
              <span>Một điều bạn vẫn còn thắc mắc?</span>
            </label>
            <textarea
              id="unclear"
              value={unclear}
              onChange={(e) => setUnclear(e.target.value)}
              placeholder="VD: Tôi vẫn chưa hiểu rõ cách phân biệt các loại PII..."
              maxLength={500}
              rows={4}
              required
            />
            <span className="char-count">{unclear.length}/500</span>
          </div>

          {/* Question 3: Rating */}
          <div className="form-group">
            <label>
              <Icon name="star" size={20} />
              <span>Buổi học này hữu ích như thế nào với bạn?</span>
            </label>
            <div className="rating-stars">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  className={`star-btn ${rating >= value ? 'active' : ''}`}
                  onClick={() => setRating(value)}
                  aria-label={`Rate ${value} out of 5`}
                >
                  {rating >= value ? '★' : '☆'}
                </button>
              ))}
            </div>
            <div className="rating-labels">
              <span>Không hữu ích</span>
              <span>Rất hữu ích</span>
            </div>
          </div>

          <div className="form-actions">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              leftIcon="submit"
            >
              Gửi phản hồi
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}
