import React, { useState, useEffect } from 'react';
import { X, Zap, TrendingUp, Shield } from 'lucide-react';
import { getAllModelPricings } from '../services/pricingService';
import { API_KEY_PROFILES, getActiveProfile, setActiveProfile } from '../config/apiKeys';
import { calculateComputeCost, formatCredits } from '../config/modelPricing';

const STRATEGIES = {
  economy: { ...API_KEY_PROFILES.economy, icon: TrendingUp, label: '经济', desc: '最低价格', markupPercent: 0 },
  balanced: { ...API_KEY_PROFILES.balanced, icon: Shield, label: '均衡', desc: '性价比最优', markupPercent: 15 },
  premium: { ...API_KEY_PROFILES.premium, icon: Zap, label: '品质', desc: '最高品质', markupPercent: 30 }
};

export function ChannelGroupSelector({ modelName, currentParams, onClose, onProfileChange }) {
  const [activeProfile, setCurrentProfile] = useState(getActiveProfile());
  const [pricingData, setPricingData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const data = await getAllModelPricings();
        if (mounted) setPricingData(data);
      } catch {}
      if (mounted) setLoading(false);
    }
    load();
    return () => { mounted = false; };
  }, []);

  const handleProfileChange = (profileId) => {
    const strategy = STRATEGIES[profileId];
    setCurrentProfile(strategy);
    setActiveProfile(profileId);
    onProfileChange?.(profileId);
  };

  const currentStrategy = Object.entries(STRATEGIES).find(([, s]) => s.id === activeProfile.id)?.[0] || 'balanced';
  const markup = STRATEGIES[currentStrategy]?.markupPercent || 15;

  const modelPricing = pricingData?.imageModels?.[modelName] || pricingData?.videoModels?.[modelName];
  const baseCredits = modelPricing ? calculateComputeCost(modelName, currentParams) : 0;
  const finalCredits = Math.round(baseCredits * (1 + markup / 100));

  return (
    <div className="channelGroupOverlay" onClick={onClose}>
      <div className="channelGroupPanel" onClick={e => e.stopPropagation()}>
        <div className="cgpHeader">
          <div className="cgpTitle">
            <span>选择模式</span>
            <span className="cgpModelName">{modelName}</span>
          </div>
          <button className="cgpClose" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="cgpStrategySection">
          <div className="cgpSectionLabel">选择策略模式</div>
          <div className="cgpStrategyGrid">
            {Object.entries(STRATEGIES).map(([id, strategy]) => {
              const Icon = strategy.icon;
              const isActive = currentStrategy === id;
              const sMarkup = strategy.markupPercent;
              const sCredits = Math.round(baseCredits * (1 + sMarkup / 100));
              return (
                <button
                  key={id}
                  className={`cgpStrategyBtn ${isActive ? 'active' : ''}`}
                  onClick={() => handleProfileChange(id)}
                  style={{ '--strategy-color': strategy.color }}
                >
                  <span className="cgpStrategyIcon"><Icon size={16} /></span>
                  <span className="cgpStrategyLabel">{strategy.label}</span>
                  <span className="cgpStrategyDesc">{strategy.desc}</span>
                  <span className="cgpStrategyPrice">{formatCredits(sCredits)} 算力</span>
                  {isActive && <span className="cgpStrategyCheck">✓</span>}
                </button>
              );
            })}
          </div>
        </div>

        <div className="cgpPriceBreakdown">
          <div className="cgpSectionLabel">预计消耗</div>
          <div className="cgpBreakdownCard">
            <div className="cgpBreakdownRow total">
              <span className="cgpBreakdownLabel">当前模式价格</span>
              <span className="cgpBreakdownValue" style={{ color: STRATEGIES[currentStrategy]?.color || '#42e6ff', fontSize: '18px', fontWeight: 700 }}>{formatCredits(finalCredits)} 算力</span>
            </div>
          </div>
        </div>

        <div className="cgpStrategyNote">
          💡 不同模式对应不同的渠道策略，系统自动匹配最优渠道
        </div>
      </div>
    </div>
  );
}
