import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api, setAuthToken, clearAuthToken } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: str) => Promise<void>;
  logout: () => void;
  switchDemoRole: (role: UserRole) => Promise<void>;
}

const DEMO_CREDENTIALS: Record<UserRole, { email: string; pass: string }> = {
  'College Administrator': { email: 'admin@institution.edu', pass: 'Admin@123' },
  'Department Coordinator': { email: 'faculty.cs@institution.edu', pass: 'Faculty@123' },
  'AICTE Reviewing Officer': { email: 'officer@aicte.gov.in', pass: 'Officer@123' },
  'Senior Approving Authority': { email: 'senior@aicte.gov.in', pass: 'Senior@123' },
  'Auditor': { email: 'auditor@qualitycouncil.org', pass: 'Auditor@123' },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadUser() {
      const savedUser = localStorage.getItem('smartcomply_user');
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
          const fresh = await api.getMe();
          setUser(fresh);
          localStorage.setItem('smartcomply_user', JSON.stringify(fresh));
        } catch (err) {
          console.warn('Session verification failed, logging out', err);
          clearAuthToken();
          setUser(null);
        }
      }
      setLoading(false);
    }
    loadUser();
  }, []);

  const login = async (email: string, password: str) => {
    setLoading(true);
    try {
      const resp = await api.login({ email, password });
      setAuthToken(resp.access_token);
      setUser(resp.user);
      localStorage.setItem('smartcomply_user', JSON.stringify(resp.user));
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    clearAuthToken();
    setUser(null);
    window.location.href = '/login';
  };

  const switchDemoRole = async (role: UserRole) => {
    const creds = DEMO_CREDENTIALS[role];
    if (creds) {
      await login(creds.email, creds.pass);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, switchDemoRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
