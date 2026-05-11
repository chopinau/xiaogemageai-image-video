import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { AI_MODELS } from '../../config/models';
import { Layout, BarChart3, Users, Cpu, ShoppingCart, Coins, Share2, Settings, FileText, Menu, X, DollarSign } from 'lucide-react';
import { PricingAdmin } from './PricingAdmin';

const ADMIN_TABS = [
  { id: 'dashboard', label: '仪表盘', icon: BarChart3 },
  { id: 'users', label: '用户管理', icon: Users },
  { id: 'models', label: '模型管理', icon: Cpu },
  { id: 'pricing', label: '价格管理', icon: DollarSign },
  { id: 'orders', label: '订单管理', icon: ShoppingCart },
  { id: 'credits', label: '算力管理', icon: Coins },
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
  const d = MOCK_DASHBOARD;
  return (
    <div>
      <h2 className="adminPageTitle">仪表盘</h2>
      <div className="adminStatGrid">
        <StatCard label="总用户数" value={d.totalUsers} color="#42e6ff" />
        <StatCard label="活跃用户" value={d.activeUsers} color="#78ffb9" />
        <StatCard label="总收入" value={d.totalRevenue} color="#f9ff72" prefix="¥" />
        <StatCard label="月收入" value={d.monthlyRevenue} color="#f9ff72" prefix="¥" />
        <StatCard label="总生成量" value={d.totalGenerations} color="#9eeeff" />
        <StatCard label="今日生成" value={d.todayGenerations} color="#9eeeff" />
        <StatCard label="算力发放" value={d.creditsIssued} color="#ff74a6" />
        <StatCard label="算力消耗" value={d.creditsConsumed} color="#ff74a6" />
      </div>
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
