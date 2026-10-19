import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { DashboardLayout } from './layouts/DashboardLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { SitesPage } from './pages/SitesPage';
import { SiteDetailPage } from './pages/SiteDetailPage';
import { CamerasPage } from './pages/CamerasPage';
import { AlertsPage } from './pages/AlertsPage';
import { RiskEventsPage } from './pages/RiskEventsPage';
import { SensorsPage } from './pages/SensorsPage';
import { SettingsPage } from './pages/SettingsPage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Application Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="sites" element={<SitesPage />} />
            <Route path="sites/:id" element={<SiteDetailPage />} />
            <Route path="cameras" element={<CamerasPage />} />
            <Route path="alerts" element={<AlertsPage />} />
            <Route path="risk-events" element={<RiskEventsPage />} />
            <Route path="sensors" element={<SensorsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
