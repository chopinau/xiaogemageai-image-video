﻿﻿﻿﻿﻿import React, { useState, useMemo, useEffect } from 'react';
import {
  User,
  Crown,
  Settings,
  Cpu,
  Gift,
  Shield,
  HelpCircle,
  Download,
  Image as ImageIcon,
  RefreshCw,
  ArrowLeft,
  ChevronRight,
  Sparkles,
  Zap,
  Layers,
  Wand2,
  Camera,
  Scissors,
  Palette,
  Trash2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { historyManager } from '../services/historyManager';
import { useCredits } from '../contexts/CreditsContext';

const NAV_ITEMS = [
  { id: 'works', label: '我的作品', icon: ImageIcon },
  { id: 'settings', label: '设置', icon: Settings },
  { id: 'api', label: 'API', icon: Cpu },
  { id: 'referral', label: '推荐码', icon: Gift },
  { id: 'membership', label: '会员中心', icon: Crown },
  { id: 'help', label: '问题反馈', icon: HelpCircle }
];

const SCENE_TOOLS = [
  { id: 'portrait', label: '人形精修', icon: Wand2, color: '#ff6b6b' },
  { id: 'faceswap', label: '图片换脸', icon: Camera, color: '#f59e0b' },
  { id: 'edit', label: '图片编辑', icon: Layers, color: '#10b981' },
  { id: 'removebg', label: '智能抠图', icon: Scissors, color: '#6366f1' },
  { id: 'virtualfit', label: 'AI试衣', icon: Palette, color: '#8b5cf6' },
  { id: 'virtualwear', label: 'AI换装', icon: Wand2, color: '#ec4899' },
  { id: 'retouch', label: '图片精修', icon: Sparkles, color: '#06b6d4' },
  { id: 'creative', label: '创意绘画', icon: Zap, color: '#f43f5e' }
];

const formatTime = (timestamp) => {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 5) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  return new Date(timestamp).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
};

const groupByTime = (items) => {
  const groups = {};
  const now = Date.now();
  
  items.forEach(item => {
    const diff = now - item.timestamp;
    let key;
    if (diff < 3600000) key = '最近1小时';
    else if (diff < 86400000) key = '最近24小时';
    else if (diff < 259200000) key = '最近3天';
    else key = '更早';
    
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  });
  
  return groups;
};

