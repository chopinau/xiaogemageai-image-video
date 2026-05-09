import React from 'react';
import { NavLink } from 'react-router-dom';
import { Image, Layers, WandSparkles, Video, BookOpen } from 'lucide-react';

const navItems = [
  { path: '/', label: '主图生成', icon: Image },
  { path: '/detail-studio', label: '详情图生成', icon: Layers },
  { path: '/retouch-studio', label: '图片精修', icon: WandSparkles },
  { path: '/psd-layer', label: 'PSD分层', icon: Layers },
  { path: '/video-gen', label: '视频生成', icon: Video },
  { path: '/gallery', label: '提示词画廊', icon: BookOpen }
];

export function Sidebar() {
  return (
    <nav className="sidebar">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.path === '/'}
          className={({ isActive }) => `sidebarItem ${isActive ? 'active' : ''}`}
        >
          <item.icon size={18} />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
