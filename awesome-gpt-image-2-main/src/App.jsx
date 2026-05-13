import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Topbar } from './components/Topbar';
import { CreativeHub } from './pages/CreativeHub';
import { DetailStudio } from './pages/DetailStudio';
import { RetouchStudio } from './pages/RetouchStudio';
import { PsdLayer } from './pages/PsdLayer';
import { VideoGen } from './pages/VideoGen';
import { Gallery } from './pages/Gallery';
import { LoginPage } from './pages/auth/Login';
import { RegisterPage } from './pages/auth/Register';
import { PricingPage } from './pages/member/Pricing';
import { CreditsCenter } from './pages/credits/CreditsCenter';
import { AffiliatePage } from './pages/distribution/Affiliate';
import { ProfilePage } from './pages/member/Profile';
import { AdminPage } from './pages/admin/Admin';
import { UserDashboard } from './pages/UserDashboard';
import { ProtectedRoute, AdminRoute } from './components/auth/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useAuth } from './contexts/AuthContext';
import { AgencyProvider } from './contexts/AgencyContext';

function AppRoutes({ language }) {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to="/" replace /> : <RegisterPage />} />
      <Route path="/" element={<CreativeHub language={language} />} />
      <Route path="/detail-studio" element={<DetailStudio language={language} />} />
      <Route path="/retouch-studio" element={<RetouchStudio language={language} />} />
      <Route path="/psd-layer" element={<PsdLayer language={language} />} />
      <Route path="/video-gen" element={<VideoGen language={language} />} />
      <Route path="/gallery" element={<Gallery language={language} />} />
      <Route path="/pricing" element={<PricingPage language={language} />} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage language={language} /></ProtectedRoute>} />
      <Route path="/credits" element={<ProtectedRoute><CreditsCenter language={language} /></ProtectedRoute>} />
      <Route path="/affiliate" element={<ProtectedRoute><AffiliatePage language={language} /></ProtectedRoute>} />
      <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><UserDashboard language={language} /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export function App() {
  const [language, setLanguage] = useState(() => localStorage.getItem('language') || 'zh');

  const handleSetLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
  };

  return (
    <AgencyProvider>
      <ErrorBoundary>
        <Topbar language={language} setLanguage={handleSetLanguage} />
        <div className="appBody">
          <AppRoutes language={language} />
        </div>
      </ErrorBoundary>
    </AgencyProvider>
  );
}
