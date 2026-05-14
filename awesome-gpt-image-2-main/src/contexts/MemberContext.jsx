import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { getPlanById, canUseFeature, getAvailableModels } from '../config/membership';
import { API_BASE } from '../config/api';

const MemberContext = createContext(null);

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

  useEffect(() => {
    if (user?.membership) {
      const planId = user.membership || 'free';
      const expiresAt = user.membershipExpire || null;
      setMembership({ planId, status: 'active', expiresAt });
      localStorage.setItem('membership_status', JSON.stringify({ planId, status: 'active', expiresAt }));
    }
  }, [user]);

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
      const response = await fetch(`${API_BASE}/api/payments/recharge/create`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ type: 'membership', planId, paymentMethod })
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || '订阅失败');
      const plan = getPlanById(planId);
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1);
      updateMembership({ planId, status: 'active', expiresAt: expiresAt.toISOString() });
      return { success: true, data: { planId, expiresAt: expiresAt.toISOString() } };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [getAuthHeaders, updateMembership]);

  const cancelSubscription = useCallback(async () => {
    try {
      updateMembership({ status: 'cancelled', cancelAtPeriodEnd: true });
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [updateMembership]);

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