export function UserDashboard({ language = 'zh' }) {
  const [activeTab, setActiveTab] = useState('works');
  const [selectedTab, setSelectedTab] = useState('all');
  const [history, setHistory] = useState([]);
  const navigate = useNavigate();
  const { credits } = useCredits();

  useEffect(() => {
    const allHistory = [
      ...historyManager.getHistory('image').map(h => ({ ...h, type: 'image' })),
      ...historyManager.getHistory('video').map(h => ({ ...h, type: 'video' }))
    ].sort((a, b) => b.timestamp - a.timestamp);
    setHistory(allHistory);
  }, []);

  const filteredHistory = useMemo(() => {
    if (selectedTab === 'all') return history;
    return history.filter(h => h.type === selectedTab);
  }, [history, selectedTab]);

  const groupedHistory = useMemo(() => groupByTime(filteredHistory), [filteredHistory]);

  const handleDownload = (item) => {
    if (item.imageUrl) {
      const a = document.createElement('a');
      a.href = item.imageUrl;
      a.download = `ai-work-${item.id}.png`;
      a.click();
    }
  };

  const handleGoBack = () => navigate('/');

  return (
    <div className="userDashboard">
      {/* 顶部导航 */}
      <div className="dashboardTopbar">
        <div className="topbarLeft">
          <button className="backBtn" onClick={handleGoBack}>
            <ArrowLeft size={18} />
          </button>
          <div className="topbarNav">
            {NAV_ITEMS.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  className={`navItem ${activeTab === item.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(item.id)}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="topbarRight">
          <div className="promoBanner">
            <span>🎉 新用户：开启会员畅享更多创作权限 (1-3天免费)，我们了解了用户的产品</span>
          </div>
        </div>
      </div>

      <div className="dashboardBody">
        {/* 主要内容区 */}
        <div className="mainContent">
          {activeTab === 'works' && (
            <>
              {/* 作品标签 */}
              <div className="worksTabBar">
                <button
                  className={`worksTab ${selectedTab === 'all' ? 'active' : ''}`}
                  onClick={() => setSelectedTab('all')}
                >
                  我的作品
                </button>
                <button
                  className={`worksTab ${selectedTab === 'image' ? 'active' : ''}`}
                  onClick={() => setSelectedTab('image')}
                >
                  图片
                </button>
                <button
                  className={`worksTab ${selectedTab === 'video' ? 'active' : ''}`}
                  onClick={() => setSelectedTab('video')}
                >
                  视频
                </button>
              </div>

              {/* 作品展示 */}
              <div className="worksContent">
                {Object.entries(groupedHistory).length > 0 ? (
                  Object.entries(groupedHistory).map(([timeGroup, items]) => (
                    <div key={timeGroup} className="timeGroup">
                      <div className="timeGroupHeader">
                        <h4>{timeGroup}</h4>
                      </div>
                      <div className="worksGrid">
                        {items.map(item => (
                          <div key={item.id} className="workCard">
                            <div className="workImage">
                              {item.imageUrl ? (
                                <img src={item.imageUrl} alt={item.prompt || 'AI作品'} />
                              ) : (
                                <div className="workPlaceholder">
                                  <ImageIcon size={32} />
                                </div>
                              )}
                              <div className="workActions">
                                <button className="workBtn" onClick={() => handleDownload(item)}>
                                  <Download size={14} />
                                </button>
                                <button className="workBtn">
                                  <RefreshCw size={14} />
                                </button>
                                <button className="workBtn">
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                            <div className="workInfo">
                              <span className="workCost">花费 {item.cost || 0} 算力</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="emptyState">
                    <ImageIcon size={48} className="emptyIcon" />
                    <h3>暂无作品</h3>
                    <p>开始创作，这里会展示你的作品</p>
                    <button className="primaryBtn" onClick={() => navigate('/')}>
                      开始创作
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'settings' && (
            <div className="settingsContent">
              <h2>设置</h2>
              <p className="comingSoon">功能开发中...</p>
            </div>
          )}

          {activeTab === 'api' && (
            <div className="apiContent">
              <h2>API</h2>
              <p className="comingSoon">功能开发中...</p>
            </div>
          )}

          {activeTab === 'referral' && (
            <div className="referralContent">
              <h2>推荐码</h2>
              <p className="comingSoon">功能开发中...</p>
            </div>
          )}

          {activeTab === 'membership' && (
            <div className="membershipContent">
              <h2>会员中心</h2>
              <p className="comingSoon">功能开发中...</p>
            </div>
          )}

          {activeTab === 'help' && (
            <div className="helpContent">
              <h2>问题反馈</h2>
              <p className="comingSoon">功能开发中...</p>
            </div>
          )}
        </div>

        {/* 右侧面板 */}
        <div className="sidePanel">
          {/* 用户信息 */}
          <div className="userCard">
            <div className="userCardHeader">
              <div className="userAvatarLarge">
                <User size={28} />
              </div>
              <div className="userInfo">
                <h3>星月月亮</h3>
                <div className="userBadge">VIP</div>
              </div>
            </div>
            <div className="userDetails">
              <div className="userDetailRow">
                <span className="label">手机号</span>
                <span className="value">13141572222@qq.com</span>
                <button className="linkBtn">编辑</button>
              </div>
              <div className="userDetailRow">
                <span className="label">申请时间</span>
                <span className="value">2025.08.12</span>
                <button className="linkBtn">加入工作室</button>
              </div>
            </div>
          </div>

          {/* 算力统计 */}
          <div className="statsCard">
            <div className="statsTitle">
              <Sparkles size={16} />
              <span>AI 创作</span>
            </div>
            <div className="statsGrid">
              <div className="statItem">
                <div className="statLabel">累计收入</div>
                <div className="statValue">¥24.24</div>
              </div>
              <div className="statItem">
                <div className="statLabel">可提现余额</div>
                <div className="statValue">¥14.24</div>
              </div>
              <div className="statItem">
                <div className="statLabel">累计付费</div>
                <div className="statValue">¥14.24</div>
              </div>
              <div className="statItem">
                <div className="statLabel">累计算力</div>
                <div className="statValue">18630</div>
              </div>
            </div>
            <div className="statsFooter">
              <span>注册时间：2025-05-08 15:11</span>
            </div>
          </div>

          {/* 其他功能 */}
          <div className="toolsCard">
            <div className="toolsTitle">其他功能</div>
            <div className="toolsGrid">
              {SCENE_TOOLS.map(tool => {
                const Icon = tool.icon;
                return (
                  <button key={tool.id} className="toolBtn">
                    <div className="toolIcon" style={{ backgroundColor: tool.color + '20', color: tool.color }}>
                      <Icon size={20} />
                    </div>
                    <span>{tool.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 安全中心 */}
          <div className="securityCard">
            <div className="securityTitle">
              <Shield size={16} />
              <span>安全中心</span>
            </div>
            <button className="dangerBtn">账户注销</button>
          </div>
        </div>
      </div>
    </div>
  );
}
