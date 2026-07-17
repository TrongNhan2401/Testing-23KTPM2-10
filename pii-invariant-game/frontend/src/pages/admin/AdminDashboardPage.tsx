import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icon, Button } from '../../components';
import { LoadingSpinner } from '../../components/Loading';
import { useAuth } from '../../contexts/AuthContext';
import { groupsApi } from '../../services/api';
import type { LobbyGroup } from '../../types';

function getStatusLabel(status: string): string {
  switch (status) {
    case 'WAITING':
      return 'Chưa vào';
    case 'READY':
      return 'Đang chọn';
    case 'PLAYING':
      return 'Đang chơi';
    case 'FINISHED':
      return 'Đã xong';
    default:
      return status;
  }
}

function getStatusClass(status: string): string {
  switch (status) {
    case 'WAITING':
      return 'status-waiting';
    case 'READY':
      return 'status-ready';
    case 'PLAYING':
      return 'status-playing';
    case 'FINISHED':
      return 'status-finished';
    default:
      return '';
  }
}

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const { isAdmin, user, logout } = useAuth();
  const [groups, setGroups] = useState<LobbyGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Redirect if not admin
  useEffect(() => {
    if (!isAdmin) {
      navigate('/admin/login');
    }
  }, [isAdmin, navigate]);

  // Fetch groups
  useEffect(() => {
    async function fetchGroups() {
      try {
        setIsLoading(true);
        const data = await groupsApi.getLobby();
        setGroups(data);
      } catch (error) {
        console.error('Failed to fetch groups:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchGroups();

    // Poll every 3 seconds
    const interval = setInterval(fetchGroups, 3000);
    return () => clearInterval(interval);
  }, [refreshKey]);

  const handleRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const playingCount = groups.filter((g) => g.status === 'PLAYING').length;
  const finishedCount = groups.filter((g) => g.status === 'FINISHED').length;
  const waitingCount = groups.filter((g) => g.status === 'WAITING').length;

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <header className="admin-header">
        <div className="admin-header-left">
          <div className="brand-mark-small">
            <span></span>
          </div>
          <h1>PII Sentinel Admin</h1>
        </div>
        <div className="admin-header-right">
          <span className="admin-user">
            <Icon name="user" size={16} />
            {user?.username}
          </span>
          <Button variant="ghost" size="sm" onClick={logout} leftIcon="logout">
            Đăng xuất
          </Button>
        </div>
      </header>

      {/* Navigation */}
      <nav className="admin-nav">
        <Link to="/admin" className="nav-item active">
          <Icon name="dashboard" size={20} />
          <span>Tổng quan</span>
        </Link>
        <Link to="/admin/leaderboard" className="nav-item">
          <Icon name="trophy" size={20} />
          <span>Bảng xếp hạng</span>
        </Link>
        <Link to="/admin/feedback" className="nav-item">
          <Icon name="star" size={20} />
          <span>Phản hồi</span>
        </Link>
        <Link to="/admin/questions" className="nav-item">
          <Icon name="question" size={20} />
          <span>Câu hỏi</span>
        </Link>
      </nav>

      {/* Main Content */}
      <main className="admin-main">
        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon status-waiting">
              <Icon name="users" size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-value">{waitingCount}</span>
              <span className="stat-label">Chưa vào</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon status-playing">
              <Icon name="play" size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-value">{playingCount}</span>
              <span className="stat-label">Đang chơi</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon status-finished">
              <Icon name="check" size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-value">{finishedCount}</span>
              <span className="stat-label">Đã xong</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <Icon name="users" size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-value">{groups.length}</span>
              <span className="stat-label">Tổng nhóm</span>
            </div>
          </div>
        </div>

        {/* Groups Table */}
        <section className="admin-section">
          <div className="section-header">
            <h2>
              <Icon name="users" size={24} />
              Trạng thái các nhóm
            </h2>
            <Button variant="ghost" size="sm" onClick={handleRefresh} leftIcon="refresh">
              Làm mới
            </Button>
          </div>

          {isLoading ? (
            <LoadingSpinner text="Đang tải..." />
          ) : (
            <div className="table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Nhóm</th>
                    <th>Trạng thái</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.map((group) => (
                    <tr key={group.groupId}>
                      <td className="cell-group">{group.groupId}</td>
                      <td>
                        <span className={`status-badge ${getStatusClass(group.status)}`}>
                          {getStatusLabel(group.status)}
                        </span>
                      </td>
                      <td>
                        {group.status === 'PLAYING' && (
                          <Button variant="ghost" size="sm">
                            <Icon name="unlock" size={16} />
                            Mở khóa
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
