import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ThemeProvider } from './hooks/useTheme';

import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import StudentLayout from './components/layout/StudentLayout';
import AdminLayout from './components/layout/AdminLayout';
import StudentDashboardPage from './pages/student/StudentDashboardPage';
import PackagesPage from './pages/student/PackagesPage';
import PackageDetailPage from './pages/student/PackageDetailPage';
import FriendsPage from './pages/student/FriendsPage';
import NotificationsPage from './pages/student/NotificationsPage';
import CommunityPage from './pages/student/CommunityPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminPackagesPage from './pages/admin/AdminPackagesPage';
import AdminLogPackagePage from './pages/admin/AdminLogPackagePage';

function ProtectedRoute({ children, requiredRole }) {
  const { user, role, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (requiredRole && role !== requiredRole) return <Navigate to="/auth" replace />;
  return children;
}

function AppRoutes() {
  const { user, role } = useAuth();

  return (
    <Routes>
      <Route path="/" element={!user ? <LandingPage /> : <Navigate to={role === 'admin' ? '/admin' : '/dashboard'} replace />} />
      <Route path="/auth" element={!user ? <AuthPage /> : <Navigate to={role === 'admin' ? '/admin' : '/dashboard'} replace />} />

      {/* Student routes */}
      <Route path="/dashboard" element={<ProtectedRoute requiredRole="student"><StudentLayout /></ProtectedRoute>}>
        <Route index element={<StudentDashboardPage />} />
      </Route>
      <Route path="/packages" element={<ProtectedRoute requiredRole="student"><StudentLayout /></ProtectedRoute>}>
        <Route index element={<PackagesPage />} />
        <Route path=":packageId" element={<PackageDetailPage />} />
      </Route>
      <Route path="/friends" element={<ProtectedRoute requiredRole="student"><StudentLayout /></ProtectedRoute>}>
        <Route index element={<FriendsPage />} />
      </Route>
      <Route path="/notifications" element={<ProtectedRoute requiredRole="student"><StudentLayout /></ProtectedRoute>}>
        <Route index element={<NotificationsPage />} />
      </Route>
      <Route path="/community" element={<ProtectedRoute requiredRole="student"><StudentLayout /></ProtectedRoute>}>
        <Route index element={<CommunityPage />} />
      </Route>

      {/* Admin routes */}
      <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminLayout /></ProtectedRoute>}>
        <Route index element={<AdminDashboardPage />} />
        <Route path="packages" element={<AdminPackagesPage />} />
        <Route path="log-package" element={<AdminLogPackagePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
