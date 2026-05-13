import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { buildURL } from '../config/api';

const AgencyContext = createContext(null);

const DEFAULT_BRAND = {
  isAgency: false,
  agencyName: '小马AI',
  logoUrl: null,
  primaryColor: '#42e6ff',
  heroTitle: 'AI 创作工作台',
  heroSubtitle: '一站式图片 & 视频创作，多模型自由切换',
  footerText: null,
  hidePoweredBy: false,
  enabledModels: null,
  disabledFeatures: null
};

export function AgencyProvider({ children }) {
  const [brand, setBrand] = useState(DEFAULT_BRAND);
  const [loading, setLoading] = useState(true);

  const fetchBrand = useCallback(async () => {
    try {
      const res = await fetch(buildURL('/agency/config'));
      const data = await res.json();
      if (data.success && data.data) {
        setBrand(data.data);
        if (data.data.primaryColor) {
          document.documentElement.style.setProperty('--agency-primary', data.data.primaryColor);
        }
      }
    } catch {
      setBrand(DEFAULT_BRAND);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBrand();
  }, [fetchBrand]);

  const value = {
    brand,
    loading,
    isAgency: brand.isAgency,
    agencyName: brand.agencyName,
    logoUrl: brand.logoUrl,
    primaryColor: brand.primaryColor,
    heroTitle: brand.heroTitle,
    heroSubtitle: brand.heroSubtitle,
    refreshBrand: fetchBrand
  };

  return (
    <AgencyContext.Provider value={value}>
      {children}
    </AgencyContext.Provider>
  );
}

export function useAgency() {
  const ctx = useContext(AgencyContext);
  if (!ctx) throw new Error('useAgency must be used within AgencyProvider');
  return ctx;
}

export { DEFAULT_BRAND };
