import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { AdminProvider } from './context/AdminContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import DashboardPage from './pages/DashboardPage';
import CreateSurveyPage from './pages/CreateSurveyPage';
import PublicSurveyPage from './pages/PublicSurveyPage';
import SurveyAnalyticsPage from './pages/SurveyAnalyticsPage';
import AdminDashboardPage from './pages/AdminDashboardPage';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AdminProvider>
          <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/create-survey"
              element={
                <ProtectedRoute>
                  <CreateSurveyPage />
                </ProtectedRoute>
              }
            />
            <Route path="/survey/:id" element={<PublicSurveyPage />} />
            <Route
              path="/survey/:id/analytics"
              element={
                <ProtectedRoute>
                  <SurveyAnalyticsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </AdminProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
