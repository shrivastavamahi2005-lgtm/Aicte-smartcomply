import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ApplicationsPage } from './pages/ApplicationsPage';
import { ApplicationDetailPage } from './pages/ApplicationDetailPage';
import { DocumentIntelligencePage } from './pages/DocumentIntelligencePage';
import { ComplianceCenterPage } from './pages/ComplianceCenterPage';
import { ComplianceGraphPage } from './pages/ComplianceGraphPage';
import { WorkflowTasksPage } from './pages/WorkflowTasksPage';
import { AlertsEscalationsPage } from './pages/AlertsEscalationsPage';
import { RuleChangeRadarPage } from './pages/RuleChangeRadarPage';
import { CopilotPage } from './pages/CopilotPage';
import { ReportsAnalyticsPage } from './pages/ReportsAnalyticsPage';
import { AuditTrailPage } from './pages/AuditTrailPage';
import { SettingsPage } from './pages/SettingsPage';
import { RefreshCw } from 'lucide-react';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />

              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<DashboardPage />} />
                <Route path="applications" element={<ApplicationsPage />} />
                <Route path="applications/:id" element={<ApplicationDetailPage />} />
                <Route path="documents" element={<DocumentIntelligencePage />} />
                <Route path="compliance" element={<ComplianceCenterPage />} />
                <Route path="graph" element={<ComplianceGraphPage />} />
                <Route path="tasks" element={<WorkflowTasksPage />} />
                <Route path="alerts" element={<AlertsEscalationsPage />} />
                <Route path="radar" element={<RuleChangeRadarPage />} />
                <Route path="copilot" element={<CopilotPage />} />
                <Route path="reports" element={<ReportsAnalyticsPage />} />
                <Route path="audit" element={<AuditTrailPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
};

export default App;
