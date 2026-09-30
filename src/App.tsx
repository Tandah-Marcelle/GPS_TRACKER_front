import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { ModalsProvider } from '@mantine/modals';

import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import Login from './pages/Login';
import DashboardPlaceholder from './pages/DashboardPlaceholder';

function RoleRedirect() {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role === 'TECHNICIAN') return <Navigate to="/my-interventions" replace />;
  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <MantineProvider>
      <Notifications position="top-right" />
      <ModalsProvider>
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute roles={['STOCK_MANAGER']}>
                    <DashboardPlaceholder />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-interventions"
                element={
                  <ProtectedRoute roles={['TECHNICIAN']}>
                    <DashboardPlaceholder />
                  </ProtectedRoute>
                }
              />
              <Route path="/unauthorized" element={<div style={{ padding: 40 }}>403 - Forbidden</div>} />
              <Route path="/" element={<RoleRedirect />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </ModalsProvider>
    </MantineProvider>
  );
}
