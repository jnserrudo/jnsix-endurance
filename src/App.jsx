import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { ActivitiesProvider } from './contexts/ActivitiesContext';
import { MainLayout } from './components/layout/MainLayout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Activities } from './pages/Activities';
import { ActivityDetail } from './pages/ActivityDetail';
import { AIAnalysis } from './pages/AIAnalysis';
import { Comparisons } from './pages/Comparisons';
import { Settings } from './pages/Settings';
import { StravaCallback } from './pages/StravaCallback';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-pulse-neon text-6xl neon-text-cyan font-mono">●</div>
          <p className="text-text-secondary font-mono">CARGANDO...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <ActivitiesProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Dashboard />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/activities"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Activities />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/activities/:id"
          element={
            <ProtectedRoute>
              <MainLayout>
                <ActivityDetail />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/ai-analysis"
          element={
            <ProtectedRoute>
              <MainLayout>
                <AIAnalysis />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/comparisons"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Comparisons />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Settings />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route path="/auth/callback" element={<StravaCallback />} />
        <Route path="/auth/strava/callback" element={<StravaCallback />} />
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </ActivitiesProvider>
  );
}

export default App
