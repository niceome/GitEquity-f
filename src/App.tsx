import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import OAuthCallbackPage from './pages/OAuthCallbackPage'
import ProjectsPage from './pages/ProjectsPage'
import DashboardPage from './pages/DashboardPage'
import ContributionsPage from './pages/ContributionsPage'
import ContractPage from './pages/ContractPage'
import SettingsPage from './pages/SettingsPage'

function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/oauth/callback" element={<OAuthCallbackPage />} />

      {/* Protected */}
      <Route
        path="/projects"
        element={<ProtectedRoute><ProjectsPage /></ProtectedRoute>}
      />
      <Route
        path="/projects/:id"
        element={<ProtectedRoute><DashboardPage /></ProtectedRoute>}
      />
      <Route
        path="/projects/:id/contributions"
        element={<ProtectedRoute><ContributionsPage /></ProtectedRoute>}
      />
      <Route
        path="/projects/:id/contracts/:contractId"
        element={<ProtectedRoute><ContractPage /></ProtectedRoute>}
      />
      <Route
        path="/projects/:id/settings"
        element={<ProtectedRoute><SettingsPage /></ProtectedRoute>}
      />

      {/* Fallback */}
      <Route path="/" element={<Navigate to="/projects" replace />} />
      <Route path="*" element={<Navigate to="/projects" replace />} />
    </Routes>
  )
}

export default App
