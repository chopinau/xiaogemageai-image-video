import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { DISTRIBUTION_LEVELS, getDistributionLevel, generateReferralLink, calculateCommission } from '../../config/distribution';
import { Copy, Users, DollarSign, TrendingUp, ArrowUpRight, Wallet, Clock, CheckCircle, X } from 'lucide-react';

const MOCK_COMMISSIONS = [
  { id: 1, userId: 'user_003', nickname: '设计师小张', type: 'first_year', plan: 'pro', amount: 99, commission: 19.80, status: 'paid', createdAt: '2025-05-01' },
  { id: 2, userId: 'user_004', nickname: '电商小刘', type: 'first_year', plan: 'basic', amount: 29, commission: 5.80, status: 'paid', createdAt: '2025-04-28' },
  { id: 3, userId: 'user_005', nickname: '新用户小王', type: 'first_year', plan: 'enterprise', amount: 299, commission: 59.80, status: 'pending', createdAt: '2025-05-05' }
];

const MOCK_WITHDRAWALS = [
  { id: 'W001', amount: 50, method: 'wechat', status: 'completed', createdAt: '2025-04-20', completedAt: '2025-04-21' }
];

export function AffiliatePage({ language }) {
  const { user } = useAuth();
  const notify = useNotification();
  const [referralLink] = useState(() => user ? generateReferralLink(user.id || 'demo') : '');
  const [stats, setStats] = useState({ clicks: 24, registrations: 3, conversions: 2, totalCommission: 85.40, availableCommission: 35.40 });
  const [commissions] = useState(MOCK_COMMISSIONS);
  const [withdrawals, setWithdrawals] = useState(MOCK_WITHDRAWALS);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('wechat');
  const [activeTab, setActiveTab] = useState('overview');

  const currentLevel = getDistributionLevel(stats.registrations);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink).then(() => {
      notify.success('推广链接已复制');
    }).catch(() => {
      notify.error('复制失败，请手动复制');
    });
  };

  const handleWithdraw = () => {
    const amount = Number(withdrawAmount);
    if (!amount || amount < currentLevel.minWithdraw) {
      notify.error(`最低提现金额为 ¥${currentLevel.minWithdraw}`);
      return;
    }
    if (amount > stats.availableCommission) {
      notify.error('可提现佣金不足');
      return;
    }
    notify.success(`提现申请已提交，¥${amount} 将在1-3个工作日内到账`);
    setStats(prev => ({ ...prev, availableCommission: prev.availableCommission - amount }));
    setWithdrawals(prev => [{
      id: 'W' + Date.now(),
      amount,
      method: withdrawMethod,
      status: 'pending',
      createdAt: new Date().toISOString().slice(0, 10),
      completedAt: null
    }, ...prev]);
    setShowWithdraw(false);
    setWithdrawAmount('');
  };

  return (
    <div className="sharedSection">
      <div className="pageHeader">
        <h1>推广中心</h1>
        <p className="subtitle">分享 AI 创作平台，赚取佣金</p>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{
          padding: '24px', borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(9,15,32,0.68)',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <h3 style={{ margin: 0, color: currentLevel.color }}>{currentLevel.name}</h3>
            <span style={{ fontSize: '13px', color: '#73859f' }}>
              首年佣金 {currentLevel.firstYearCommission * 100}% · 续费佣金 {currentLevel.renewalCommission * 100}%
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              readOnly
              value={referralLink}
              style={{
                flex: 1, height: '40px', padding: '0 12px',
                border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px',
                background: 'rgba(255,255,255,0.04)', color: '#9eeeff', fontSize: '13px',
                outline: 'none', fontFamily: 'inherit', minWidth: 0
              }}
            />
            <button onClick={handleCopyLink} style={{
              padding: '0 16px', height: '40px', borderRadius: '8px', border: 'none',
              background: 'linear-gradient(135deg, #42e6ff, #78ffb9)',
              color: '#06101a', fontSize: '14px', fontWeight: 800, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'inherit', flexShrink: 0
            }}>
              <Copy size={14} /> 复制
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '20px' }}>
          {[
            { icon: TrendingUp, label: '点击量', value: stats.clicks, color: '#42e6ff' },
            { icon: Users, label: '注册数', value: stats.registrations, color: '#78ffb9' },
            { icon: ArrowUpRight, label: '转化数', value: stats.conversions, color: '#f9ff72' },
            { icon: DollarSign, label: '总佣金', value: `¥${stats.totalCommission.toFixed(2)}`, color: '#ff74a6' }
          ].map((item, i) => (
            <div key={i} style={{
              padding: '20px', borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(9,15,32,0.5)',
              textAlign: 'center'
            }}>
              <item.icon size={24} style={{ color: item.color, marginBottom: '8px' }} />
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#eef5ff' }}>{item.value}</div>
              <div style={{ fontSize: '12px', color: '#73859f' }}>{item.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', padding: '4px', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', background: 'rgba(9,15,32,0.6)' }}>
          {[
            { id: 'overview', label: '等级说明' },
            { id: 'commissions', label: '佣金记录' },
            { id: 'withdrawals', label: '提现记录' }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`tabItem ${activeTab === tab.id ? 'active' : ''}`} style={{ fontFamily: 'inherit' }}>
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div style={{
            padding: '24px', borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(9,15,32,0.68)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ color: '#eef5ff', margin: 0 }}>推广员等级说明</h3>
              <div>
                <span style={{ fontSize: '14px', color: '#f9ff72', fontWeight: 700 }}>可提现: ¥{stats.availableCommission.toFixed(2)}</span>
                <button onClick={() => setShowWithdraw(true)} style={{
                  marginLeft: '12px', padding: '6px 14px', borderRadius: '6px', border: 'none',
                  background: 'linear-gradient(135deg, #42e6ff, #78ffb9)',
                  color: '#06101a', fontSize: '12px', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit'
                }}>
                  <Wallet size={12} style={{ verticalAlign: 'middle' }} /> 提现
                </button>
              </div>
            </div>
            {DISTRIBUTION_LEVELS.map((level) => (
              <div key={level.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.06)',
                flexWrap: 'wrap', gap: '8px'
              }}>
                <div>
                  <span style={{ color: level.color, fontWeight: 700 }}>{level.name}</span>
                  <span style={{ fontSize: '12px', color: '#5a6a80', marginLeft: '8px' }}>
                    累计推广 {level.requiredReferrals} 人
                  </span>
                </div>
                <div style={{ fontSize: '13px', color: '#aebcd0' }}>
                  首年 {level.firstYearCommission * 100}% / 续费 {level.renewalCommission * 100}% · 最低提现 ¥{level.minWithdraw}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'commissions' && (
          <div style={{
            borderRadius: '12px', border: '1px solid rgba(255,255,255,0.12)',
            background: 'rgba(9,15,32,0.5)', overflow: 'hidden'
          }}>
            {commissions.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#5a6a80' }}>暂无佣金记录</div>
            ) : (
              commissions.map((c, i) => (
                <div key={c.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '14px 16px', borderBottom: i < commissions.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none'
                }}>
                  <div>
                    <div style={{ fontSize: '14px', color: '#eef5ff' }}>{c.nickname} 购买了 {c.plan === 'pro' ? '专业版' : c.plan === 'basic' ? '基础版' : '企业版'}</div>
                    <div style={{ fontSize: '12px', color: '#5a6a80' }}>{c.createdAt} · 订单金额 ¥{c.amount}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#78ffb9' }}>+¥{c.commission.toFixed(2)}</div>
                    <div style={{ fontSize: '11px', color: c.status === 'paid' ? '#78ffb9' : '#f9ff72' }}>
                      {c.status === 'paid' ? '已到账' : '待结算'}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'withdrawals' && (
          <div style={{
            borderRadius: '12px', border: '1px solid rgba(255,255,255,0.12)',
            background: 'rgba(9,15,32,0.5)', overflow: 'hidden'
          }}>
            {withdrawals.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#5a6a80' }}>暂无提现记录</div>
            ) : (
              withdrawals.map((w, i) => (
                <div key={w.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '14px 16px', borderBottom: i < withdrawals.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none'
                }}>
                  <div>
                    <div style={{ fontSize: '14px', color: '#eef5ff' }}>提现到 {w.method === 'wechat' ? '微信' : '支付宝'}</div>
                    <div style={{ fontSize: '12px', color: '#5a6a80' }}>{w.createdAt}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#ff6b8a' }}>-¥{w.amount.toFixed(2)}</div>
                    <div style={{ fontSize: '11px', color: w.status === 'completed' ? '#78ffb9' : '#f9ff72' }}>
                      {w.status === 'completed' ? <><CheckCircle size={10} style={{ verticalAlign: 'middle' }} /> 已完成</> : <><Clock size={10} style={{ verticalAlign: 'middle' }} /> 处理中</>}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {showWithdraw && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100, padding: '20px'
        }} onClick={() => setShowWithdraw(false)}>
          <div style={{
            width: '100%', maxWidth: '380px', padding: '28px',
            borderRadius: '16px', background: 'rgba(9,15,32,0.98)',
            border: '1px solid rgba(255,255,255,0.12)'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ color: '#eef5ff', margin: 0 }}>申请提现</h3>
              <button onClick={() => setShowWithdraw(false)} style={{ background: 'none', border: 'none', color: '#73859f', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <div style={{ marginBottom: '16px', padding: '12px', borderRadius: '8px', background: 'rgba(249,255,114,0.06)', border: '1px solid rgba(249,255,114,0.15)' }}>
              <div style={{ fontSize: '13px', color: '#73859f' }}>可提现佣金</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#f9ff72' }}>¥{stats.availableCommission.toFixed(2)}</div>
              <div style={{ fontSize: '12px', color: '#5a6a80' }}>最低提现 ¥{currentLevel.minWithdraw}</div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: '#aebcd0', marginBottom: '6px' }}>提现金额</label>
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder={`最低 ¥${currentLevel.minWithdraw}`}
                style={{
                  width: '100%', height: '44px', padding: '0 14px',
                  border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px',
                  background: 'rgba(255,255,255,0.04)', color: '#eef5ff', fontSize: '14px',
                  outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: '#aebcd0', marginBottom: '6px' }}>提现方式</label>
              {[
                { id: 'wechat', label: '微信', icon: '💬' },
                { id: 'alipay', label: '支付宝', icon: '🔵' }
              ].map(m => (
                <button
                  key={m.id}
                  onClick={() => setWithdrawMethod(m.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
                    padding: '10px 14px', borderRadius: '8px',
                    border: withdrawMethod === m.id ? '1px solid rgba(66,230,255,0.6)' : '1px solid rgba(255,255,255,0.08)',
                    background: withdrawMethod === m.id ? 'rgba(66,230,255,0.08)' : 'transparent',
                    color: '#eef5ff', fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit',
                    marginBottom: '6px'
                  }}
                >
                  <span>{m.icon}</span> {m.label}
                </button>
              ))}
            </div>

            <button
              onClick={handleWithdraw}
              style={{
                width: '100%', height: '44px', border: 'none', borderRadius: '10px',
                background: 'linear-gradient(135deg, #42e6ff, #78ffb9)',
                color: '#06101a', fontSize: '14px', fontWeight: 800,
                cursor: 'pointer', fontFamily: 'inherit'
              }}
            >
              确认提现
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
