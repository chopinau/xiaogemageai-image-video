import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { API_BASE, safeFetch } from '../../config/api';
import { AgencyBrandConfig } from './AgencyBrandConfig';
import { AgencyRevenue } from './AgencyRevenue';
import { AgencyUsers } from './AgencyUsers';
import { Layout, BarChart3, Users, DollarSign, Palette, TrendingUp, Wallet, ArrowUpRight, UserPlus, Home, Menu, X } from 'lucide-react';

const TABS = [
  { id: 'overview', label: '概览', icon: Home },
  { id: 'brand', label: '品牌配置', icon: Palette },
  { id: 'revenue', label: '收益管理', icon: DollarSign },
  { id: 'users', label: '用户管理', icon: Users },
];

async function agencyApiCall(path, options = {}) {
  const token = localStorage.getItem('auth_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers
  };
  const { response, data } = await safeFetch(`${API_BASE}${path}`, { ...options, headers });
  if (!response.ok && !data.error) {
    throw new Error(`HTTP ${response.status}`);
  }
  return data;
}

export function AgencyDashboard() {
  const { user } = useAuth();
  const notify = useNotification();
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (activeTab === 'overview') loadDashboard();
  }, [activeTab]);

  async function loadDashboard() {
    setLoading(true);
    try {
      const data = await agencyApiCall('/api/agency/me/dashboard');
      if (data.success) setDashboard(data.data);
    } catch (err) {
      notify.error('加载仪表盘失败: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  function StatCard({ label, value, icon: Icon, color, sub }) {
    return (
      <div style={{ background: '#1a1a2e', borderRadius: 12, padding: 20, border: '1px solid #2a2a4a' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ color: '#8888aa', fontSize: 13, marginBottom: 6 }}>{label}</div>
            <div style={{ color: '#fff', fontSize: 24, fontWeight: 700 }}>{value}</div>
            {sub && <div style={{ color: '#6666aa', fontSize: 12, marginTop: 4 }}>{sub}</div>}
          </div>
          <div style={{ background: color + '22', borderRadius: 10, padding: 10 }}>
            <Icon size={20} style={{ color }} />
          </div>
        </div>
      </div>
    );
  }

  function OverviewTab() {
    if (loading) return <div style={{ color: '#8888aa', textAlign: 'center', padding: 40 }}>加载中...</div>;
    if (!dashboard) return <div style={{ color: '#ff6b6b', textAlign: 'center', padding: 40 }}>加载失败</div>;

    const a = dashboard.agency || {};
    return (
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
          <StatCard label="总用户数" value={dashboard.userCount || 0} icon={Users} color="#42e6ff" sub={`本月新增 ${dashboard.newUsersThisMonth || 0}`} />
          <StatCard label="总收益" value={`¥${(a.totalRevenue || 0).toFixed(2)}`} icon={TrendingUp} color="#4ade80" />
          <StatCard label="可用余额" value={`¥${(a.availableBalance || 0).toFixed(2)}`} icon={Wallet} color="#fbbf24" />
          <StatCard label="已提现" value={`¥${(dashboard.totalWithdrawn || 0).toFixed(2)}`} icon={ArrowUpRight} color="#a78bfa" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: '#1a1a2e', borderRadius: 12, padding: 20, border: '1px solid #2a2a4a' }}>
            <h3 style={{ color: '#fff', fontSize: 15, marginBottom: 12, fontWeight: 600 }}>加价策略</h3>
            <div style={{ color: '#8888aa', fontSize: 13, marginBottom: 8 }}>
              类型: <span style={{ color: '#42e6ff' }}>{a.markupType === 'percentage' ? '百分比加价' : '固定金额加价'}</span>
            </div>
            <div style={{ color: '#8888aa', fontSize: 13 }}>
              加价值: <span style={{ color: '#4ade80', fontSize: 18, fontWeight: 700 }}>{a.markupValue}{a.markupType === 'percentage' ? '%' : '元'}</span>
            </div>
          </div>

          <div style={{ background: '#1a1a2e', borderRadius: 12, padding: 20, border: '1px solid #2a2a4a' }}>
            <h3 style={{ color: '#fff', fontSize: 15, marginBottom: 12, fontWeight: 600 }}>最近用户</h3>
            {(dashboard.recentUsers || []).length === 0 ? (
              <div style={{ color: '#6666aa', fontSize: 13 }}>暂无用户</div>
            ) : (
              (dashboard.recentUsers || []).slice(0, 5).map((au, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #2a2a4a' }}>
                  <span style={{ color: '#ccc', fontSize: 13 }}>{au.user?.nickname || au.user?.email}</span>
                  <span style={{ color: '#8888aa', fontSize: 12 }}>{new Date(au.joinedAt).toLocaleDateString()}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0d0d1a' }}>
      <div style={{
        width: sidebarOpen ? 220 : 60,
        background: '#12122a',
        borderRight: '1px solid #2a2a4a',
        transition: 'width 0.2s',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{ padding: '16px 12px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #2a2a4a' }}>
          {sidebarOpen && <span style={{ color: '#42e6ff', fontWeight: 700, fontSize: 16 }}>代理商中心</span>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: 'none', border: 'none', color: '#8888aa', cursor: 'pointer', marginLeft: 'auto' }}>
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
            background: activeTab === tab.id ? '#1a1a3e' : 'transparent',
            border: 'none', color: activeTab === tab.id ? '#42e6ff' : '#8888aa',
            cursor: 'pointer', textAlign: 'left', fontSize: 14, borderLeft: activeTab === tab.id ? '3px solid #42e6ff' : '3px solid transparent',
          }}>
            <tab.icon size={18} />
            {sidebarOpen && <span>{tab.label}</span>}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, padding: 24, overflowY: 'auto' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
            {activeTab === 'overview' ? '代理商概览' :
             activeTab === 'brand' ? '品牌配置' :
             activeTab === 'revenue' ? '收益管理' : '用户管理'}
          </h1>
          <p style={{ color: '#6666aa', fontSize: 13 }}>
            {user?.nickname || user?.email} · 代理商账户
          </p>
        </div>

        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'brand' && <AgencyBrandConfig />}
        {activeTab === 'revenue' && <AgencyRevenue />}
        {activeTab === 'users' && <AgencyUsers />}
      </div>
    </div>
  );
}
