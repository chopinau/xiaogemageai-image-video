import React from 'react';
import { NavLink } from 'react-router-dom';
import { MessageSquare, Image, Video, Layers, BookOpen, Sparkles, Wand2, Film } from 'lucide-react';
import { AI_MODELS, MODEL_CATEGORIES } from '../config/models';
import { ModelLogo } from './ModelLogo';

const CATEGORY_CONFIG = {
  image: {
    icon: Image,
    label: '图像生成',
    color: '#42e6ff',
    gradient: 'linear-gradient(135deg, rgba(66,230,255,0.15), rgba(120,255,185,0.08))'
  },
  video: {
    icon: Video,
    label: '视频生成',
    color: '#f9ff72',
    gradient: 'linear-gradient(135deg, rgba(249,255,114,0.15), rgba(255,180,50,0.08))'
  },
  text: {
    icon: MessageSquare,
    label: '文本对话',
    color: '#78ffb9',
    gradient: 'linear-gradient(135deg, rgba(120,255,185,0.15), rgba(66,230,255,0.08))'
  },
  retouch: {
    icon: Wand2,
    label: '图片精修',
    color: '#ff4aa6',
    gradient: 'linear-gradient(135deg, rgba(255,74,166,0.15), rgba(255,150,100,0.08))'
  },
  psdLayer: {
    icon: Layers,
    label: 'PSD分层',
    color: '#a78bfa',
    gradient: 'linear-gradient(135deg, rgba(167,139,250,0.15), rgba(139,92,246,0.08))'
  }
};

export function ModelSidebar({ currentModel, onModelChange, currentCategory, onCategoryChange }) {
  const categories = Object.entries(MODEL_CATEGORIES).filter(([key]) => key !== 'text');

  return (
    <nav className="modelSidebarV2">
      <div className="modelSidebarV2Header">
        <div className="modelSidebarV2Logo">
          <Sparkles size={18} />
        </div>
        <span>创作工具</span>
      </div>

      {categories.map(([catKey, catLabel]) => {
        const models = Object.values(AI_MODELS[catKey] || {}).filter(m => m.enabled);
        const catConfig = CATEGORY_CONFIG[catKey];
        const Icon = catConfig?.icon || Sparkles;
        const isActive = currentCategory === catKey;

        return (
          <div key={catKey} className={`modelCatV2 ${isActive ? 'active' : ''}`}>
            <div
              className="modelCatV2Header"
              onClick={() => onCategoryChange(catKey)}
              style={{ '--cat-color': catConfig?.color }}
            >
              <Icon size={16} style={{ color: isActive ? catConfig?.color : undefined }} />
              <span>{catLabel.label.zh}</span>
              <span className="modelCatCount">{models.length}</span>
            </div>

            {isActive && models.length > 0 && (
              <div className="modelListV2">
                {models.map(model => {
                  const isSelected = currentModel === model.id;
                  return (
                    <div
                      key={model.id}
                      className={`modelItemV2 ${isSelected ? 'selected' : ''}`}
                      onClick={() => onModelChange(model.id)}
                    >
                      <ModelLogo provider={model.provider} size={28} />
                      <div className="modelItemV2Info">
                        <div className="modelItemV2Name">{model.name}</div>
                        <div className="modelItemV2Meta">
                          <span className="modelProviderTag" style={{ color: getModelColor(model.provider) }}>
                            {model.provider}
                          </span>
                          <span className="modelPriceTag">{model.pricing.perImage || model.pricing.perSecond || 1} 积分</span>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="modelSelectedIndicator" style={{ background: getModelColor(model.provider) }} />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      <div className="modelSidebarV2Footer">
        <NavLink to="/gallery" className="modelSidebarV2Link">
          <BookOpen size={16} />
          <span>提示词画廊</span>
        </NavLink>
      </div>
    </nav>
  );
}

function getModelColor(provider) {
  const colors = {
    'OpenAI': '#10a37f',
    'ByteDance': '#00d4ff',
    'Black Forest Labs': '#8b5cf6',
    'Stability AI': '#f97316',
    'Google': '#4285f4',
    'Kuaishou': '#ff2c55',
    'Runway': '#a855f7',
    'MiniMax': '#3b82f6',
    'Luma': '#22d3ee',
    'DeepSeek': '#2563eb',
    'fal.ai': '#ec4899'
  };
  return colors[provider] || '#42e6ff';
}
