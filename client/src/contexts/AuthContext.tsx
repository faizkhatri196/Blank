import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, ServiceType } from '../types';
import { apiClient } from '../api/client';
import { clearCustomerLocation } from '../utils/customerLocation';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  activeServiceFilter: ServiceType | 'ALL';
  setActiveServiceFilter: (filter: ServiceType | 'ALL') => void;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('copilot_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('copilot_token'));
  const [isLoading, setIsLoading] = useState(true);
  const [activeServiceFilter, setActiveServiceFilter] = useState<ServiceType | 'ALL'>('ALL');

  useEffect(() => {
    async function checkAuth() {
      if (token) {
        try {
          const res = await apiClient.get('/auth/me');
          setUser(res.data.data.user);
          localStorage.setItem('copilot_user', JSON.stringify(res.data.data.user));
        } catch (e) {
          console.error('[Auth Error] Session invalid:', e);
          setUser(null);
          setToken(null);
          localStorage.removeItem('copilot_token');
          localStorage.removeItem('copilot_user');
        }
      }
      setIsLoading(false);
    }
    checkAuth();
  }, [token]);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('copilot_token', newToken);
    localStorage.setItem('copilot_user', JSON.stringify(newUser));
  };

  const logout = () => {
    // Clear guest-scoped location only. Do NOT wipe user-scoped location
    // (servora.customer.location.<userId>) — the customer's saved location should
    // persist across sessions so they don't need to re-select it on every login.
    clearCustomerLocation(); // clears guest key only
    setToken(null);
    setUser(null);
    localStorage.removeItem('copilot_token');
    localStorage.removeItem('copilot_user');
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        activeServiceFilter,
        setActiveServiceFilter,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
