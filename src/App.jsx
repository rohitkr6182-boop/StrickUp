import { Navigate, Route, Routes } from 'react-router-dom';
import { useApp } from './state/AppContext.jsx';
import Landing from './pages/Landing.jsx';
import AuthPage from './pages/AuthPage.jsx';
import Workspace, { WorkspaceLayout } from './pages/Workspace.jsx';

function ProtectedLayout() {
  const { user, loading } = useApp();
  if (loading) return <div className="app-loading"><span className="spinner" /> Opening your space…</div>;
  return user ? <WorkspaceLayout /> : <Navigate to="/login" replace />;
}

export default function App() {
  const { user, loading } = useApp();
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={!loading && user ? <Navigate to="/dashboard" replace /> : <AuthPage />} />
      <Route path="/signup" element={!loading && user ? <Navigate to="/dashboard" replace /> : <AuthPage />} />
      <Route path="/recover" element={<AuthPage />} />
      <Route path="/reset-password" element={<AuthPage />} />
      <Route path="/dashboard" element={<ProtectedLayout />} />
      <Route path="/habits" element={<ProtectedLayout />} />
      <Route path="/focus" element={<ProtectedLayout />} />
      <Route path="/coding" element={<ProtectedLayout />} />
      <Route path="/calendar" element={<ProtectedLayout />} />
      <Route path="/analytics" element={<ProtectedLayout />} />
      <Route path="/achievements" element={<ProtectedLayout />} />
      <Route path="/settings" element={<ProtectedLayout />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
