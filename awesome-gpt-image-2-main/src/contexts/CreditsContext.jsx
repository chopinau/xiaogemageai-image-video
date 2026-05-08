import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { calculateCreditsCost, CREDITS_RULES } from '../config/credits';

const CreditsContext = createContext(null);

const IS_DEMO = !import.meta.env.VITE_API_URL;

function loadHistory() {
  try {
    const stored = localStorage.getItem('credits_history');
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
}

function saveHistory(history) {
  try {
    const toSave = history.slice(0, 100);
    localStorage.setItem('credits_history', JSON.stringify(toSave));
  } catch { /* ignore */ }
}

function isCheckedInToday() {
  try {
    const lastCheckIn = localStorage.getItem('last_check_in');
    if (!lastCheckIn) return false;
    const last = new Date(lastCheckIn);
    const now = new Date();
    return last.getFullYear() === now.getFullYear() && last.getMonth() === now.getMonth() && last.getDate() === now.getDate();
  } catch { return false; }
}

export function CreditsProvider({ children }) {
  const { user, isAuthenticated, getAuthHeaders } = useAuth();
  const [balance, setBalance] = useState(() => {
    try {
      return Number(localStorage.getItem('credits_balance')) || 0;
    } catch { return 0; }
  });
  const [history, setHistory] = useState(() => loadHistory());
  const [isLoading, setIsLoading] = useState(false);
  const [checkedInToday, setCheckedInToday] = useState(() => isCheckedInToday());

  const updateBalance = useCallback((newBalance) => {
    setBalance(newBalance);
    localStorage.setItem('credits_balance', String(newBalance));
  }, []);

  const addHistory = useCallback((amount, description) => {
    const tx = {
      id: Date.now() + Math.random(),
      amount,
      description,
      createdAt: new Date().toISOString(),
      type: amount > 0 ? 'earn' : 'spend'
    };
    setHistory((prev) => {
      const updated = [tx, ...prev];
      saveHistory(updated);
      return updated;
    });
  }, []);

  const fetchBalance = useCallback(async () => {
    if (IS_DEMO && isAuthenticated) {
      const stored = Number(localStorage.getItem('credits_balance')) || 0;
      setBalance(stored);
      return;
    }
    try {
      const response = await fetch('/api/credits/balance', { headers: getAuthHeaders() });
      if (response.ok) {
        const data = await response.json();
        updateBalance(data.balance);
      }
    } catch { /* use cached value */ }
  }, [getAuthHeaders, updateBalance, isAuthenticated]);

  const deduct = useCallback(async (amount, description, referenceType, referenceId) => {
    if (balance < amount) {
      return { success: false, error: '积分不足', needRecharge: true };
    }
    try {
      if (IS_DEMO) {
        await new Promise(r => setTimeout(r, 300));
        const newBalance = balance - amount;
        updateBalance(newBalance);
        addHistory(-amount, description || '积分消费');
        return { success: true, balance: newBalance };
      }
      const response = await fetch('/api/credits/deduct', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ amount, description, referenceType, referenceId })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || '扣减失败');
      updateBalance(data.balanceAfter);
      return { success: true, balance: data.balanceAfter };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [balance, getAuthHeaders, updateBalance, addHistory]);

  const checkAndDeduct = useCallback(async (type, model, resolution, options = {}) => {
    const cost = calculateCreditsCost(type, model, resolution, options);
    if (balance < cost) {
      return { success: false, error: `积分不足，需要 ${cost} 积分，当前余额 ${balance} 积分`, needRecharge: true, cost };
    }
    return { success: true, cost, canDeduct: true };
  }, [balance]);

  const recharge = useCallback(async (packId, paymentMethod) => {
    try {
      if (IS_DEMO) {
        await new Promise(r => setTimeout(r, 800));
        const pack = CREDITS_RULES.packs.find(p => p.id === packId);
        if (!pack) throw new Error('积分包不存在');
        const totalCredits = pack.credits + pack.bonus;
        const newBalance = balance + totalCredits;
        updateBalance(newBalance);
        addHistory(totalCredits, `购买${pack.label}${pack.bonus > 0 ? `（含赠送${pack.bonus}）` : ''}`);
        return { success: true, data: { balance: newBalance, credits: totalCredits } };
      }
      const response = await fetch('/api/credits/recharge', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ packId, paymentMethod })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || '充值失败');
      await fetchBalance();
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [balance, getAuthHeaders, fetchBalance, updateBalance, addHistory]);

  const checkIn = useCallback(async () => {
    if (checkedInToday) {
      return { success: false, error: '今日已签到' };
    }
    try {
      if (IS_DEMO) {
        await new Promise(r => setTimeout(r, 500));
        const earned = 2;
        const newBalance = balance + earned;
        updateBalance(newBalance);
        addHistory(earned, '每日签到');
        const now = new Date().toISOString();
        localStorage.setItem('last_check_in', now);
        setCheckedInToday(true);
        return { success: true, earned, balance: newBalance };
      }
      const response = await fetch('/api/credits/check-in', {
        method: 'POST',
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || '签到失败');
      updateBalance(data.balanceAfter);
      setCheckedInToday(true);
      return { success: true, earned: data.earned, balance: data.balanceAfter };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [balance, checkedInToday, getAuthHeaders, updateBalance, addHistory]);

  const grantCredits = useCallback((amount, description) => {
    const newBalance = balance + amount;
    updateBalance(newBalance);
    addHistory(amount, description);
    return { success: true, balance: newBalance };
  }, [balance, updateBalance, addHistory]);

  const fetchHistory = useCallback(async (page = 1, limit = 20) => {
    setIsLoading(true);
    try {
      if (IS_DEMO) {
        await new Promise(r => setTimeout(r, 300));
        setIsLoading(false);
        return { transactions: history, total: history.length };
      }
      const response = await fetch(`/api/credits/history?page=${page}&limit=${limit}`, { headers: getAuthHeaders() });
      if (response.ok) {
        const data = await response.json();
        setHistory(data.transactions || []);
        setIsLoading(false);
        return data;
      }
    } catch { /* ignore */ }
    setIsLoading(false);
  }, [getAuthHeaders, history]);

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
    hasEnough: (amount) => balance >= amount
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
