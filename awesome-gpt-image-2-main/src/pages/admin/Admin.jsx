import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { AI_MODELS } from '../../config/models';
import { Layout, BarChart3, Users, Cpu, ShoppingCart, Coins, Share2, Settings, FileText, Menu, X, DollarSign, AlertTriangle, Activity, TrendingUp, Zap, Headphones, Bell, Send } from 'lucide-react';
import { PricingAdmin } from './PricingAdmin';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
const ADMIN_KEY = 'admin123';

function apiCall(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', 'x-admin-key': ADMIN_KEY, ...options.headers };
  return fetch(`${API_BASE}${path}`, { ...options, headers });
}

const ADMIN_TABS = [
  { id: 'dashboard', label: '仪表盘', icon: BarChart3 },
  { id: 'users', label: '用户管理', icon: Users },
  { id: 'models', label: '模型管理', icon: Cpu },
  { id: 'pricing', label: '价格管理', icon: DollarSign },
  { id: 'orders', label: '订单管理', icon: ShoppingCart },
  { id: 'credits', label: '算力管理', icon: Coins },
  { id: 'tickets', label: '客服管理', icon: Headphones },
  { id: 'notifications', label: '通知管理', icon: Bell },
  { id: 'distribution', label: '分销管理', icon: Share2 },
  { id: 'settings', label: '系统设置', icon: Settings },
  { id: 'logs', label: '操作日志', icon: FileText }
];

const MOCK_DASHBOARD = {
  totalUsers: 12580,
  activeUsers: 3456,
  totalRevenue: 285600,
  monthlyRevenue: 45800,
  totalGenerations: 892340,
  todayGenerations: 12340,
  creditsIssued: 2450000,
  creditsConsumed: 1890000
};

const MOCK_USERS = [
  { id: 1, email: 'user1@example.com', nickname: '设计师小王', membership: 'pro', credits: 580, createdAt: '2025-01-15', status: 'active' },
  { id: 2, email: 'user2@example.com', nickname: '电商达人', membership: 'basic', credits: 120, createdAt: '2025-02-20', status: 'active' },
  { id: 3, email: 'user3@example.com', nickname: '摄影师老李', membership: 'enterprise', credits: 2100, createdAt: '2025-01-05', status: 'active' },
  { id: 4, email: 'user4@example.com', nickname: '新用户', membership: 'free', credits: 15, createdAt: '2025-05-01', status: 'active' },
  { id: 5, email: 'user5@example.com', nickname: '违规用户', membership: 'free', credits: 0, createdAt: '2025-03-10', status: 'banned' }
];

const MOCK_ORDERS = [
  { id: 'ORD001', userId: 1, nickname: '设计师小王', type: 'membership', product: '专业版月付', amount: 99, status: 'paid', method: 'alipay', createdAt: '2025-05-01' },
  { id: 'ORD002', userId: 3, nickname: '摄影师老李', type: 'membership', product: '企业版年付', amount: 2988, status: 'paid', method: 'wechat', createdAt: '2025-04-28' },
  { id: 'ORD003', userId: 2, nickname: '电商达人', type: 'credits', product: '500算力包', amount: 39.9, status: 'paid', method: 'alipay', createdAt: '2025-05-03' },
  { id: 'ORD004', userId: 4, nickname: '新用户', type: 'credits', product: '100算力包', amount: 9.9, status: 'pending', method: 'wechat', createdAt: '2025-05-05' }
];

