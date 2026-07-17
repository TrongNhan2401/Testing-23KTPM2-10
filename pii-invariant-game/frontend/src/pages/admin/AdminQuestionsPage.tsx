import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icon, Button } from '../../components';
import { LoadingSpinner } from '../../components/Loading';
import { useAuth } from '../../contexts/AuthContext';
import { questionsApi } from '../../services/api';
import type { PiiQuestionDoc, InvariantQuestionDoc } from '../../types';

type QuestionTab = 'pii' | 'invariant';

export function AdminQuestionsPage() {
  const navigate = useNavigate();
  const { isAdmin, user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<QuestionTab>('pii');
  const [piiQuestions, setPiiQuestions] = useState<PiiQuestionDoc[]>([]);
  const [invariantQuestions, setInvariantQuestions] = useState<InvariantQuestionDoc[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Redirect if not admin
  useEffect(() => {
    if (!isAdmin) {
      navigate('/admin/login');
    }
  }, [isAdmin, navigate]);

  // Fetch questions
  const fetchQuestions = useCallback(async () => {
    try {
      setIsLoading(true);
      const [pii, invariant] = await Promise.all([
        questionsApi.getPiiQuestions(),
        questionsApi.getInvariantQuestions(),
      ]);
      setPiiQuestions(pii);
      setInvariantQuestions(invariant);
    } catch (error) {
      console.error('Failed to fetch questions:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const currentQuestions = activeTab === 'pii' ? piiQuestions : invariantQuestions;

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
        <Link to="/admin/feedback" className="nav-item">
          <Icon name="star" size={20} />
          <span>Phản hồi</span>
        </Link>
        <Link to="/admin/questions" className="nav-item active">
          <Icon name="question" size={20} />
          <span>Câu hỏi</span>
        </Link>
      </nav>

      {/* Main Content */}
      <main className="admin-main">
        <section className="admin-section full-width">
          <div className="section-header">
            <h2>
              <Icon name="question" size={24} />
              Quản lý câu hỏi
            </h2>
            <div className="tab-buttons">
              <Button
                variant={activeTab === 'pii' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('pii')}
              >
                PII Questions ({piiQuestions.length})
              </Button>
              <Button
                variant={activeTab === 'invariant' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('invariant')}
              >
                Invariant Questions ({invariantQuestions.length})
              </Button>
            </div>
          </div>

          {isLoading ? (
            <LoadingSpinner text="Đang tải..." />
          ) : currentQuestions.length === 0 ? (
            <p className="empty-message">Chưa có câu hỏi nào</p>
          ) : (
            <div className="table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    {activeTab === 'pii' ? (
                      <>
                        <th>Họ tên</th>
                        <th>Email</th>
                        <th>Notes</th>
                        <th>Shipping</th>
                        <th>Có lỗi?</th>
                      </>
                    ) : (
                      <>
                        <th>Items</th>
                        <th>Tax</th>
                        <th>Shipping</th>
                        <th>Total</th>
                        <th>Có lỗi?</th>
                      </>
                    )}
                    <th>Active</th>
                  </tr>
                </thead>
                <tbody>
                  {activeTab === 'pii' ? (
                    piiQuestions.map((q) => (
                      <tr key={q._id}>
                        <td>{q.externalId}</td>
                        <td>{q.fullName || '-'}</td>
                        <td>{q.email || '-'}</td>
                        <td className="cell-text">{q.notes || '-'}</td>
                        <td className="cell-text">{q.shipping || '-'}</td>
                        <td>
                          {(q.correctNotes || q.correctShipping) ? (
                            <span className="badge badge-error">Có lỗi</span>
                          ) : (
                            <span className="badge badge-success">OK</span>
                          )}
                        </td>
                        <td>
                          <span className={`badge ${q.isActive ? 'badge-active' : 'badge-inactive'}`}>
                            {q.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    invariantQuestions.map((q) => (
                      <tr key={q._id}>
                        <td>{q.externalId}</td>
                        <td>{q.items}</td>
                        <td>{q.tax}</td>
                        <td>{q.shipping}</td>
                        <td>{q.totalPrice}</td>
                        <td>
                          {q.isViolation ? (
                            <span className="badge badge-error">Có lỗi</span>
                          ) : (
                            <span className="badge badge-success">OK</span>
                          )}
                        </td>
                        <td>
                          <span className={`badge ${q.isActive ? 'badge-active' : 'badge-inactive'}`}>
                            {q.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
