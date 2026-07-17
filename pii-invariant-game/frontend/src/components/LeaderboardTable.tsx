import type { LeaderboardEntry } from '../types';
import { Icon } from './Icon';

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  currentGroupId?: string;
}

export function LeaderboardTable({ entries, currentGroupId }: LeaderboardTableProps) {
  if (entries.length === 0) {
    return (
      <div className="leaderboard-empty">
        <Icon name="trophy" size={48} />
        <p>Chưa có đội nào hoàn thành</p>
      </div>
    );
  }

  return (
    <div className="leaderboard-wrap">
      <table className="leaderboard-table">
        <thead>
          <tr>
            <th>Hạng</th>
            <th>Nhóm</th>
            <th>Điểm</th>
            <th>Thời gian nộp</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr
              key={entry.groupId}
              className={entry.groupId === currentGroupId ? 'is-current-group' : ''}
            >
              <td className="cell-rank">
                <RankBadge rank={entry.rank} />
              </td>
              <td className="cell-group">
                <span className="group-name">{entry.groupId}</span>
                {entry.groupId === currentGroupId && (
                  <span className="current-badge">Đội của bạn</span>
                )}
              </td>
              <td className={`cell-score ${entry.latestScore < 0 ? 'score-negative' : 'score-positive'}`}>
                {entry.latestScore}
              </td>
              <td className="cell-time">{formatTime(entry.lastSubmittedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  let icon = '';
  let className = 'rank-badge';

  switch (rank) {
    case 1:
      icon = '🥇';
      className += ' rank-gold';
      break;
    case 2:
      icon = '🥈';
      className += ' rank-silver';
      break;
    case 3:
      icon = '🥉';
      className += ' rank-bronze';
      break;
    default:
      icon = `#${rank}`;
  }

  return <span className={className}>{icon}</span>;
}

function formatTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return '-';
  }
}
