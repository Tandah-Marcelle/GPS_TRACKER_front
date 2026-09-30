import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { ModalsProvider } from '@mantine/modals';

import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppLayout } from './components/AppLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Trackers from './pages/Trackers';
import Clients from './pages/Clients';
import Vehicles from './pages/Vehicles';
import Interventions from './pages/Interventions';
import MyInterventions from './pages/MyInterventions';
import Dashboard from './pages/Dashboard';

function RoleRedirect() {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role === 'TECHNICIAN') return <Navigate to="/my-interventions" replace />;
  return <Navigate to="/dashboard" replace />;
}

function Unauthorized() {
  const { user } = useAuth();
  return (
    <div style={{ padding: 40 }}>
      <h2>403 — Forbidden</h2>
      <p>Your role ({user?.role}) cannot access this page.</p>
    </div>
  );
}

/** Wraps a protected screen with the sidebar/topbar shell. */
function Shell({ children, roles }: { children: React.ReactNode; roles?: ('STOCK_MANAGER' | 'TECHNICIAN')[] }) {
  return (
    <ProtectedRoute roles={roles}>
      <AppLayout>{children}</AppLayout>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <MantineProvider forceColorScheme="dark" defaultColorScheme="dark">
      <Notifications position="top-right" />
      <ModalsProvider>
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/dashboard"
                element={
                  <Shell roles={['STOCK_MANAGER']}>
                    <Dashboard />
                  </Shell>
                }
              />
              <Route
                path="/trackers"
                element={
                  <Shell roles={['STOCK_MANAGER']}>
                    <Trackers />
                  </Shell>
                }
              />
              <Route
                path="/clients"
                element={
                  <Shell roles={['STOCK_MANAGER']}>
                    <Clients />
                  </Shell>
                }
              />
              <Route
                path="/vehicles"
                element={
                  <Shell roles={['STOCK_MANAGER']}>
                    <Vehicles />
                  </Shell>
                }
              />
              <Route
                path="/interventions"
                element={
                  <Shell roles={['STOCK_MANAGER']}>
                    <Interventions />
                  </Shell>
                }
              />
              <Route
                path="/my-interventions"
                element={
                  <Shell roles={['TECHNICIAN']}>
                    <MyInterventions />
                  </Shell>
                }
              />
              <Route path="/unauthorized" element={<Unauthorized />} />
              <Route path="/" element={<RoleRedirect />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </ModalsProvider>
    </MantineProvider>
  );
}
