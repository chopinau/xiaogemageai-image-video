﻿﻿﻿import React, { useState } from 'react';
import { ModelLogo } from './ModelLogo';
import { getModelsByCategory } from '../config/models';

export function ModelCapsuleGroup({ category, currentModel, onModelChange }) {
  const models = getModelsByCategory(category);
  const [hoveredModel, setHoveredModel] = useState(null);

  if (models.length === 0) return null;

  return (
    <div className="modelCapsuleGroup">
      {models.map(model => {
        const isSelected = currentModel === model.id;
        const brandColor = getModelColor(model.provider);
        const isHovered = hoveredModel === model.id;
        const caps = model.capabilities || [];
        const capLabels = caps
          .map(c => CAP_LABELS[c])
          .filter(Boolean)
          .join(' · ');
        const successRate = model.successRate || 0;

        return (
          <button
            key={model.id}
            className={`modelCapsule ${isSelected ? 'selected' : ''}`}
            onClick={() => onModelChange(model.id)}
            onMouseEnter={() => setHoveredModel(model.id)}
            onMouseLeave={() => setHoveredModel(null)}
            style={{ '--brand-color': brandColor }}
          >
            <ModelLogo provider={model.provider} size={22} />
            <span className="capsuleName">{model.name}</span>
            
            {/* 成功率徽章 */}
            <span 
              className="successRateBadge"
              style={{
                color: successRate >= 90 ? '#10b981' : successRate >= 80 ? '#f59e0b' : '#ef4444',
                background: successRate >= 90 
                  ? 'rgba(16, 185, 129, 0.12)' 
                  : successRate >= 80 
                    ? 'rgba(245, 158, 11, 0.12)' 
                    : 'rgba(239, 68, 68, 0.12)'
              }}
            >
              {successRate}%
            </span>
            
            <span className="capsulePrice">
              {model.pricing.perImage
                ? `${model.pricing.perImage}算力`
                : model.pricing.perSecond
                  ? `${model.pricing.perSecond}算力/秒`
                  : ''}
            </span>
            {isHovered && !isSelected && capLabels && (
              <div className="modelCapsuleTooltip">{capLabels}</div>
            )}
          </button>
        );
      })}
    </div>
  );
}

const CAP_LABELS = {
  'text-to-image': '文生图',
  'image-to-image': '图生图',
  'inpainting': '局部重绘',
  'text-to-video': '文生视频',
  'image-to-video': '图生视频',
  'background-removal': '背景移除',
  'background-replace': '背景替换',
  'psd-export': 'PSD导出'
};

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
