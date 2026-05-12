import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { historyManager } from '../services/historyManager';
import { useCredits } from '../contexts/CreditsContext';
import { useAuth } from '../contexts/AuthContext';
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
  Sparkles,
  Zap,
  Layers,
  Wand2,
  Camera,
  Scissors,
  Palette,
  Trash2,
  CreditCard,
  Clock,
  Send,
  Plus,
  MessageCircle,
  Key,
  Eye,
  EyeOff,
  Copy,
  Check
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

const NAV_ITEMS = [
  { id: 'works', label: '我的作品', icon: ImageIcon },
  { id: 'payments', label: '支付记录', icon: CreditCard },
  { id: 'consumption', label: '消费记录', icon: Clock },
  { id: 'settings', label: '设置', icon: Settings },
  { id: 'api', label: 'API', icon: Cpu },
  { id: 'referral', label: '推荐码', icon: Gift },
  { id: 'membership', label: '会员中心', icon: Crown },
  { id: 'help', label: '客服中心', icon: HelpCircle }
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

const TICKET_CATEGORIES = [
  { value: 'bug', label: 'Bug反馈' },
  { value: 'feature', label: '功能建议' },
  { value: 'question', label: '使用疑问' },
  { value: 'account', label: '账号问题' },
  { value: 'payment', label: '支付问题' },
  { value: 'other', label: '其他' }
];

const STATUS_MAP = {
  open: { label: '待处理', color: '#f9ff72' },
  in_progress: { label: '处理中', color: '#42e6ff' },
  resolved: { label: '已解决', color: '#78ffb9' },
  closed: { label: '已关闭', color: '#73859f' }
};

const formatTime = (timestamp) => {
  const now = Date.now();
  const diff = now - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 5) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  return new Date(timestamp).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  });
};

