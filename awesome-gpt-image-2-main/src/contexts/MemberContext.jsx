import React, { createContext, useContext, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getPlanById, canUseFeature, getAvailableModels } from '../config/membership';

const MemberContext = createContext(null);

const IS_DEMO = !import.meta.env.VITE_API_URL;

export function MemberProvider({ children }) {
  const { user, getAuthHeaders } = useAuth();
  const [membership, setMembership] = useState(() => {
    try {
      const stored = localStorage.getItem('membership_status');
      return stored ? JSON.parse(stored) : { planId: 'free', expiresAt: null, status: 'active' };
    } catch {
      return { planId: 'free', expiresAt: null, status: 'active' };
    }
  });

  const currentPlan = getPlanById(membership.planId);
  const isExpired = membership.expiresAt && new Date(membership.expiresAt) < new Date();
  const isActive = (membership.status === 'active' || membership.cancelAtPeriodEnd) && !isExpired;

  const updateMembership = useCallback((data) => {
    setMembership((prev) => {
      const newMembership = { ...prev, ...data };
      localStorage.setItem('membership_status', JSON.stringify(newMembership));
      return newMembership;
    });
  }, []);

  const canUse = useCallback((feature, value) => {
    return canUseFeature(membership.planId, feature, value);
  }, [membership.planId]);

  const getModels = useCallback((category) => {
    return getAvailableModels(membership.planId, category);
  }, [membership.planId]);

  const subscribe = useCallback(async (planId, paymentMethod) => {
    try {
      if (IS_DEMO) {
        await new Promise(r => setTimeout(r, 800));
        const plan = getPlanById(planId);
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 1);
        updateMembership({ planId, status: 'active', expiresAt: expiresAt.toISOString() });
        return { success: true, data: { planId, expiresAt: expiresAt.toISOString() } };
      }
      const response = await fetch('/api/membership/subscribe', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ planId, paymentMethod })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || '订阅失败');
      updateMembership({ planId, status: 'active', expiresAt: data.expiresAt });
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [getAuthHeaders, updateMembership]);

  const cancelSubscription = useCallback(async () => {
    try {
      if (IS_DEMO) {
        await new Promise(r => setTimeout(r, 500));
        updateMembership({ status: 'cancelled', cancelAtPeriodEnd: true });
        return { success: true };
      }
      const response = await fetch('/api/membership/cancel', {
        method: 'POST',
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || '取消失败');
      updateMembership({ status: 'cancelled', cancelAtPeriodEnd: true });
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [getAuthHeaders, updateMembership]);

  const value = {
    membership,
    currentPlan,
    isActive: isActive,
    isExpired,
    cancelAtPeriodEnd: membership.cancelAtPeriodEnd || false,
    canUse,
    getModels,
    subscribe,
    cancelSubscription,
    updateMembership
  };

  return (
    <MemberContext.Provider value={value}>
      {children}
    </MemberContext.Provider>
  );
}

export function useMember() {
  const context = useContext(MemberContext);
  if (!context) throw new Error('useMember must be used within MemberProvider');
  return context;
}
