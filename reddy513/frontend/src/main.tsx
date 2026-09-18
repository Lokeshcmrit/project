import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './store/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import RegisterPage from './pages/RegisterPage';
import RoleSelectPage from './pages/RoleSelectPage';
import LoginPage from './pages/LoginPage';
import UserDashboard from './pages/dashboards/UserDashboard';
import AdminDashboard from './pages/dashboards/AdminDashboard';
import DepartmentDashboard from './pages/dashboards/DepartmentDashboard';

import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/select-role" element={<RoleSelectPage />} />
          <Route path="/login/admin" element={<LoginPage role="admin" />} />
          <Route path="/login/user" element={<LoginPage role="user" />} />
          <Route path="/login/department" element={<LoginPage role="department" />} />

          {/* Protected: Loco Pilot */}
          <Route
            path="/dashboard/user/*"
            element={
              <ProtectedRoute allowedRoles={['USER_PILOT']}>
                <UserDashboard />
              </ProtectedRoute>
            }
          />

          {/* Protected: Admin */}
          <Route
            path="/dashboard/admin/*"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Protected: Department */}
          <Route
            path="/dashboard/department/*"
            element={
              <ProtectedRoute allowedRoles={['DEPARTMENT']}>
                <DepartmentDashboard />
              </ProtectedRoute>
            }
          />

          {/* Default */}
          <Route path="/" element={<Navigate to="/select-role" replace />} />
          <Route path="*" element={<Navigate to="/select-role" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
