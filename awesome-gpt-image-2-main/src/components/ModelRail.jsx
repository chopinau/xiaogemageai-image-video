import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Sparkles, Image, Video, Wand2, Layers, BookOpen } from 'lucide-react';

const RAIL_ITEMS = [
  { key: 'image', icon: Image, label: '图片生成', color: '#42e6ff' },
  { key: 'video', icon: Video, label: '视频生成', color: '#f9ff72' },
  { key: 'retouch', icon: Wand2, label: '图片精修', color: '#ff4aa6' },
  { key: 'psdLayer', icon: Layers, label: 'PSD分层', color: '#a78bfa' }
];

export function ModelRail({ activeCategory, onCategoryChange }) {
  const [hoveredItem, setHoveredItem] = useState(null);

  return (
    <nav className="modelRail">
      <div className="modelRailLogo">
        <Sparkles size={20} />
      </div>

      <div className="modelRailItems">
        {RAIL_ITEMS.map(item => {
          const Icon = item.icon;
          const isActive = activeCategory === item.key;
          return (
            <div
              key={item.key}
              className={`modelRailItem ${isActive ? 'active' : ''}`}
              onClick={() => onCategoryChange(item.key)}
              onMouseEnter={() => setHoveredItem(item.key)}
              onMouseLeave={() => setHoveredItem(null)}
              style={{ '--item-color': item.color }}
            >
              {isActive && <div className="modelRailIndicator" style={{ background: item.color }} />}
              <Icon size={22} />
              {hoveredItem === item.key && (
                <div className="modelRailTooltip">{item.label}</div>
              )}
            </div>
          );
        })}
      </div>

      <div className="modelRailFooter">
        <NavLink to="/gallery" className="modelRailItem" title="提示词画廊">
          <BookOpen size={22} />
        </NavLink>
      </div>
    </nav>
  );
}
