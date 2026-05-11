import React, { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';
const USER_KEY = 'auth_user';

const DEMO_ACCOUNTS = {
  'admin@ai.com': {
    password: 'admin123',
    user: { id: 1, email: 'admin@ai.com', nickname: '管理员', role: 'admin', avatar: null, phone: '138****8888', registeredAt: '2024-01-01' }
  },
  'test@ai.com': {
    password: 'test123',
    user: { id: 2, email: 'test@ai.com', nickname: '测试用户', role: 'user', avatar: null, phone: '139****6666', registeredAt: '2024-03-15' },
    initialCredits: 100.00
  },
  'demo@ai.com': {
    password: 'demo123',
    user: { id: 3, email: 'demo@ai.com', nickname: '演示体验用户', role: 'user', avatar: null, phone: '137****1234', registeredAt: '2024-05-01' },
    initialCredits: 50.00
  }
};

const IS_DEMO = !import.meta.env.VITE_API_URL;

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
      if (IS_DEMO) {
        await new Promise(r => setTimeout(r, 600));

        const demoAccount = DEMO_ACCOUNTS[email.toLowerCase()];
        if (demoAccount) {
          if (demoAccount.password !== password) {
            throw new Error('密码错误');
          }
          const demoToken = 'demo_token_' + Date.now();
          saveAuth(demoAccount.user, demoToken, 'demo_refresh_' + Date.now());

          const hasCredits = localStorage.getItem('credits_balance');
          if (!hasCredits && demoAccount.initialCredits) {
            localStorage.setItem('credits_balance', String(demoAccount.initialCredits));
          }

          return { success: true, user: demoAccount.user };
        }

        if (email && password.length >= 4) {
          const newUser = { id: Date.now(), email, nickname: email.split('@')[0], role: 'user', avatar: null, registeredAt: new Date().toISOString().split('T')[0] };
          const demoToken = 'demo_token_' + Date.now();
          saveAuth(newUser, demoToken, 'demo_refresh_' + Date.now());
          localStorage.setItem('credits_balance', '2.00');
          return { success: true, user: newUser };
        }

        throw new Error('邮箱或密码错误');
      }
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || '登录失败');
      }
      saveAuth(data.user, data.token, data.refreshToken);
      return { success: true, user: data.user };
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
      if (IS_DEMO) {
        await new Promise(r => setTimeout(r, 600));
        const newUser = {
          id: Date.now(),
          email: userData.email,
          nickname: userData.nickname || userData.email.split('@')[0],
          phone: userData.phone,
          role: 'user',
          avatar: null,
          registeredAt: new Date().toISOString().split('T')[0]
        };
        const demoToken = 'demo_token_' + Date.now();
        saveAuth(newUser, demoToken, 'demo_refresh_' + Date.now());
        localStorage.setItem('credits_balance', '2.00');
        return { success: true, user: newUser };
      }
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || '注册失败');
      }
      saveAuth(data.user, data.token, data.refreshToken);
      return { success: true, user: data.user };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, [saveAuth]);

  const logout = useCallback(async () => {
    if (!IS_DEMO) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch { /* ignore */ }
    }
    clearAuth();
  }, [token, clearAuth]);

  const refreshTokenFn = useCallback(async () => {
    if (IS_DEMO) return true;
    const rt = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!rt) {
      clearAuth();
      return false;
    }
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: rt })
      });
      const data = await response.json();
      if (!response.ok) {
        clearAuth();
        return false;
      }
      saveAuth(data.user, data.token, data.refreshToken);
      return true;
    } catch {
      clearAuth();
      return false;
    }
  }, [saveAuth, clearAuth]);

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
    updateProfile,
    getAuthHeaders,
    clearError: () => setError(null),
    isDemo: IS_DEMO,
    demoAccounts: DEMO_ACCOUNTS
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
