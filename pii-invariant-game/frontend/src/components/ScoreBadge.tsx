interface ScoreBadgeProps {
  totalPoints: number;
  correctCount: number;
  wrongCount: number;
  size?: 'sm' | 'md' | 'lg';
}

export function ScoreBadge({ totalPoints, correctCount, wrongCount, size = 'md' }: ScoreBadgeProps) {
  const isNegative = totalPoints < 0;
  const sizeClass = `score-${size}`;
  const colorClass = isNegative ? 'score-negative' : 'score-positive';

  return (
    <div className={`score-pill ${sizeClass} ${colorClass}`}>
      <div className="score-main">
        <span className="score-label">Tổng điểm</span>
        <span className="score-value">{isNegative ? '' : '+'}{totalPoints}</span>
      </div>
      <div className="score-breakdown">
        <span className="score-correct">✓ {correctCount}</span>
        <span className="score-wrong">✗ {wrongCount}</span>
      </div>
    </div>
  );
}
