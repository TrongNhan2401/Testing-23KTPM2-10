import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon, LoadingSpinner } from '../../components';
import { useGame } from '../../contexts/GameContext';
import type { LobbyGroup, GroupStatus } from '../../types';

// Group icons mapping
const groupIcons: Record<number, string> = {
  0: 'shield',
  1: 'users',
  2: 'card',
  3: 'layers',
  4: 'target',
  5: 'star',
  6: 'trophy',
  7: 'chart',
};

function getGroupIcon(index: number): string {
  return groupIcons[index % Object.keys(groupIcons).length];
}

function getStatusLabel(status: GroupStatus): string {
  switch (status) {
    case 'WAITING':
      return 'SẴN SÀNG';
    case 'READY':
      return 'ĐANG CHỌN';
    case 'PLAYING':
      return 'ĐANG CHƠI';
    case 'FINISHED':
      return 'ĐÃ XONG';
    default:
      return status;
  }
}

function getStatusClass(status: GroupStatus): string {
  switch (status) {
    case 'WAITING':
      return 'status-available';
    case 'READY':
      return 'status-ready';
    case 'PLAYING':
      return 'status-locked';
    case 'FINISHED':
      return 'status-finished';
    default:
      return '';
  }
}

export function LoginPage() {
  const navigate = useNavigate();
  const { lobby, fetchLobby, selectGroup, isLoading, error } = useGame();

  // Poll lobby every 3 seconds
  useEffect(() => {
    fetchLobby();
    const interval = setInterval(fetchLobby, 3000);
    return () => clearInterval(interval);
  }, [fetchLobby]);

  const handleGroupClick = useCallback(
    async (group: LobbyGroup) => {
      if (group.status !== 'WAITING') return;

      try {
        await selectGroup(group.groupId);
        navigate('/start');
      } catch {
        // Error handled by context
      }
    },
    [selectGroup, navigate]
  );

  return (
    <section className="login-screen" aria-labelledby="login-title">
      <div className="brand-block">
        <div className="brand-mark">
          <span></span>
        </div>
        <h1 id="login-title">PII SENTINEL</h1>
        <p>CHỌN NHÓM CỦA BẠN</p>
      </div>

      {error && (
        <div className="error-banner">
          <Icon name="alert" />
          <span>{error}</span>
        </div>
      )}

      <div className="group-grid" aria-label="Danh sách nhóm">
        {isLoading && lobby.length === 0 ? (
          <LoadingSpinner text="Đang tải..." />
        ) : (
          lobby.map((group, index) => (
            <button
              className={`group-card ${group.status !== 'WAITING' ? 'is-locked' : ''} ${getStatusClass(group.status)}`}
              disabled={group.status !== 'WAITING'}
              key={group.groupId}
              onClick={() => handleGroupClick(group)}
              type="button"
            >
              <Icon name={getGroupIcon(index)} />
              <strong>{group.groupId}</strong>
              <span>{getStatusLabel(group.status)}</span>
            </button>
          ))
        )}
      </div>

      <aside className="login-note">
        <Icon name="info" />
        <span>
          Lưu ý: Mỗi nhóm chỉ được đăng nhập trên một thiết bị duy nhất. Sau khi chọn,
          nhóm sẽ bị khóa để đảm bảo tính công bằng. Vui lòng xác nhận trước khi truy cập.
        </span>
      </aside>

      <div className="login-meta">
        <span>STATUS: WAITING_FOR_SELECTION</span>
        <span>PROTOCOL: PII_SENTINEL_V3</span>
        <span>SESSION: {new Date().toISOString().split('T')[0]}</span>
      </div>
    </section>
  );
}
