import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';

interface Props {
  children: React.ReactNode;
  allowedRoles: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: Props) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050b14] flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">🚆</div>
          <p className="text-slate-400 text-sm">Authenticating…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/select-role" state={{ from: location }} replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    // Redirect to correct dashboard
    const dashMap: Record<string, string> = {
      ADMIN: '/dashboard/admin',
      DEPARTMENT: '/dashboard/department',
      USER_PILOT: '/dashboard/user',
    };
    return <Navigate to={dashMap[user.role] || '/select-role'} replace />;
  }

  return <>{children}</>;
}
