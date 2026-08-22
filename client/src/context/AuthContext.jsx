import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('dayflow_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('dayflow_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verifyAuth() {
      if (token) {
        try {
          const res = await api.getMe();
          if (res.success) {
            setUser(res.user);
            localStorage.setItem('dayflow_user', JSON.stringify(res.user));
          }
        } catch (err) {
          console.error('Session expired:', err);
          logout();
        }
      }
      setLoading(false);
    }
    verifyAuth();
  }, [token]);

  const login = async (email, password) => {
    const res = await api.login({ email, password });
    if (res.success) {
      localStorage.setItem('dayflow_token', res.token);
      localStorage.setItem('dayflow_user', JSON.stringify(res.user));
      setToken(res.token);
      setUser(res.user);
      return res.user;
    }
  };

  const register = async (formData) => {
    const res = await api.register(formData);
    if (res.success) {
      localStorage.setItem('dayflow_token', res.token);
      localStorage.setItem('dayflow_user', JSON.stringify(res.user));
      setToken(res.token);
      setUser(res.user);
      return res.user;
    }
  };

  const logout = () => {
    localStorage.removeItem('dayflow_token');
    localStorage.removeItem('dayflow_user');
    setToken(null);
    setUser(null);
  };

  const updateUserState = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('dayflow_user', JSON.stringify(updatedUser));
  };

  const isAdmin = user?.role === 'ADMIN';
  const isHr = user?.role === 'HR';
  const isPrivileged = isAdmin || isHr;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        updateUserState,
        isAdmin,
        isHr,
        isPrivileged,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