export function AdminPage() {
  const { user, getAuthHeaders, logout } = useAuth();
  const notify = useNotification();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isAdmin = user?.role === 'admin';

  if (!isAdmin) {
    return (
      <div className="sharedSection">
        <div style={{ textAlign: 'center', padding: '80px 20px', color: '#ff6b8a' }}>
          <h2>无访问权限</h2>
          <p style={{ color: '#73859f' }}>仅管理员可访问此页面</p>
          <p style={{ color: '#5a6a80', fontSize: '13px', marginTop: '12px' }}>提示：使用包含 "admin" 的邮箱登录可获取管理员权限</p>
        </div>
      </div>
    );
  }

  return (
    <div className="adminLayout">
      <button className="adminMobileToggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <nav className={`adminSidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="adminSidebarHeader">
          <Layout size={18} style={{ color: '#42e6ff' }} /> 管理后台
        </div>
        {ADMIN_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setSidebarOpen(false); }}
            className={`adminSidebarItem ${activeTab === tab.id ? 'active' : ''}`}
          >
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </nav>

      {sidebarOpen && <div className="adminOverlay" onClick={() => setSidebarOpen(false)} />}

      <div className="adminContent">
        {activeTab === 'dashboard' && <DashboardTab />}
        {activeTab === 'users' && <UsersTab />}
        {activeTab === 'models' && <ModelsTab />}
        {activeTab === 'pricing' && <PricingAdmin />}
        {activeTab === 'orders' && <OrdersTab />}
        {activeTab === 'credits' && <CreditsAdminTab />}
        {activeTab === 'tickets' && <TicketsAdminTab />}
        {activeTab === 'notifications' && <NotificationsAdminTab />}
        {activeTab === 'distribution' && <DistributionTab />}
        {activeTab === 'settings' && <SettingsTab />}
        {activeTab === 'logs' && <LogsTab />}
      </div>
    </div>
  );
}

