import React, { useState, useMemo } from 'react';
import { Search, Sparkles, User, Crown, Image, Video, Layers, Wand2 } from 'lucide-react';
import { ModelLogo } from './ModelLogo';
import { getModelsByCategory } from '../config/models';

const MAIN_CATEGORIES = [
  { key: 'image', label: '图片生成', icon: Image, color: '#42e6ff' },
  { key: 'video', label: '视频生成', icon: Video, color: '#f9ff72' },
  { key: 'retouch', label: '图片精修', icon: Wand2, color: '#ff4aa6' },
  { key: 'psdLayer', label: 'PSD分层', icon: Layers, color: '#a78bfa' }
];

export function CreativeDock({ activeCategory, onCategoryChange, currentModel, onModelChange }) {
  const [searchQuery, setSearchQuery] = useState('');

  const categoryModels = useMemo(() => {
    return getModelsByCategory(activeCategory);
  }, [activeCategory]);

  const filteredModels = useMemo(() => {
    if (!searchQuery.trim()) return categoryModels;
    const query = searchQuery.toLowerCase();
    return categoryModels.filter(m =>
      m.name.toLowerCase().includes(query) ||
      m.provider.toLowerCase().includes(query)
    );
  }, [categoryModels, searchQuery]);

  const handleModelSelect = (model) => {
    onModelChange(model.id);
  };

  const activeCatInfo = MAIN_CATEGORIES.find(c => c.key === activeCategory) || MAIN_CATEGORIES[0];

  return (
    <aside className="modelSidebar">
      <div className="modelSidebarHeader">
        <div className="sidebarLogo">
          <div className="sidebarLogoIcon">
            <Sparkles size={18} />
          </div>
          <div className="sidebarBrand">
            <span className="brandName">小马AI</span>
            <span className="brandSub">AI创作平台</span>
          </div>
        </div>
      </div>

      <div className="sidebarCategoryNav">
        {MAIN_CATEGORIES.map(cat => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.key;
          return (
            <button
              key={cat.key}
              className={`sidebarCatBtn ${isActive ? 'active' : ''}`}
              onClick={() => onCategoryChange(cat.key)}
              style={{ '--cat-color': cat.color }}
            >
              <Icon size={16} />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      <div className="sidebarSearch">
        <Search size={14} className="searchIcon" />
        <input
          type="text"
          className="searchInput"
          placeholder={`搜索${activeCatInfo.label}模型...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="sidebarSectionLabel">
        <span>{activeCatInfo.label}</span>
        <span className="sidebarSectionCount">{filteredModels.length}</span>
      </div>

      <div className="modelListContainer">
        <div className="modelList">
          {filteredModels.map(model => {
            const isSelected = currentModel === model.id;
            const successRate = model.successRate || 0;

            return (
              <div
                key={model.id}
                className={`modelListItem ${isSelected ? 'selected' : ''}`}
                onClick={() => handleModelSelect(model)}
              >
                <div className="modelListItemLeft">
                  <ModelLogo provider={model.provider} size={28} />
                  <div className="modelListItemInfo">
                    <div className="modelListItemTop">
                      <span className="modelName">{model.name}</span>
                    </div>
                    <div className="modelListItemMeta">
                      <span className="modelProvider">{model.provider}</span>
                      <span className={`successRateTag ${successRate >= 90 ? 'high' : successRate >= 80 ? 'medium' : 'low'}`}>
                        {successRate}%
                      </span>
                    </div>
                  </div>
                </div>
                {isSelected && (
                  <div className="selectedIndicator">✓</div>
                )}
              </div>
            );
          })}

          {filteredModels.length === 0 && (
            <div className="noResults">
              <Search size={24} />
              <span>未找到匹配的模型</span>
            </div>
          )}
        </div>
      </div>

      <div className="sidebarFooter">
        <div className="userSection">
          <div className="userAvatar">
            <User size={18} />
          </div>
          <div className="userInfo">
            <span className="userName">探索者</span>
            <span className="userPlan">免费版</span>
          </div>
          <button className="upgradeBtn">
            <Crown size={12} />
            <span>充值</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