const groupByTime = (items) => {
  const groups = {};
  const now = Date.now();
  items.forEach(item => {
    const ts = new Date(item.timestamp || item.createdAt).getTime();
    const diff = now - ts;
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

export function UserDashboard() {
  const navigate = useNavigate();
  const { credits, fetchBalance } = useCredits();
  const { user, getAuthHeaders, updateProfile } = useAuth();

  const [activeTab, setActiveTab] = useState('works');
  const [selectedTab, setSelectedTab] = useState('all');
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const allHistory = [
      ...historyManager.getHistory('image').map(h => ({ ...h, type: 'image' })),
      ...historyManager.getHistory('video').map(h => ({ ...h, type: 'video' }))
    ].sort((a, b) => b.timestamp - a.timestamp);
    setHistory(allHistory);
    fetchBalance();
  }, [fetchBalance]);

  const filteredHistory = history;
  const groupedHistory = groupByTime(filteredHistory);

  const handleDownload = (item) => {
    if (item.imageUrl) {
      const a = document.createElement('a');
      a.href = item.imageUrl;
      a.download = `ai-work-${item.id}.png`;
      a.click();
    }
  };

  const handleGoBack = () => navigate('/');

  const membershipLabel = { free: '免费版', basic: '基础版', pro: '专业版', enterprise: '企业版' }[user?.membership || 'free'] || '免费版';

  return (
    <div className="userDashboard">
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
      </div>

      <div className="dashboardBody">
        <div className="mainContent">
          {activeTab === 'works' && (
            <WorksTab
              selectedTab={selectedTab}
              setSelectedTab={setSelectedTab}
              groupedHistory={groupedHistory}
              handleDownload={handleDownload}
              navigate={navigate}
            />
          )}
          {activeTab === 'payments' && <PaymentsTab />}
          {activeTab === 'consumption' && <ConsumptionTab />}
          {activeTab === 'settings' && <SettingsTab />}
          {activeTab === 'api' && <ApiKeyTab />}
          {activeTab === 'referral' && <ReferralTab />}
          {activeTab === 'membership' && <MembershipTab navigate={navigate} />}
          {activeTab === 'help' && <HelpTab />}
        </div>

        <div className="sidePanel">
          <div className="userCard">
            <div className="userCardHeader">
              <div className="userAvatarLarge">
                {user?.avatar ? <img src={user.avatar} alt="" /> : <User size={28} />}
              </div>
              <div className="userInfo">
                <h3>{user?.nickname || user?.email?.split('@')[0] || '用户'}</h3>
                <div className="userBadge">{membershipLabel}</div>
              </div>
            </div>
            <div className="userDetails">
              <div className="userDetailRow">
                <span className="label">邮箱</span>
                <span className="value">{user?.email || '-'}</span>
              </div>
              <div className="userDetailRow">
                <span className="label">注册时间</span>
                <span className="value">{user?.createdAt ? formatDate(user.createdAt) : '-'}</span>
              </div>
            </div>
          </div>

          <div className="statsCard">
            <div className="statsTitle">
              <Sparkles size={16} />
              <span>AI 创作</span>
            </div>
            <div className="statsGrid">
              <div className="statItem">
                <div className="statLabel">当前算力</div>
                <div className="statValue">{typeof credits === 'number' ? credits.toFixed(1) : '-'}</div>
              </div>
              <div className="statItem">
                <div className="statLabel">累计消费</div>
                <div className="statValue">{user?.totalSpent?.toFixed(1) || '0'}</div>
              </div>
              <div className="statItem">
                <div className="statLabel">作品数量</div>
                <div className="statValue">{history.length}</div>
              </div>
              <div className="statItem">
                <div className="statLabel">会员等级</div>
                <div className="statValue">{membershipLabel}</div>
              </div>
            </div>
          </div>

          <div className="toolsCard">
            <div className="toolsTitle">快捷工具</div>
            <div className="toolsGrid">
              {SCENE_TOOLS.map(tool => {
                const Icon = tool.icon;
                return (
                  <button key={tool.id} className="toolBtn" onClick={() => navigate('/')}>
                    <div className="toolIcon" style={{ backgroundColor: tool.color + '20', color: tool.color }}>
                      <Icon size={20} />
                    </div>
                    <span>{tool.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

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

function WorksTab({ selectedTab, setSelectedTab, groupedHistory, handleDownload, navigate }) {
  return (
    <>
      <div className="worksTabBar">
        <button className={`worksTab ${selectedTab === 'all' ? 'active' : ''}`} onClick={() => setSelectedTab('all')}>我的作品</button>
        <button className={`worksTab ${selectedTab === 'image' ? 'active' : ''}`} onClick={() => setSelectedTab('image')}>图片</button>
        <button className={`worksTab ${selectedTab === 'video' ? 'active' : ''}`} onClick={() => setSelectedTab('video')}>视频</button>
      </div>
      <div className="worksContent">
        {Object.entries(groupedHistory).length > 0 ? (
          Object.entries(groupedHistory).map(([timeGroup, items]) => (
            <div key={timeGroup} className="timeGroup">
              <div className="timeGroupHeader"><h4>{timeGroup}</h4></div>
              <div className="worksGrid">
                {items.map(item => (
                  <div key={item.id} className="workCard">
                    <div className="workImage">
                      {item.imageUrl ? <img src={item.imageUrl} alt={item.prompt || 'AI作品'} /> : <div className="workPlaceholder"><ImageIcon size={32} /></div>}
                      <div className="workActions">
                        <button className="workBtn" onClick={() => handleDownload(item)}><Download size={14} /></button>
                        <button className="workBtn"><RefreshCw size={14} /></button>
                        <button className="workBtn"><Trash2 size={14} /></button>
                      </div>
                    </div>
                    <div className="workInfo"><span className="workCost">花费 {item.cost || 0} 算力</span></div>
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
            <button className="primaryBtn" onClick={() => navigate('/')}>开始创作</button>
          </div>
        )}
      </div>
    </>
  );
}

function PaymentsTab() {
  const { getAuthHeaders } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadOrders(); }, []);

  async function loadOrders() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/payments/orders/me?page=1&limit=10`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) setOrders(data.data?.orders || data.data || []);
    } catch {}
    setLoading(false);
  }

  const statusLabels = { pending: '待支付', paid: '已支付', failed: '支付失败', refunded: '已退款', cancelled: '已取消' };
  const statusColors = { pending: '#f9ff72', paid: '#78ffb9', failed: '#ff6b8a', refunded: '#73859f', cancelled: '#5a6a80' };
  const methodLabels = { wechat: '微信支付', alipay: '支付宝' };

  return (
    <div>
      <h2 className="adminPageTitle" style={{ color: '#e0e6ed' }}>支付记录</h2>
      {loading ? <div style={{ color: '#73859f', padding: '20px' }}>加载中...</div> : (
        orders.length > 0 ? (
          <div className="adminTableWrap">
            <table className="adminTable">
              <thead>
                <tr>
                  {['订单号', '商品', '金额', '支付方式', '状态', '创建时间', '支付时间'].map(h => <th key={h}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id}>
                    <td className="adminCellId">{o.orderId}</td>
                    <td>{o.product}</td>
                    <td className="adminCellCredits">¥{o.amount}</td>
                    <td className="adminCellMuted">{methodLabels[o.paymentMethod] || o.paymentMethod || '-'}</td>
                    <td><span style={{ color: statusColors[o.paymentStatus] || '#73859f' }}>{statusLabels[o.paymentStatus] || o.paymentStatus}</span></td>
                    <td className="adminCellMuted">{formatDate(o.createdAt)}</td>
                    <td className="adminCellMuted">{formatDate(o.paidAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <div className="emptyState"><CreditCard size={48} className="emptyIcon" /><h3>暂无支付记录</h3></div>
      )}
    </div>
  );
}

function ConsumptionTab() {
  const { getAuthHeaders } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [usageRecords, setUsageRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subTab, setSubTab] = useState('transactions');

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [tRes, uRes] = await Promise.all([
        fetch(`${API_BASE}/api/credits/history?page=1&limit=50`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE}/api/usage/history?page=1&limit=50`, { headers: getAuthHeaders() })
      ]);
      const tData = await tRes.json();
      const uData = await uRes.json();
      if (tData.success) setTransactions(tData.data?.transactions || tData.data || []);
      if (uData.success) setUsageRecords(uData.data?.records || uData.data || []);
    } catch {}
    setLoading(false);
  }

  const typeLabels = { recharge: '充值', consume: '消费', checkin: '签到', gift: '赠送', refund: '退款', admin_grant: '管理员发放' };

  return (
    <div>
      <h2 className="adminPageTitle" style={{ color: '#e0e6ed' }}>消费记录</h2>
      <div className="worksTabBar" style={{ marginBottom: '16px' }}>
        <button className={`worksTab ${subTab === 'transactions' ? 'active' : ''}`} onClick={() => setSubTab('transactions')}>算力流水</button>
        <button className={`worksTab ${subTab === 'usage' ? 'active' : ''}`} onClick={() => setSubTab('usage')}>使用记录</button>
      </div>
      {loading ? <div style={{ color: '#73859f', padding: '20px' }}>加载中...</div> : (
        subTab === 'transactions' ? (
          transactions.length > 0 ? (
            <div className="adminTableWrap">
              <table className="adminTable">
                <thead>
                  <tr>{['时间', '类型', '金额', '余额', '描述'].map(h => <th key={h}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {transactions.map(t => (
                    <tr key={t.id}>
                      <td className="adminCellMuted">{formatDate(t.createdAt)}</td>
                      <td><span style={{ color: t.amount > 0 ? '#78ffb9' : '#ff6b8a' }}>{typeLabels[t.type] || t.type}</span></td>
                      <td style={{ color: t.amount > 0 ? '#78ffb9' : '#ff6b8a' }}>{t.amount > 0 ? '+' : ''}{t.amount}</td>
                      <td>{t.balance}</td>
                      <td className="adminCellMuted">{t.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <div className="emptyState"><Clock size={48} className="emptyIcon" /><h3>暂无算力流水</h3></div>
        ) : (
          usageRecords.length > 0 ? (
            <div className="adminTableWrap">
              <table className="adminTable">
                <thead>
                  <tr>{['时间', '类型', '模型', '消耗算力', '分辨率', '状态'].map(h => <th key={h}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {usageRecords.map(u => (
                    <tr key={u.id}>
                      <td className="adminCellMuted">{formatDate(u.createdAt)}</td>
                      <td>{u.type}</td>
                      <td>{u.model}</td>
                      <td style={{ color: '#ff6b8a' }}>-{u.cost}</td>
                      <td className="adminCellMuted">{u.resolution || '-'}</td>
                      <td><span style={{ color: u.status === 'success' ? '#78ffb9' : '#ff6b8a' }}>{u.status === 'success' ? '成功' : '失败'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <div className="emptyState"><Clock size={48} className="emptyIcon" /><h3>暂无使用记录</h3></div>
        )
      )}
    </div>
  );
}

function SettingsTab() {
  const { user, getAuthHeaders, updateProfile } = useAuth();
  const [nickname, setNickname] = useState(user?.nickname || '');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showOldPw, setShowOldPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  async function handleSaveProfile() {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/profile`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ nickname })
      });
      const data = await res.json();
      if (data.success) {
        updateProfile({ nickname });
        setMsg('保存成功');
      } else { setMsg(data.error || '保存失败'); }
    } catch { setMsg('网络错误'); }
    setSaving(false);
    setTimeout(() => setMsg(''), 3000);
  }

  async function handleChangePassword() {
    if (!oldPassword || !newPassword) { setMsg('请填写完整密码'); return; }
    if (newPassword.length < 6) { setMsg('新密码至少6位'); return; }
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/password`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ oldPassword, newPassword })
      });
      const data = await res.json();
      if (data.success) { setMsg('密码修改成功'); setOldPassword(''); setNewPassword(''); }
      else { setMsg(data.error || '修改失败'); }
    } catch { setMsg('网络错误'); }
    setSaving(false);
    setTimeout(() => setMsg(''), 3000);
  }

  return (
    <div>
      <h2 className="adminPageTitle" style={{ color: '#e0e6ed' }}>设置</h2>
      {msg && <div style={{ padding: '8px 12px', marginBottom: '12px', borderRadius: '8px', background: msg.includes('成功') ? 'rgba(120,255,185,0.12)' : 'rgba(255,106,138,0.12)', color: msg.includes('成功') ? '#78ffb9' : '#ff6b8a', fontSize: '13px' }}>{msg}</div>}
      <div className="adminCard" style={{ marginBottom: '16px' }}>
        <h3 className="adminCardTitle">个人资料</h3>
        <div className="adminFormField">
          <label className="adminLabel">昵称</label>
          <input className="adminInput" value={nickname} onChange={e => setNickname(e.target.value)} placeholder="输入昵称" />
        </div>
        <div className="adminFormField">
          <label className="adminLabel">邮箱</label>
          <input className="adminInput" value={user?.email || ''} disabled style={{ opacity: 0.5 }} />
        </div>
        <button className="adminPrimaryBtn" onClick={handleSaveProfile} disabled={saving}>{saving ? '保存中...' : '保存'}</button>
      </div>
      <div className="adminCard">
        <h3 className="adminCardTitle">修改密码</h3>
        <div className="adminFormField">
          <label className="adminLabel">当前密码</label>
          <div style={{ position: 'relative' }}>
            <input className="adminInput" type={showOldPw ? 'text' : 'password'} value={oldPassword} onChange={e => setOldPassword(e.target.value)} placeholder="输入当前密码" />
            <button style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#73859f', cursor: 'pointer' }} onClick={() => setShowOldPw(!showOldPw)}>{showOldPw ? <EyeOff size={14} /> : <Eye size={14} />}</button>
          </div>
        </div>
        <div className="adminFormField">
          <label className="adminLabel">新密码</label>
          <div style={{ position: 'relative' }}>
            <input className="adminInput" type={showNewPw ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="输入新密码（至少6位）" />
            <button style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#73859f', cursor: 'pointer' }} onClick={() => setShowNewPw(!showNewPw)}>{showNewPw ? <EyeOff size={14} /> : <Eye size={14} />}</button>
          </div>
        </div>
        <button className="adminPrimaryBtn" onClick={handleChangePassword} disabled={saving}>{saving ? '修改中...' : '修改密码'}</button>
      </div>
    </div>
  );
}

function ApiKeyTab() {
  const { getAuthHeaders } = useAuth();
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => { loadApiKey(); }, []);

  async function loadApiKey() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/api-key`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) setApiKey(data.data?.apiKey || '');
    } catch {}
    setLoading(false);
  }

  async function generateKey() {
    try {
      const res = await fetch(`${API_BASE}/api/auth/api-key`, { method: 'POST', headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) setApiKey(data.data?.apiKey || '');
    } catch {}
  }

  function copyKey() {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div>
      <h2 className="adminPageTitle" style={{ color: '#e0e6ed' }}>API 密钥</h2>
      <div className="adminCard">
        <h3 className="adminCardTitle">你的 API Key</h3>
        <p style={{ color: '#73859f', fontSize: '13px', marginBottom: '12px' }}>使用 API Key 可以通过接口调用 AI 生成服务</p>
        {loading ? <div style={{ color: '#73859f' }}>加载中...</div> : (
          <>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
              <input className="adminInput" value={apiKey || '尚未生成'} readOnly style={{ flex: 1, fontFamily: 'monospace' }} />
              {apiKey && <button className="adminActionBtn" onClick={copyKey}>{copied ? <Check size={14} /> : <Copy size={14} />}</button>}
            </div>
            <button className="adminPrimaryBtn" onClick={generateKey}>
              <Key size={14} /> {apiKey ? '重新生成' : '生成 API Key'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function ReferralTab() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ count: 0, credits: 0 });

  const referralCode = user?.referralCode || '-';
  const referralLink = `${window.location.origin}/register?ref=${referralCode}`;
  const [copied, setCopied] = useState(false);

  function copyLink() {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div>
      <h2 className="adminPageTitle" style={{ color: '#e0e6ed' }}>推荐码</h2>
      <div className="adminCard" style={{ marginBottom: '16px' }}>
        <h3 className="adminCardTitle">我的推荐码</h3>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
          <input className="adminInput" value={referralCode} readOnly style={{ flex: 1, fontFamily: 'monospace' }} />
          <button className="adminActionBtn" onClick={copyLink}>{copied ? <Check size={14} /> : <Copy size={14} />}</button>
        </div>
        <p style={{ color: '#73859f', fontSize: '13px' }}>分享推荐链接给好友，好友注册后你将获得 1 算力奖励</p>
      </div>
      <div className="adminCard">
        <h3 className="adminCardTitle">推荐统计</h3>
        <div className="adminStatGrid" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className="adminStatCard"><div className="adminStatLabel">已推荐人数</div><div className="adminStatValue" style={{ color: '#42e6ff' }}>{stats.count}</div></div>
          <div className="adminStatCard"><div className="adminStatLabel">获得算力</div><div className="adminStatValue" style={{ color: '#78ffb9' }}>{stats.credits}</div></div>
        </div>
      </div>
    </div>
  );
}

function MembershipTab({ navigate }) {
  const { user } = useAuth();
  const membershipLabel = { free: '免费版', basic: '基础版', pro: '专业版', enterprise: '企业版' }[user?.membership || 'free'] || '免费版';

  return (
    <div>
      <h2 className="adminPageTitle" style={{ color: '#e0e6ed' }}>会员中心</h2>
      <div className="adminCard" style={{ marginBottom: '16px' }}>
        <h3 className="adminCardTitle">当前会员</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <Crown size={24} style={{ color: '#f9ff72' }} />
          <div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#e0e6ed' }}>{membershipLabel}</div>
            {user?.membershipExpire && <div style={{ color: '#73859f', fontSize: '12px' }}>到期时间：{formatDate(user.membershipExpire)}</div>}
          </div>
        </div>
        <button className="adminPrimaryBtn" onClick={() => navigate('/pricing')}>升级会员</button>
      </div>
    </div>
  );
}

function HelpTab() {
  const { getAuthHeaders } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [newTicket, setNewTicket] = useState({ category: 'question', title: '', message: '' });
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => { loadTickets(); }, []);

  async function loadTickets() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/tickets`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) setTickets(data.data?.tickets || []);
    } catch {}
    setLoading(false);
  }

  async function createTicket() {
    if (!newTicket.title || !newTicket.message) return;
    setSending(true);
    try {
      const res = await fetch(`${API_BASE}/api/tickets`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newTicket)
      });
      const data = await res.json();
      if (data.success) {
        setShowCreate(false);
        setNewTicket({ category: 'question', title: '', message: '' });
        loadTickets();
      }
    } catch {}
    setSending(false);
  }

  async function loadTicketDetail(id) {
    try {
      const res = await fetch(`${API_BASE}/api/tickets/${id}`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) setSelectedTicket(data.data);
    } catch {}
  }

  async function sendMessage() {
    if (!newMessage.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`${API_BASE}/api/tickets/${selectedTicket.id}/messages`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ content: newMessage })
      });
      const data = await res.json();
      if (data.success) {
        setNewMessage('');
        loadTicketDetail(selectedTicket.id);
      }
    } catch {}
    setSending(false);
  }

  async function closeTicket(id) {
    try {
      const res = await fetch(`${API_BASE}/api/tickets/${id}/status`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: 'closed' })
      });
      if (res.ok) { loadTickets(); setSelectedTicket(null); }
    } catch {}
  }

  if (selectedTicket) {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 className="adminPageTitle" style={{ color: '#e0e6ed', marginBottom: 0 }}>{selectedTicket.title}</h2>
          <button className="adminActionBtn" onClick={() => setSelectedTicket(null)}>返回列表</button>
        </div>
        <div style={{ marginBottom: '12px', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span style={{ color: STATUS_MAP[selectedTicket.status]?.color, fontSize: '12px', padding: '2px 8px', borderRadius: '10px', background: STATUS_MAP[selectedTicket.status]?.color + '18' }}>
            {STATUS_MAP[selectedTicket.status]?.label}
          </span>
          <span style={{ color: '#73859f', fontSize: '12px' }}>{TICKET_CATEGORIES.find(c => c.value === selectedTicket.category)?.label}</span>
        </div>
        <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '16px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
          {(selectedTicket.messages || []).map(msg => (
            <div key={msg.id} style={{ marginBottom: '12px', display: 'flex', justifyContent: msg.senderType === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{ maxWidth: '70%', padding: '10px 14px', borderRadius: '12px', background: msg.senderType === 'user' ? 'rgba(66,230,255,0.15)' : 'rgba(255,255,255,0.06)', color: '#e0e6ed', fontSize: '14px' }}>
                <div style={{ fontSize: '11px', color: '#73859f', marginBottom: '4px' }}>{msg.senderType === 'user' ? '我' : '客服'} · {formatTime(msg.createdAt)}</div>
                {msg.content}
              </div>
            </div>
          ))}
        </div>
        {selectedTicket.status !== 'closed' ? (
          <div style={{ display: 'flex', gap: '8px' }}>
            <input className="adminInput" value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="输入消息..." style={{ flex: 1 }} onKeyDown={e => e.key === 'Enter' && sendMessage()} />
            <button className="adminPrimaryBtn" onClick={sendMessage} disabled={sending}><Send size={14} /></button>
          </div>
        ) : (
          <div style={{ color: '#73859f', fontSize: '13px', textAlign: 'center' }}>此工单已关闭</div>
        )}
        {selectedTicket.status !== 'closed' && (
          <button className="adminActionBtn danger" style={{ marginTop: '12px' }} onClick={() => closeTicket(selectedTicket.id)}>关闭工单</button>
        )}
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 className="adminPageTitle" style={{ color: '#e0e6ed', marginBottom: 0 }}>客服中心</h2>
        <button className="adminPrimaryBtn" onClick={() => setShowCreate(!showCreate)}><Plus size={14} /> 新建工单</button>
      </div>

      {showCreate && (
        <div className="adminCard" style={{ marginBottom: '16px' }}>
          <h3 className="adminCardTitle">新建工单</h3>
          <div className="adminFormField">
            <label className="adminLabel">问题分类</label>
            <select className="adminInput" value={newTicket.category} onChange={e => setNewTicket(p => ({ ...p, category: e.target.value }))}>
              {TICKET_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div className="adminFormField">
            <label className="adminLabel">标题</label>
            <input className="adminInput" value={newTicket.title} onChange={e => setNewTicket(p => ({ ...p, title: e.target.value }))} placeholder="简要描述你的问题" />
          </div>
          <div className="adminFormField">
            <label className="adminLabel">详细描述</label>
            <textarea className="adminInput" value={newTicket.message} onChange={e => setNewTicket(p => ({ ...p, message: e.target.value }))} placeholder="详细描述你遇到的问题..." rows={4} style={{ resize: 'vertical' }} />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="adminPrimaryBtn" onClick={createTicket} disabled={sending}>{sending ? '提交中...' : '提交工单'}</button>
            <button className="adminActionBtn" onClick={() => setShowCreate(false)}>取消</button>
          </div>
        </div>
      )}

      {loading ? <div style={{ color: '#73859f', padding: '20px' }}>加载中...</div> : (
        tickets.length > 0 ? (
          <div className="adminTableWrap">
            <table className="adminTable">
              <thead>
                <tr>{['标题', '分类', '状态', '消息数', '创建时间', '操作'].map(h => <th key={h}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {tickets.map(t => (
                  <tr key={t.id}>
                    <td>{t.title}</td>
                    <td className="adminCellMuted">{TICKET_CATEGORIES.find(c => c.value === t.category)?.label || t.category}</td>
                    <td><span style={{ color: STATUS_MAP[t.status]?.color }}>{STATUS_MAP[t.status]?.label}</span></td>
                    <td className="adminCellMuted">{t._count?.messages || t.messages?.length || 0}</td>
                    <td className="adminCellMuted">{formatDate(t.createdAt)}</td>
                    <td><button className="adminActionBtn" onClick={() => loadTicketDetail(t.id)}>查看</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <div className="emptyState"><MessageCircle size={48} className="emptyIcon" /><h3>暂无工单</h3><p>遇到问题？创建一个工单，客服会尽快回复</p></div>
      )}
    </div>
  );
}
