import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icon, Button } from '../../components';
import { LoadingSpinner } from '../../components/Loading';
import { useAuth } from '../../contexts/AuthContext';
import { feedbackApi } from '../../services/api';
import type { FeedbackEntry } from '../../types';

export function AdminFeedbackPage() {
  const navigate = useNavigate();
  const { isAdmin, user, logout } = useAuth();
  const [feedback, setFeedback] = useState<FeedbackEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedEntry, setSelectedEntry] = useState<FeedbackEntry | null>(null);

  // Redirect if not admin
  useEffect(() => {
    if (!isAdmin) {
      navigate('/admin/login');
    }
  }, [isAdmin, navigate]);

  // Fetch feedback
  const fetchFeedback = useCallback(async (pageNum: number) => {
    try {
      setIsLoading(true);
      const data = await feedbackApi.list({ page: pageNum, limit: 10 });
      setFeedback(data.entries);
      setTotalPages(data.totalPages);
      setPage(pageNum);
    } catch (error) {
      console.error('Failed to fetch feedback:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeedback(1);
  }, [fetchFeedback]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchFeedback(newPage);
    }
  };

  const getRatingStars = (rating: number) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

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
        <Link to="/admin/leaderboard" className="nav-item">
          <Icon name="trophy" size={20} />
          <span>Bảng xếp hạng</span>
        </Link>
        <Link to="/admin/feedback" className="nav-item active">
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
        <section className="admin-section">
          <div className="section-header">
            <h2>
              <Icon name="star" size={24} />
              Phản hồi One Minute Paper
            </h2>
            <Button variant="ghost" size="sm" onClick={() => fetchFeedback(page)} leftIcon="refresh">
              Làm mới
            </Button>
          </div>

          {isLoading ? (
            <LoadingSpinner text="Đang tải..." />
          ) : feedback.length === 0 ? (
            <p className="empty-message">Chưa có phản hồi nào</p>
          ) : (
            <>
              <div className="feedback-list">
                {feedback.map((entry) => (
                  <div
                    key={entry.id}
                    className="feedback-card"
                    onClick={() => setSelectedEntry(entry)}
                  >
                    <div className="feedback-header">
                      <span className="feedback-group">{entry.groupId || 'Không rõ nhóm'}</span>
                      <span className="feedback-rating">{getRatingStars(entry.rating)}</span>
                    </div>
                    {entry.comment && (
                      <p className="feedback-preview">
                        {entry.comment.slice(0, 100)}
                        {entry.comment.length > 100 && '...'}
                      </p>
                    )}
                    <span className="feedback-time">
                      {new Date(entry.createdAt).toLocaleString('vi-VN')}
                    </span>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="pagination">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                  >
                    ← Trước
                  </Button>
                  <span className="page-info">
                    Trang {page} / {totalPages}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === totalPages}
                  >
                    Sau →
                  </Button>
                </div>
              )}
            </>
          )}
        </section>
      </main>

      {/* Modal */}
      {selectedEntry && (
        <div className="modal-overlay" onClick={() => setSelectedEntry(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Chi tiết phản hồi</h3>
              <button className="modal-close" onClick={() => setSelectedEntry(null)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="modal-field">
                <label>Nhóm:</label>
                <span>{selectedEntry.groupId || 'Không rõ nhóm'}</span>
              </div>
              <div className="modal-field">
                <label>Đánh giá:</label>
                <span>{getRatingStars(selectedEntry.rating)}</span>
              </div>
              <div className="modal-field">
                <label>Đã học được:</label>
                <p>{selectedEntry.comment || 'Không có'}</p>
              </div>
              <div className="modal-field">
                <label>Thời gian:</label>
                <span>{new Date(selectedEntry.createdAt).toLocaleString('vi-VN')}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
