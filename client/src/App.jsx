import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';
import InquiryPage from './pages/InquiryPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';

function Protected({ children }) {
  const { admin, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="splash"><div className="spinner" /></div>;
  if (!admin) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  return children;
}

function GuestOnly({ children }) {
  const { admin, loading } = useAuth();
  if (loading) return <div className="splash"><div className="spinner" /></div>;
  if (admin) return <Navigate to="/admin" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<InquiryPage />} />
      <Route path="/admin/login" element={<GuestOnly><LoginPage /></GuestOnly>} />
      <Route path="/admin" element={<Protected><DashboardPage /></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
