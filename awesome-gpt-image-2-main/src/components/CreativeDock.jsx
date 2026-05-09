import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Sparkles, Image, Video, Wand2, Layers, BookOpen, Settings } from 'lucide-react';

const DOCK_ITEMS = [
  { key: 'image', icon: Image, label: '图片', color: '#42e6ff' },
  { key: 'video', icon: Video, label: '视频', color: '#f9ff72' },
  { key: 'retouch', icon: Wand2, label: '精修', color: '#ff4aa6' },
  { key: 'psdLayer', icon: Layers, label: 'PSD', color: '#a78bfa' }
];

export function CreativeDock({ activeCategory, onCategoryChange }) {
  const [hoveredItem, setHoveredItem] = useState(null);

  return (
    <nav className="creativeDock">
      <div
        className="creativeDockLogo"
        onClick={() => onCategoryChange('image')}
        title="AI 创作平台"
      >
        <Sparkles size={20} />
      </div>

      <div className="creativeDockItems">
        {DOCK_ITEMS.map(item => {
          const Icon = item.icon;
          const isActive = activeCategory === item.key;
          return (
            <div
              key={item.key}
              className={`creativeDockItem ${isActive ? 'active' : ''}`}
              onClick={() => onCategoryChange(item.key)}
              onMouseEnter={() => setHoveredItem(item.key)}
              onMouseLeave={() => setHoveredItem(null)}
              style={{ '--item-color': item.color }}
            >
              {isActive && (
                <div className="creativeDockIndicator" style={{ background: item.color }} />
              )}
              <span className="creativeDockItemIcon">
                <Icon size={20} />
              </span>
              <span className="creativeDockItemLabel">{item.label}</span>
              {hoveredItem === item.key && !isActive && (
                <div className="creativeDockTooltip">{item.key === 'psdLayer' ? 'PSD分层' : item.label + '生成'}</div>
              )}
            </div>
          );
        })}
      </div>

      <div className="creativeDockFooter">
        <NavLink to="/gallery" className="creativeDockItem" style={{ '--item-color': '#78ffb9' }}>
          <span className="creativeDockItemIcon">
            <BookOpen size={20} />
          </span>
          <span className="creativeDockItemLabel">画廊</span>
        </NavLink>
        <NavLink to="/pricing" className="creativeDockItem" style={{ '--item-color': '#8899b0' }}>
          <span className="creativeDockItemIcon">
            <Settings size={18} />
          </span>
          <span className="creativeDockItemLabel">方案</span>
        </NavLink>
      </div>
    </nav>
  );
}
