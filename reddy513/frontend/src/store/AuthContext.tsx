import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '../api/client';
import { joinRooms, disconnectSocket } from '../sockets/socket';

interface User {
  id: string;
  fullName: string;
  employeeId: string;
  email: string;
  role: 'ADMIN' | 'DEPARTMENT' | 'USER_PILOT';
  department?: string | null;
  assignedTrainId?: string | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('railsync_token');
    const storedUser = localStorage.getItem('railsync_user');
    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
        joinRooms(parsedUser.role, parsedUser.department, parsedUser.id);
      } catch { /* ignore malformed */ }
    }
    setIsLoading(false);
  }, []);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('railsync_token', newToken);
    localStorage.setItem('railsync_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    joinRooms(newUser.role, newUser.department || undefined, newUser.id);
  };

  const logout = () => {
    localStorage.removeItem('railsync_token');
    localStorage.removeItem('railsync_user');
    setToken(null);
    setUser(null);
    disconnectSocket();
  };

  const updateUser = (updated: User) => {
    localStorage.setItem('railsync_user', JSON.stringify(updated));
    setUser(updated);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
