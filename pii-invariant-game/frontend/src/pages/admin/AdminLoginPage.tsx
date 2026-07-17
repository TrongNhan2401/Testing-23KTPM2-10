import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon, Button } from '../../components';
import { useAuth } from '../../contexts/AuthContext';

export function AdminLoginPage() {
  const navigate = useNavigate();
  const { login, isLoading, error } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(username, password);
      navigate('/admin');
    } catch {
      // Error handled by context
    }
  }, [username, password, login, navigate]);

  return (
    <section className="admin-login-screen" aria-labelledby="admin-login-title">
      <div className="admin-login-container">
        <div className="brand-block">
          <div className="brand-mark">
            <span></span>
          </div>
          <h1 id="admin-login-title">PII SENTINEL</h1>
          <p>ADMIN AREA</p>
        </div>

        <form className="admin-login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">
              <Icon name="user" size={20} />
              <span>Tên đăng nhập</span>
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nhập tên đăng nhập"
              required
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              <Icon name="lock" size={20} />
              <span>Mật khẩu</span>
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu"
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="error-banner">
              <Icon name="alert" />
              <span>{error}</span>
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            leftIcon="user"
          >
            Đăng nhập
          </Button>
        </form>

        <div className="admin-login-footer">
          <a href="/">← Quay lại trang chơi</a>
        </div>
      </div>
    </section>
  );
}
