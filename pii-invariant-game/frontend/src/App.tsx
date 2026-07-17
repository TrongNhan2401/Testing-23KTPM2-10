import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { GameProvider } from './contexts/GameContext';
import {
  LoginPage,
  StartPage,
  GamePage,
  LeaderboardPage,
  FeedbackPage,
  ThankYouPage,
} from './pages/user';
import {
  AdminLoginPage,
  AdminDashboardPage,
  AdminLeaderboardPage,
  AdminFeedbackPage,
  AdminQuestionsPage,
} from './pages/admin';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <GameProvider>
          <Routes>
            {/* User Routes */}
            <Route path="/" element={<LoginPage />} />
            <Route path="/start" element={<StartPage />} />
            <Route path="/game" element={<GamePage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/feedback" element={<FeedbackPage />} />
            <Route path="/thankyou" element={<ThankYouPage />} />

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin/leaderboard" element={<AdminLeaderboardPage />} />
            <Route path="/admin/feedback" element={<AdminFeedbackPage />} />
            <Route path="/admin/questions" element={<AdminQuestionsPage />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </GameProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
