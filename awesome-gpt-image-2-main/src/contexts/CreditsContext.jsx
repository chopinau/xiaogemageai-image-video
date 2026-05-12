import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { calculateCreditsCost, CREDITS_RULES } from '../config/credits';

const CreditsContext = createContext(null);

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

function roundToCents(amount) {
  return Math.round(amount * 100) / 100;
}

export function CreditsProvider({ children }) {
  const { user, isAuthenticated, token, getAuthHeaders } = useAuth();
  const [balance, setBalance] = useState(() => {
    try {
      const stored = localStorage.getItem('credits_balance');
      return stored ? roundToCents(Number(stored)) : 0;
    } catch { return 0; }
  });
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [checkedInToday, setCheckedInToday] = useState(false);

  const updateBalance = useCallback((newBalance) => {
    const rounded = roundToCents(newBalance);
    setBalance(rounded);
    localStorage.setItem('credits_balance', String(rounded));
  }, []);

  const fetchBalance = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE}/api/credits/balance`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          updateBalance(data.data.balance);
        }
      }
    } catch { /* use cached value */ }
  }, [token, updateBalance]);

  const deduct = useCallback(async (amount, description, referenceType, referenceId) => {
    const deductAmount = roundToCents(amount);
    if (balance < deductAmount) {
      return { success: false, error: '算力不足', needRecharge: true };
    }
    try {
      const response = await fetch(`${API_BASE}/api/credits/deduct`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ amount: deductAmount, description: description || '算力消费', relatedId: referenceId })
      });
      const data = await response.json();
      if (!data.success) {
        return { success: false, error: data.error, needRecharge: data.needRecharge };
      }
      updateBalance(data.data.balance);
      return { success: true, balance: data.data.balance };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [balance, getAuthHeaders, updateBalance]);

  const checkAndDeduct = useCallback(async (type, model, resolution, options = {}) => {
    const cost = calculateCreditsCost(type, model, resolution, options);
    if (balance < cost) {
      return { success: false, error: `算力不足，需要 ${cost.toFixed(2)} 算力，当前余额 ${balance.toFixed(2)} 算力`, needRecharge: true, cost };
    }
    return { success: true, cost, canDeduct: true };
  }, [balance]);

  const recharge = useCallback(async (packId, paymentMethod = 'wechat') => {
    try {
      const pack = CREDITS_RULES.packs.find(p => p.id === packId);
      if (!pack) throw new Error('算力包不存在');

      const response = await fetch(`${API_BASE}/api/payments/recharge/create`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ packId, paymentMethod, amount: pack.price, credits: pack.credits + pack.bonus })
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || '充值失败');
      await fetchBalance();
      return { success: true, data: data.data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [getAuthHeaders, fetchBalance]);

  const checkIn = useCallback(async () => {
    if (checkedInToday) {
      return { success: false, error: '今日已签到' };
    }
    try {
      const response = await fetch(`${API_BASE}/api/credits/check-in`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (!data.success) {
        if (data.data?.message === '今日已签到') setCheckedInToday(true);
        return { success: false, error: data.error || data.data?.message };
      }
      updateBalance(data.data.balance);
      setCheckedInToday(true);
      return { success: true, earned: data.data.reward, balance: data.data.balance };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [checkedInToday, getAuthHeaders, updateBalance]);

  const grantCredits = useCallback((amount, description) => {
    const roundedAmount = roundToCents(amount);
    const newBalance = roundToCents(balance + roundedAmount);
    updateBalance(newBalance);
    return { success: true, balance: newBalance };
  }, [balance, updateBalance]);

  const fetchHistory = useCallback(async (page = 1, limit = 20) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/credits/history?page=${page}&limit=${limit}`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setHistory(data.data.entries || []);
          setIsLoading(false);
          return data.data;
        }
      }
    } catch { /* ignore */ }
    setIsLoading(false);
  }, [getAuthHeaders]);

  const value = {
    balance,
    history,
    isLoading,
    checkedInToday,
    fetchBalance,
    deduct,
    checkAndDeduct,
    recharge,
    checkIn,
    grantCredits,
    fetchHistory,
    hasEnough: (amount) => balance >= roundToCents(amount),
    formatBalance: (amount = balance) => amount.toFixed(2)
  };

  return (
    <CreditsContext.Provider value={value}>
      {children}
    </CreditsContext.Provider>
  );
}

export function useCredits() {
  const context = useContext(CreditsContext);
  if (!context) throw new Error('useCredits must be used within CreditsProvider');
  return context;
}
