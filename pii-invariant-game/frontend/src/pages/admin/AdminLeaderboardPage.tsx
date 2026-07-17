import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icon, Button, LeaderboardTable } from '../../components';
import { LoadingSpinner } from '../../components/Loading';
import { useAuth } from '../../contexts/AuthContext';
import { leaderboardApi } from '../../services/api';
import type { LeaderboardResult } from '../../types';

export function AdminLeaderboardPage() {
  const navigate = useNavigate();
  const { isAdmin, user, logout } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Redirect if not admin
  useEffect(() => {
    if (!isAdmin) {
      navigate('/admin/login');
    }
  }, [isAdmin, navigate]);

  // Fetch leaderboard
  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        setIsLoading(true);
        const data = await leaderboardApi.getLeaderboard();
        setLeaderboard(data);
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchLeaderboard();

    // Poll every 3 seconds
    const interval = setInterval(fetchLeaderboard, 3000);
    return () => clearInterval(interval);
  }, [refreshKey]);

  const handleRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

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
        <Link to="/admin" className="nav-item">
          <Icon name="dashboard" size={20} />
          <span>Tổng quan</span>
        </Link>
        <Link to="/admin/leaderboard" className="nav-item active">
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
        <section className="admin-section full-width">
          <div className="section-header">
            <h2>
              <Icon name="trophy" size={24} />
              Bảng xếp hạng
            </h2>
            <Button variant="ghost" size="sm" onClick={handleRefresh} leftIcon="refresh">
              Làm mới
            </Button>
          </div>

          {isLoading ? (
            <LoadingSpinner text="Đang tải..." />
          ) : leaderboard ? (
            <LeaderboardTable entries={leaderboard.entries} />
          ) : (
            <p className="empty-message">Chưa có dữ liệu</p>
          )}
        </section>
      </main>
    </div>
  );
}