function StatCard({ label, value, color, prefix = '', suffix = '' }) {
  return (
    <div className="adminStatCard">
      <div className="adminStatLabel">{label}</div>
      <div className="adminStatValue" style={{ color }}>
        {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
      </div>
    </div>
  );
}

function DashboardTab() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    try {
      const res = await apiCall('/pricing-admin/dashboard');
      const data = await res.json();
      if (data.success) {
        setDashboardData(data.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <div>
        <h2 className="adminPageTitle">仪表盘</h2>
        <div style={{ textAlign: 'center', padding: '40px', color: '#73859f' }}>
          <Activity size={24} className="spinning" style={{ marginBottom: '12px' }} />
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  const d = dashboardData || {};

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 className="adminPageTitle" style={{ marginBottom: 0 }}>仪表盘</h2>
        <button className="adminActionBtn" onClick={loadDashboard}>
          <Activity size={14} /> 刷新
        </button>
      </div>

      <div className="adminStatGrid">
        <div className="adminStatCard">
          <div className="adminStatLabel">模型总数</div>
          <div className="adminStatValue" style={{ color: '#42e6ff' }}>{d.totalModels || 0}</div>
        </div>
        <div className="adminStatCard">
          <div className="adminStatLabel">供应商数</div>
          <div className="adminStatValue" style={{ color: '#78ffb9' }}>{d.providers || 0}</div>
        </div>
        <div className="adminStatCard">
          <div className="adminStatLabel">今日请求</div>
          <div className="adminStatValue" style={{ color: '#9eeeff' }}>{d.totalDailyRequests || 0}</div>
        </div>
        <div className="adminStatCard">
          <div className="adminStatLabel">今日消费</div>
          <div className="adminStatValue" style={{ color: '#f9ff72' }}>¥{d.totalDailySpent || 0}</div>
        </div>
        <div className="adminStatCard">
          <div className="adminStatLabel">活跃用户</div>
          <div className="adminStatValue" style={{ color: '#78ffb9' }}>{d.activeUsers || 0}</div>
        </div>
        <div className="adminStatCard">
          <div className="adminStatLabel">默认加价率</div>
          <div className="adminStatValue" style={{ color: '#ff74a6' }}>{d.defaultMarkup || 0}%</div>
        </div>
        <div className="adminStatCard">
          <div className="adminStatLabel">熔断告警</div>
          <div className="adminStatValue" style={{ color: (d.circuitBreakerAlerts?.length || 0) > 0 ? '#ff6b8a' : '#78ffb9' }}>
            {d.circuitBreakerAlerts?.length || 0}
          </div>
        </div>
        <div className="adminStatCard">
          <div className="adminStatLabel">价格告警</div>
          <div className="adminStatValue" style={{ color: (d.priceAlerts || 0) > 0 ? '#f9ff72' : '#78ffb9' }}>
            {d.priceAlerts || 0}
          </div>
        </div>
      </div>

      {(d.circuitBreakerAlerts?.length || 0) > 0 && (
        <div className="adminCard" style={{ marginBottom: '16px', borderLeft: '3px solid #ff6b8a' }}>
          <h3 className="adminCardTitle">
            <AlertTriangle size={14} style={{ color: '#ff6b8a', marginRight: '6px' }} />
            熔断器告警
          </h3>
          <div className="adminTableWrap">
            <table className="adminTable">
              <thead>
                <tr>
                  <th>模型/供应商</th>
                  <th>状态</th>
                  <th>失败次数</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {d.circuitBreakerAlerts.map((alert, idx) => (
                  <tr key={idx}>
                    <td><strong>{alert.provider}</strong></td>
                    <td>
                      <span style={{
                        color: alert.state === 'open' ? '#ff6b8a' : '#f9ff72',
                        background: alert.state === 'open' ? 'rgba(255,106,138,0.12)' : 'rgba(249,255,114,0.12)',
                        padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 700
                      }}>
                        {alert.state === 'open' ? '已熔断' : '半开'}
                      </span>
                    </td>
                    <td style={{ color: '#ff6b8a', fontWeight: 700 }}>{alert.failCount}</td>
                    <td>
                      <button className="adminActionBtn" onClick={() => window.location.href = '/admin'}>
                        查看
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(d.topModels?.length || 0) > 0 && (
        <div className="adminCard">
          <h3 className="adminCardTitle">
            <TrendingUp size={14} style={{ color: '#42e6ff', marginRight: '6px' }} />
            热门模型 (今日调用排行)
          </h3>
          <div className="adminTableWrap">
            <table className="adminTable">
              <thead>
                <tr>
                  <th>排名</th>
                  <th>模型</th>
                  <th>调用次数</th>
                  <th>占比</th>
                </tr>
              </thead>
              <tbody>
                {d.topModels.map((item, idx) => {
                  const totalCalls = d.topModels.reduce((sum, m) => sum + m.calls, 0) || 1;
                  const percent = Math.round((item.calls / totalCalls) * 100);
                  return (
                    <tr key={idx}>
                      <td>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          width: '24px', height: '24px', borderRadius: '50%',
                          background: idx === 0 ? 'rgba(120,255,185,0.2)' : idx === 1 ? 'rgba(249,255,114,0.15)' : idx === 2 ? 'rgba(66,230,255,0.15)' : 'rgba(115,133,159,0.1)',
                          color: idx === 0 ? '#78ffb9' : idx === 1 ? '#f9ff72' : idx === 2 ? '#42e6ff' : '#73859f',
                          fontSize: '12px', fontWeight: 800
                        }}>
                          {idx + 1}
                        </span>
                      </td>
                      <td><strong>{item.model}</strong></td>
                      <td style={{ color: '#42e6ff', fontWeight: 700 }}>{item.calls}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${percent}%`, height: '100%', background: idx === 0 ? '#78ffb9' : idx === 1 ? '#f9ff72' : '#42e6ff', borderRadius: '3px' }} />
                          </div>
                          <span style={{ color: '#73859f', fontSize: '11px', minWidth: '32px' }}>{percent}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function UsersTab() {
  const notify = useNotification();
  const [users, setUsers] = useState(MOCK_USERS);
  const [search, setSearch] = useState('');

  const filtered = users.filter(u =>
    u.email.includes(search) || u.nickname.includes(search)
  );

  const toggleUserStatus = (userId) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const newStatus = u.status === 'active' ? 'banned' : 'active';
        return { ...u, status: newStatus };
      }
      return u;
    }));
    const user = users.find(u => u.id === userId);
    notify.success(`用户 ${userId} ${user?.status === 'active' ? '封禁' : '解封'}成功`);
  };

  const adjustCredits = (userId) => {
    const amount = 10;
    setUsers(prev => prev.map(u => {
      if (u.id === userId) return { ...u, credits: u.credits + amount };
      return u;
    }));
    notify.success(`用户 ${userId} 算力调整成功 (+${amount})`);
  };

  return (
    <div>
      <h2 className="adminPageTitle">用户管理</h2>
      <div className="adminSearchBar">
        <input
          value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索用户邮箱或昵称..."
          className="adminInput"
          style={{ width: '300px' }}
        />
      </div>
      <div className="adminTableWrap">
        <table className="adminTable">
          <thead>
            <tr>
              {['ID', '昵称', '邮箱', '会员', '算力', '状态', '注册时间', '操作'].map(h => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.nickname}</td>
                <td className="adminCellMuted">{u.email}</td>
                <td>
                  <span className={`adminBadge adminBadge-${u.membership}`}>
                    {u.membership}
                  </span>
                </td>
                <td className="adminCellCredits">{u.credits}</td>
                <td>
                  <span style={{ color: u.status === 'active' ? '#78ffb9' : '#ff6b8a' }}>
                    {u.status === 'active' ? '正常' : '封禁'}
                  </span>
                </td>
                <td className="adminCellMuted">{u.createdAt}</td>
                <td>
                  <div className="adminActionBtns">
                    <button onClick={() => adjustCredits(u.id)} className="adminActionBtn">算力</button>
                    <button onClick={() => toggleUserStatus(u.id)} className={`adminActionBtn ${u.status === 'active' ? 'danger' : 'success'}`}>
                      {u.status === 'active' ? '封禁' : '解封'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ModelsTab() {
  const notify = useNotification();

  const initialModels = [];
  for (const [cat, models] of Object.entries(AI_MODELS)) {
    for (const model of Object.values(models)) {
      initialModels.push({ ...model, category: cat });
    }
  }

  const [modelStates, setModelStates] = useState(() =>
    Object.fromEntries(initialModels.map(m => [m.id, m.enabled !== false]))
  );

  const toggleModel = (modelId) => {
    setModelStates(prev => {
      const newState = !prev[modelId];
      notify.success(`模型 ${modelId} 已${newState ? '启用' : '禁用'}`);
      return { ...prev, [modelId]: newState };
    });
  };

  return (
    <div>
      <h2 className="adminPageTitle">模型管理</h2>
      <div className="adminTableWrap">
        <table className="adminTable">
          <thead>
            <tr>
              {['模型ID', '名称', '供应商', '类别', '定价', '状态', '排序', '操作'].map(h => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {initialModels.map(m => {
              const enabled = modelStates[m.id] !== false;
              return (
                <tr key={m.id}>
                  <td className="adminCellId">{m.id}</td>
                  <td>{m.name}</td>
                  <td className="adminCellMuted">{m.provider}</td>
                  <td className="adminCellMuted">{m.category}</td>
                  <td className="adminCellCredits">
                    {m.pricing?.perImage ? `${m.pricing.perImage}算力/张` : m.pricing?.perSecond ? `${m.pricing.perSecond}算力/秒` : '-'}
                  </td>
                  <td>
                    <span style={{ color: enabled ? '#78ffb9' : '#ff6b8a' }}>
                      {enabled ? '启用' : '禁用'}
                    </span>
                  </td>
                  <td className="adminCellMuted">{m.sortOrder}</td>
                  <td>
                    <button onClick={() => toggleModel(m.id)} className="adminActionBtn">
                      {enabled ? '禁用' : '启用'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OrdersTab() {
  const notify = useNotification();
  const [orders, setOrders] = useState(MOCK_ORDERS);

  const statusColors = { paid: '#78ffb9', pending: '#f9ff72', failed: '#ff6b8a', refunded: '#73859f', cancelled: '#5a6a80' };
  const statusLabels = { paid: '已支付', pending: '待支付', failed: '支付失败', refunded: '已退款', cancelled: '已取消' };

  const refundOrder = (orderId) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'refunded' } : o));
    notify.success(`订单 ${orderId} 退款成功`);
  };

  return (
    <div>
      <h2 className="adminPageTitle">订单管理</h2>
      <div className="adminTableWrap">
        <table className="adminTable">
          <thead>
            <tr>
              {['订单号', '用户', '类型', '商品', '金额', '状态', '支付方式', '时间', '操作'].map(h => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.map(o => (
              <tr key={o.id}>
                <td className="adminCellId">{o.id}</td>
                <td>{o.nickname}</td>
                <td className="adminCellMuted">{o.type === 'membership' ? '会员' : '算力'}</td>
                <td className="adminCellMuted">{o.product}</td>
                <td className="adminCellCredits">¥{o.amount}</td>
                <td>
                  <span style={{ color: statusColors[o.status] }}>{statusLabels[o.status]}</span>
                </td>
                <td className="adminCellMuted">{o.method}</td>
                <td className="adminCellMuted">{o.createdAt}</td>
                <td>
                  {o.status === 'paid' && (
                    <button onClick={() => refundOrder(o.id)} className="adminActionBtn danger">退款</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CreditsAdminTab() {
  const notify = useNotification();
  const [grantForm, setGrantForm] = useState({ userIds: '', amount: '', note: '' });

  const handleGrant = () => {
    if (!grantForm.userIds || !grantForm.amount || Number(grantForm.amount) <= 0) {
      notify.error('请填写完整的发放信息');
      return;
    }
    notify.success(`已向 ${grantForm.userIds.split(',').length} 个用户发放 ${grantForm.amount} 算力`);
    setGrantForm({ userIds: '', amount: '', note: '' });
  };

  return (
    <div>
      <h2 className="adminPageTitle">算力管理</h2>
      <div className="adminGrid2">
        <div className="adminCard">
          <h3 className="adminCardTitle">批量发放算力</h3>
          <div className="adminFormField">
            <input placeholder="用户ID（多个用逗号分隔）" className="adminInput" value={grantForm.userIds} onChange={e => setGrantForm(p => ({ ...p, userIds: e.target.value }))} />
          </div>
          <div className="adminFormField">
            <input type="number" placeholder="发放数量" className="adminInput" value={grantForm.amount} onChange={e => setGrantForm(p => ({ ...p, amount: e.target.value }))} />
          </div>
          <div className="adminFormField">
            <input placeholder="备注说明" className="adminInput" value={grantForm.note} onChange={e => setGrantForm(p => ({ ...p, note: e.target.value }))} />
          </div>
          <button onClick={handleGrant} className="adminPrimaryBtn">发放</button>
        </div>
        <div className="adminCard">
          <h3 className="adminCardTitle">算力规则配置</h3>
          <div className="adminRulesList">
            <div>每日签到：<span className="adminHighlight">+2 算力</span></div>
            <div>新用户注册：<span className="adminHighlight">+20 算力</span></div>
            <div>邀请好友：<span className="adminHighlight">+10 算力/人</span></div>
            <div>会员月度算力：按等级发放</div>
            <div>购买算力包：永不过期</div>
            <div>赠送算力：<span style={{ color: '#ff6b8a' }}>30天过期</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DistributionTab() {
  return (
    <div>
      <h2 className="adminPageTitle">分销管理</h2>
      <div className="adminStatGrid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <StatCard label="总推广员" value={256} color="#42e6ff" />
        <StatCard label="活跃推广员" value={89} color="#78ffb9" />
        <StatCard label="总佣金支出" value={12450} color="#f9ff72" prefix="¥" />
        <StatCard label="待审批提现" value={3} color="#ff74a6" />
      </div>
      <div className="adminCard">
        <h3 className="adminCardTitle">待审批提现</h3>
        <div style={{ color: '#73859f', fontSize: '14px' }}>暂无待审批提现申请</div>
      </div>
    </div>
  );
}

function SettingsTab() {
  const notify = useNotification();
  const settingsFields = [
    { label: '微信支付 AppID', key: 'wechat_appid', type: 'text' },
    { label: '微信支付密钥', key: 'wechat_secret', type: 'password' },
    { label: '支付宝 AppID', key: 'alipay_appid', type: 'text' },
    { label: '支付宝密钥', key: 'alipay_secret', type: 'password' },
    { label: 'Stripe 公钥', key: 'stripe_public', type: 'text' },
    { label: 'Stripe 密钥', key: 'stripe_secret', type: 'password' },
    { label: 'OpenAI API Key', key: 'openai_key', type: 'password' },
    { label: 'Stability AI Key', key: 'stability_key', type: 'password' }
  ];
  const [settings, setSettings] = useState(() =>
    Object.fromEntries(settingsFields.map(f => [f.key, '']))
  );

  const handleSave = () => {
    notify.success('设置已保存');
  };

  return (
    <div>
      <h2 className="adminPageTitle">系统设置</h2>
      <div className="adminSettingsForm">
        {settingsFields.map(item => (
          <div key={item.key} className="adminFormField">
            <label className="adminLabel">{item.label}</label>
            <input
              type={item.type}
              placeholder={`请输入${item.label}`}
              className="adminInput"
              value={settings[item.key]}
              onChange={e => setSettings(prev => ({ ...prev, [item.key]: e.target.value }))}
            />
          </div>
        ))}
        <button onClick={handleSave} className="adminPrimaryBtn">保存设置</button>
      </div>
    </div>
  );
}

function LogsTab() {
  const MOCK_LOGS = [
    { id: 1, action: '用户登录', user: 'admin@example.com', ip: '192.168.1.1', time: '2025-05-07 10:30:00' },
    { id: 2, action: '模型配置更新', user: 'admin@example.com', ip: '192.168.1.1', time: '2025-05-07 10:25:00' },
    { id: 3, action: '算力批量发放', user: 'admin@example.com', ip: '192.168.1.1', time: '2025-05-07 09:15:00' },
    { id: 4, action: '用户封禁', user: 'admin@example.com', ip: '192.168.1.1', time: '2025-05-06 16:40:00' }
  ];

  return (
    <div>
      <h2 className="adminPageTitle">操作日志</h2>
      <div className="adminTableWrap">
        <table className="adminTable">
          <thead>
            <tr>
              {['ID', '操作', '操作人', 'IP', '时间'].map(h => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MOCK_LOGS.map(log => (
              <tr key={log.id}>
                <td className="adminCellMuted">{log.id}</td>
                <td>{log.action}</td>
                <td className="adminCellId">{log.user}</td>
                <td className="adminCellMuted">{log.ip}</td>
                <td className="adminCellMuted">{log.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TicketsAdminTab() {
  const notify = useNotification();
  const { getAuthHeaders } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({ open: 0, inProgress: 0, resolved: 0, closed: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => { loadTickets(); loadStats(); }, []);

  async function loadTickets() {
    setLoading(true);
    try {
      const res = await apiCall('/tickets/admin/all');
      const data = await res.json();
      if (data.success) setTickets(data.data?.tickets || []);
    } catch {}
    setLoading(false);
  }

  async function loadStats() {
    try {
      const res = await apiCall('/tickets/admin/stats');
      const data = await res.json();
      if (data.success) setStats(data.data);
    } catch {}
  }

  async function loadTicketDetail(id) {
    try {
      const res = await apiCall(`/tickets/admin/${id}`);
      const data = await res.json();
      if (data.success) setSelectedTicket(data.data);
    } catch {}
  }

  async function replyToTicket() {
    if (!replyText.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`${API_BASE}/api/tickets/admin/${selectedTicket.id}/messages`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ content: replyText })
      });
      const data = await res.json();
      if (data.success) {
        setReplyText('');
        loadTicketDetail(selectedTicket.id);
        notify.success('回复成功');
      }
    } catch {}
    setSending(false);
  }

  async function updateTicketStatus(id, status) {
    try {
      const res = await fetch(`${API_BASE}/api/tickets/admin/${id}/status`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        loadTickets();
        loadStats();
        if (selectedTicket) loadTicketDetail(selectedTicket.id);
        notify.success(`工单状态已更新为${status}`);
      }
    } catch {}
  }

  const statusLabels = { open: '待处理', in_progress: '处理中', resolved: '已解决', closed: '已关闭' };
  const statusColors = { open: '#f9ff72', in_progress: '#42e6ff', resolved: '#78ffb9', closed: '#73859f' };
  const categoryLabels = { bug: 'Bug反馈', feature: '功能建议', question: '使用疑问', account: '账号问题', payment: '支付问题', other: '其他' };

  if (selectedTicket) {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 className="adminPageTitle" style={{ marginBottom: 0 }}>工单 #{selectedTicket.id}: {selectedTicket.title}</h2>
          <button className="adminActionBtn" onClick={() => setSelectedTicket(null)}>返回列表</button>
        </div>
        <div style={{ marginBottom: '12px', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span style={{ color: statusColors[selectedTicket.status], fontSize: '12px', padding: '2px 8px', borderRadius: '10px', background: statusColors[selectedTicket.status] + '18' }}>
            {statusLabels[selectedTicket.status]}
          </span>
          <span style={{ color: '#73859f', fontSize: '12px' }}>{categoryLabels[selectedTicket.category] || selectedTicket.category}</span>
          <span style={{ color: '#73859f', fontSize: '12px' }}>用户: {selectedTicket.user?.nickname || selectedTicket.user?.email}</span>
        </div>
        <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '16px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
          {(selectedTicket.messages || []).map(msg => (
            <div key={msg.id} style={{ marginBottom: '12px', display: 'flex', justifyContent: msg.senderType === 'admin' ? 'flex-end' : 'flex-start' }}>
              <div style={{ maxWidth: '70%', padding: '10px 14px', borderRadius: '12px', background: msg.senderType === 'admin' ? 'rgba(66,230,255,0.15)' : 'rgba(255,255,255,0.06)', color: '#e0e6ed', fontSize: '14px' }}>
                <div style={{ fontSize: '11px', color: '#73859f', marginBottom: '4px' }}>{msg.senderType === 'admin' ? '客服' : '用户'} · {new Date(msg.createdAt).toLocaleString('zh-CN')}</div>
                {msg.content}
              </div>
            </div>
          ))}
        </div>
        {selectedTicket.status !== 'closed' && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <input className="adminInput" value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="输入回复内容..." style={{ flex: 1 }} onKeyDown={e => e.key === 'Enter' && replyToTicket()} />
            <button className="adminPrimaryBtn" onClick={replyToTicket} disabled={sending}><Send size={14} /></button>
          </div>
        )}
        <div style={{ display: 'flex', gap: '8px' }}>
          {selectedTicket.status === 'open' && <button className="adminActionBtn" onClick={() => updateTicketStatus(selectedTicket.id, 'in_progress')}>开始处理</button>}
          {selectedTicket.status === 'in_progress' && <button className="adminActionBtn" onClick={() => updateTicketStatus(selectedTicket.id, 'resolved')}>标记已解决</button>}
          {selectedTicket.status !== 'closed' && <button className="adminActionBtn danger" onClick={() => updateTicketStatus(selectedTicket.id, 'closed')}>关闭工单</button>}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="adminPageTitle">客服管理</h2>
      <div className="adminStatGrid" style={{ marginBottom: '16px' }}>
        <div className="adminStatCard"><div className="adminStatLabel">待处理</div><div className="adminStatValue" style={{ color: '#f9ff72' }}>{stats.open}</div></div>
        <div className="adminStatCard"><div className="adminStatLabel">处理中</div><div className="adminStatValue" style={{ color: '#42e6ff' }}>{stats.inProgress}</div></div>
        <div className="adminStatCard"><div className="adminStatLabel">已解决</div><div className="adminStatValue" style={{ color: '#78ffb9' }}>{stats.resolved}</div></div>
        <div className="adminStatCard"><div className="adminStatLabel">已关闭</div><div className="adminStatValue" style={{ color: '#73859f' }}>{stats.closed}</div></div>
      </div>
      {loading ? <div style={{ color: '#73859f', padding: '20px' }}>加载中...</div> : (
        <div className="adminTableWrap">
          <table className="adminTable">
            <thead>
              <tr>{['ID', '标题', '用户', '分类', '状态', '消息数', '创建时间', '操作'].map(h => <th key={h}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {tickets.map(t => (
                <tr key={t.id}>
                  <td className="adminCellId">{t.id}</td>
                  <td>{t.title}</td>
                  <td className="adminCellMuted">{t.user?.nickname || t.user?.email}</td>
                  <td className="adminCellMuted">{categoryLabels[t.category] || t.category}</td>
                  <td><span style={{ color: statusColors[t.status] }}>{statusLabels[t.status]}</span></td>
                  <td className="adminCellMuted">{t._count?.messages || 0}</td>
                  <td className="adminCellMuted">{new Date(t.createdAt).toLocaleString('zh-CN')}</td>
                  <td><button className="adminActionBtn" onClick={() => loadTicketDetail(t.id)}>查看</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function NotificationsAdminTab() {
  const notify = useNotification();
  const { getAuthHeaders } = useAuth();
  const [form, setForm] = useState({ title: '', content: '', type: 'system', targetRole: 'all' });
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({ total: 0, today: 0, thisWeek: 0 });
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => { loadHistory(); loadStats(); }, []);

  async function loadHistory() {
    setLoading(true);
    try {
      const res = await apiCall('/notifications/admin/history');
      const data = await res.json();
      if (data.success) setHistory(data.data?.notifications || []);
    } catch {}
    setLoading(false);
  }

  async function loadStats() {
    try {
      const res = await apiCall('/notifications/admin/stats');
      const data = await res.json();
      if (data.success) setStats(data.data);
    } catch {}
  }

  async function sendNotification() {
    if (!form.title || !form.content) {
      notify.error('标题和内容不能为空');
      return;
    }
    setSending(true);
    try {
      const res = await fetch(`${API_BASE}/api/notifications/admin/send`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (data.success) {
        notify.success('通知发送成功');
        setForm({ title: '', content: '', type: 'system', targetRole: 'all' });
        loadHistory();
        loadStats();
      } else {
        notify.error(data.error || '发送失败');
      }
    } catch { notify.error('网络错误'); }
    setSending(false);
  }

  const typeLabels = { system: '系统通知', activity: '活动通知', maintenance: '维护通知', payment: '支付通知' };
  const roleLabels = { all: '所有人', user: '普通用户', admin: '管理员' };

  return (
    <div>
      <h2 className="adminPageTitle">通知管理</h2>
      <div className="adminStatGrid" style={{ marginBottom: '16px' }}>
        <div className="adminStatCard"><div className="adminStatLabel">总通知数</div><div className="adminStatValue" style={{ color: '#42e6ff' }}>{stats.total}</div></div>
        <div className="adminStatCard"><div className="adminStatLabel">今日发送</div><div className="adminStatValue" style={{ color: '#78ffb9' }}>{stats.today}</div></div>
        <div className="adminStatCard"><div className="adminStatLabel">本周发送</div><div className="adminStatValue" style={{ color: '#f9ff72' }}>{stats.thisWeek}</div></div>
      </div>
      <div className="adminGrid2">
        <div className="adminCard">
          <h3 className="adminCardTitle">发送通知</h3>
          <div className="adminFormField">
            <label className="adminLabel">通知类型</label>
            <select className="adminInput" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
              {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div className="adminFormField">
            <label className="adminLabel">目标受众</label>
            <select className="adminInput" value={form.targetRole} onChange={e => setForm(p => ({ ...p, targetRole: e.target.value }))}>
              {Object.entries(roleLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div className="adminFormField">
            <label className="adminLabel">标题</label>
            <input className="adminInput" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="通知标题" />
          </div>
          <div className="adminFormField">
            <label className="adminLabel">内容</label>
            <textarea className="adminInput" value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} placeholder="通知内容" rows={4} style={{ resize: 'vertical' }} />
          </div>
          <button className="adminPrimaryBtn" onClick={sendNotification} disabled={sending}>
            <Send size={14} /> {sending ? '发送中...' : '发送通知'}
          </button>
        </div>
        <div className="adminCard">
          <h3 className="adminCardTitle">通知历史</h3>
          {loading ? <div style={{ color: '#73859f' }}>加载中...</div> : (
            history.length > 0 ? (
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {history.map(n => (
                  <div key={n.id} style={{ padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ color: '#e0e6ed', fontSize: '14px' }}>{n.title}</strong>
                      <span style={{ color: '#73859f', fontSize: '11px' }}>{new Date(n.createdAt).toLocaleString('zh-CN')}</span>
                    </div>
                    <div style={{ color: '#73859f', fontSize: '13px', marginTop: '4px' }}>{n.content}</div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px', fontSize: '11px', color: '#5a6a80' }}>
                      <span>{typeLabels[n.type] || n.type}</span>
                      <span>·</span>
                      <span>{roleLabels[n.targetRole] || '所有人'}</span>
                      <span>·</span>
                      <span>已读率 {n.readRate}%</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : <div style={{ color: '#73859f', fontSize: '14px' }}>暂无通知历史</div>
          )}
        </div>
      </div>
    </div>
  );
}
