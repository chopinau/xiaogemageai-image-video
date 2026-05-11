import React, { useState, useEffect } from 'react';
import { X, Zap, TrendingUp, Shield, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { getModelPricing, getActiveGroups, formatPrice, calculateFinalPrice, getGroupTypeLabel, clearPricingCache } from '../services/pricingService';
import { API_KEY_PROFILES, getActiveProfile, setActiveProfile } from '../config/apiKeys';

const STRATEGY_ICONS = {
  economy: TrendingUp,
  balanced: Shield,
  premium: Zap
};

export function ChannelGroupSelector({ modelName, currentParams, onClose, onProfileChange }) {
  const [pricing, setPricing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeProfile, setCurrentProfile] = useState(getActiveProfile());
  const [showAllGroups, setShowAllGroups] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await getModelPricing(modelName);
      setPricing(data);
      setLoading(false);
    }
    load();
  }, [modelName]);

  const handleRefresh = async () => {
    clearPricingCache();
    setLoading(true);
    const data = await getModelPricing(modelName);
    setPricing(data);
    setLoading(false);
  };

  const handleProfileChange = (profileId) => {
    const profile = API_KEY_PROFILES[profileId];
    setCurrentProfile(profile);
    setActiveProfile(profileId);
    onProfileChange?.(profileId);
  };

  const activeGroups = pricing ? getActiveGroups(pricing) : [];
  const allGroups = pricing?.channel_groups || [];

  return (
    <div className="channelGroupOverlay" onClick={onClose}>
      <div className="channelGroupPanel" onClick={e => e.stopPropagation()}>
        <div className="cgpHeader">
          <div className="cgpTitle">
            <span>渠道策略 & 价格</span>
            <span className="cgpModelName">{pricing?.display_name || modelName}</span>
          </div>
          <div className="cgpHeaderActions">
            <button className="cgpRefreshBtn" onClick={handleRefresh} title="刷新价格">
              <RefreshCw size={14} className={loading ? 'spinning' : ''} />
            </button>
            <button className="cgpClose" onClick={onClose}>
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="cgpStrategySection">
          <div className="cgpSectionLabel">选择策略</div>
          <div className="cgpStrategyGrid">
            {Object.entries(API_KEY_PROFILES).map(([id, profile]) => {
              const Icon = STRATEGY_ICONS[id];
              const isActive = activeProfile.id === id;
              return (
                <button
                  key={id}
                  className={`cgpStrategyBtn ${isActive ? 'active' : ''}`}
                  onClick={() => handleProfileChange(id)}
                  style={{ '--strategy-color': profile.color }}
                >
                  <span className="cgpStrategyIcon">{profile.icon}</span>
                  <span className="cgpStrategyLabel">{profile.label}</span>
                  <span className="cgpStrategyDesc">{profile.description}</span>
                  {isActive && <span className="cgpStrategyCheck">✓</span>}
                </button>
              );
            })}
          </div>
          <div className="cgpStrategyNote">
            💡 策略在 API Key 管理页面设置，系统自动路由到对应渠道分组
          </div>
        </div>

        {loading ? (
          <div className="cgpLoading">
            <RefreshCw size={20} className="spinning" />
            <span>加载价格数据...</span>
          </div>
        ) : !pricing ? (
          <div className="cgpError">无法获取价格数据</div>
        ) : (
          <div className="cgpPricingSection">
            <div className="cgpSectionLabel">
              可用渠道分组
              <span className="cgpGroupCount">{activeGroups.length} 个活跃 / {allGroups.length} 个总计</span>
            </div>

            <div className="cgpGroupList">
              {(showAllGroups ? allGroups : activeGroups).map((group, idx) => {
                const finalPrice = calculateFinalPrice(group, currentParams);
                const isCheapest = activeGroups.length > 1 && group.base_price === Math.min(...activeGroups.map(g => g.base_price));
                const isFastest = activeGroups.length > 1 && group.avg_response_seconds > 0 && group.avg_response_seconds === Math.min(...activeGroups.filter(g => g.avg_response_seconds > 0).map(g => g.avg_response_seconds));
                const typeInfo = getGroupTypeLabel(group);
                const isExpanded = expandedGroup === idx;
                const hasOptions = group.option_prices && group.option_prices.length > 0;

                return (
                  <div key={idx} className={`cgpGroupCard ${group.is_active === false ? 'inactive' : ''}`}>
                    <div className="cgpGroupHeader" onClick={() => setExpandedGroup(isExpanded ? null : idx)}>
                      <div className="cgpGroupHeaderLeft">
                        <span className="cgpGroupTypeBadge" style={{ background: typeInfo.color + '22', color: typeInfo.color }}>
                          {typeInfo.label}
                        </span>
                        <span className="cgpGroupName">{group.group_name}</span>
                      </div>
                      <div className="cgpGroupHeaderRight">
                        <div className="cgpGroupBadges">
                          {isCheapest && <span className="cgpBadge cheapest">最低价</span>}
                          {isFastest && <span className="cgpBadge fastest">最快</span>}
                          {group.is_active === false && <span className="cgpBadge inactive">已关闭</span>}
                        </div>
                        {hasOptions && (
                          <span className="cgpExpandIcon">
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="cgpGroupStats">
                      <div className="cgpStat">
                        <span className="cgpStatLabel">基础价格</span>
                        <span className="cgpStatValue price">{formatPrice(group.base_price)}/次</span>
                      </div>
                      {currentParams && Object.keys(currentParams).length > 0 && finalPrice !== group.base_price && (
                        <div className="cgpStat">
                          <span className="cgpStatLabel">当前参数价</span>
                          <span className="cgpStatValue price final">{formatPrice(finalPrice)}/次</span>
                        </div>
                      )}
                      <div className="cgpStat">
                        <span className="cgpStatLabel">成功率</span>
                        <span className={`cgpStatValue ${group.success_rate_24h >= 90 ? 'good' : group.success_rate_24h >= 70 ? 'ok' : 'bad'}`}>
                          {group.success_rate_24h > 0 ? `${group.success_rate_24h.toFixed(1)}%` : '--'}
                        </span>
                      </div>
                      <div className="cgpStat">
                        <span className="cgpStatLabel">平均耗时</span>
                        <span className="cgpStatValue">
                          {group.avg_response_seconds > 0 ? `${Math.round(group.avg_response_seconds)}s` : '--'}
                        </span>
                      </div>
                    </div>
                    {isExpanded && hasOptions && (
                      <div className="cgpOptionPrices">
                        <span className="cgpOptionLabel">参数加价明细</span>
                        <div className="cgpOptionList">
                          {group.option_prices.map((opt, i) => (
                            <div key={i} className="cgpOptionItem">
                              <span className="cgpOptionName">{opt.option_label || `${opt.param_name}=${opt.option_value}`}</span>
                              <span className="cgpOptionImpact">
                                {opt.price_multiplier && opt.price_multiplier !== 1 && `×${opt.price_multiplier}`}
                                {opt.price_addition && opt.price_addition > 0 && `+${formatPrice(opt.price_addition)}`}
                              </span>
                              <span className="cgpOptionFinal">{formatPrice(opt.final_price || (group.base_price * (opt.price_multiplier || 1) + (opt.price_addition || 0)))}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {allGroups.length > activeGroups.length && !showAllGroups && (
              <button className="cgpShowAll" onClick={() => setShowAllGroups(true)}>
                显示全部 {allGroups.length} 个分组（含已关闭）
              </button>
            )}
            {showAllGroups && (
              <button className="cgpShowAll" onClick={() => setShowAllGroups(false)}>
                仅显示活跃分组
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
