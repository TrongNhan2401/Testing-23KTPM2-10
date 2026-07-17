interface TimerProps {
  remainingSeconds: number;
  isExpired?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showWarning?: boolean;
  warningThreshold?: number;
}

export function Timer({
  remainingSeconds,
  isExpired = false,
  size = 'md',
  showWarning = true,
  warningThreshold = 60,
}: TimerProps) {
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const isWarning = showWarning && remainingSeconds <= warningThreshold && remainingSeconds > 0;
  const sizeClass = `timer-${size}`;
  const statusClass = isExpired ? 'timer-expired' : isWarning ? 'timer-warning' : 'timer-normal';

  return (
    <div className={`timer-pill ${sizeClass} ${statusClass}`}>
      <span className="timer-icon">⏱</span>
      <span className="timer-value">{isExpired ? 'HẾT GIỜ' : timeString}</span>
    </div>
  );
}
