﻿﻿﻿import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
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

function roundToCents(amount) {
  return Math.round(amount * 100) / 100;
}

export function CreditsProvider({ children }) {
  const { user, isAuthenticated, getAuthHeaders } = useAuth();
  const [balance, setBalance] = useState(() => {
    try {
      const stored = localStorage.getItem('credits_balance');
      return stored ? roundToCents(Number(stored)) : 0;
    } catch { return 0; }
  });
  const [history, setHistory] = useState(() => loadHistory());
  const [isLoading, setIsLoading] = useState(false);
  const [checkedInToday, setCheckedInToday] = useState(() => isCheckedInToday());

  const updateBalance = useCallback((newBalance) => {
    const rounded = roundToCents(newBalance);
    setBalance(rounded);
    localStorage.setItem('credits_balance', String(rounded));
  }, []);

  const addHistory = useCallback((amount, description, metadata = {}) => {
    const tx = {
      id: Date.now() + Math.random(),
      amount: roundToCents(amount),
      description,
      createdAt: new Date().toISOString(),
      type: amount > 0 ? 'earn' : 'spend',
      ...metadata
    };
    setHistory((prev) => {
      const updated = [tx, ...prev];
      saveHistory(updated);
      return updated;
    });
  }, []);

  const fetchBalance = useCallback(async () => {
    if (IS_DEMO && isAuthenticated) {
      const stored = localStorage.getItem('credits_balance');
      const balanceVal = stored ? roundToCents(Number(stored)) : 0;
      setBalance(balanceVal);
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
    const deductAmount = roundToCents(amount);
    if (balance < deductAmount) {
      return { success: false, error: '算力不足', needRecharge: true };
    }
    try {
      if (IS_DEMO) {
        await new Promise(r => setTimeout(r, 300));
        const newBalance = roundToCents(balance - deductAmount);
        updateBalance(newBalance);
        addHistory(-deductAmount, description || '算力消费', { referenceType, referenceId });
        return { success: true, balance: newBalance };
      }
      const response = await fetch('/api/credits/deduct', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ amount: deductAmount, description, referenceType, referenceId })
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
      return { success: false, error: `算力不足，需要 ${cost.toFixed(2)} 算力，当前余额 ${balance.toFixed(2)} 算力`, needRecharge: true, cost };
    }
    return { success: true, cost, canDeduct: true };
  }, [balance]);

  const recharge = useCallback(async (packId, paymentMethod = 'wechat') => {
    try {
      if (IS_DEMO) {
        await new Promise(r => setTimeout(r, 800));
        const pack = CREDITS_RULES.packs.find(p => p.id === packId);
        if (!pack) throw new Error('算力包不存在');
        if (pack.price !== pack.credits) {
          console.warn('算力包价格与算力不是1:1比例', pack);
        }
        const totalCredits = roundToCents(pack.credits + pack.bonus);
        const newBalance = roundToCents(balance + totalCredits);
        updateBalance(newBalance);
        addHistory(totalCredits, `购买${pack.label}${pack.bonus > 0 ? `（含赠送${pack.bonus.toFixed(2)}）` : ''}`, { paymentMethod, packId, price: pack.price });
        return { success: true, data: { balance: newBalance, credits: totalCredits, price: pack.price } };
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
        const earned = CREDITS_RULES.earning.dailyCheckIn;
        const newBalance = roundToCents(balance + earned);
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
    const roundedAmount = roundToCents(amount);
    const newBalance = roundToCents(balance + roundedAmount);
    updateBalance(newBalance);
    addHistory(roundedAmount, description);
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
