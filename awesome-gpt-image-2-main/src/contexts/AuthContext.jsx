import React, { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';
const USER_KEY = 'auth_user';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

const HAS_BACKEND = true;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem(USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const isAuthenticated = !!token && !!user;

  const saveAuth = useCallback((userData, accessToken, refreshToken) => {
    setUser(userData);
    setToken(accessToken);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    localStorage.setItem(TOKEN_KEY, accessToken);
    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
  }, []);

  const clearAuth = useCallback(() => {
    setUser(null);
    setToken('');
    setError(null);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem('credits_balance');
    localStorage.removeItem('membership_status');
    localStorage.removeItem('credits_history');
    localStorage.removeItem('last_check_in');
  }, []);

  const login = useCallback(async (email, password) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || '登录失败');
      }
      saveAuth(data.data.user, data.data.accessToken, data.data.refreshToken);
      return { success: true, user: data.data.user };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, [saveAuth]);

  const register = useCallback(async (userData) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userData.email,
          password: userData.password,
          nickname: userData.nickname || userData.email?.split('@')[0]
        })
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || '注册失败');
      }
      saveAuth(data.data.user, data.data.accessToken, data.data.refreshToken);
      return { success: true, user: data.data.user };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, [saveAuth]);

  const logout = useCallback(async () => {
    clearAuth();
  }, [clearAuth]);

  const refreshTokenFn = useCallback(async () => {
    const rt = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!rt) {
      clearAuth();
      return false;
    }
    try {
      const response = await fetch(`${API_BASE}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: rt })
      });
      const data = await response.json();
      if (!data.success) {
        clearAuth();
        return false;
      }
      localStorage.setItem(TOKEN_KEY, data.data.accessToken);
      if (data.data.refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, data.data.refreshToken);
      }
      setToken(data.data.accessToken);
      return true;
    } catch {
      clearAuth();
      return false;
    }
  }, [clearAuth]);

  const fetchMe = useCallback(async () => {
    if (!token) return null;
    try {
      const response = await fetch(`${API_BASE}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setUser(data.data);
        localStorage.setItem(USER_KEY, JSON.stringify(data.data));
        return data.data;
      }
      return null;
    } catch {
      return null;
    }
  }, [token]);

  const updateProfile = useCallback((updates) => {
    setUser((prev) => {
      const updated = { ...prev, ...updates };
      localStorage.setItem(USER_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const getAuthHeaders = useCallback(() => {
    return token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
  }, [token]);

  const value = {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    refreshToken: refreshTokenFn,
    fetchMe,
    updateProfile,
    getAuthHeaders,
    clearError: () => setError(null),
    hasBackend: HAS_BACKEND
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
