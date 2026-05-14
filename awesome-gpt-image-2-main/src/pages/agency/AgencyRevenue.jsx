import React, { useState, useEffect } from 'react';
import { useNotification } from '../../contexts/NotificationContext';
import { API_BASE, safeFetch } from '../../config/api';
import { DollarSign, TrendingUp, Wallet, ArrowUpRight, RefreshCw } from 'lucide-react';

async function agencyApiCall(path, options = {}) {
  const token = localStorage.getItem('auth_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers
  };
  const { response, data } = await safeFetch(`${API_BASE}${path}`, { ...options, headers });
  if (!response.ok && !data.error) throw new Error(`HTTP ${response.status}`);
  return data;
}

export function AgencyRevenue() {
  const notify = useNotification();
  const [agency, setAgency] = useState(null);
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [withdrawForm, setWithdrawForm] = useState({ amount: '', method: 'alipay', accountInfo: '', accountName: '' });
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [meData, revData] = await Promise.all([
        agencyApiCall('/api/agency/me'),
        agencyApiCall('/api/agency/me/revenue')
      ]);
      if (meData.success) setAgency(meData.data);
      if (revData.success) {
        setRecords(revData.data.records || []);
        setSummary(revData.data.summary || {});
      }
    } catch (err) {
      notify.error('加载收益数据失败');
    } finally {
      setLoading(false);
    }
  }

  async function requestWithdraw() {
    if (!withdrawForm.amount || parseFloat(withdrawForm.amount) < 100) {
      notify.error('最低提现金额为100元');
      return;
    }
    if (!withdrawForm.accountInfo || !withdrawForm.accountName) {
      notify.error('请填写完整的收款信息');
      return;
    }
    setWithdrawing(true);
    try {
      const data = await agencyApiCall('/api/agency/me/withdraw', {
        method: 'POST',
        body: JSON.stringify(withdrawForm)
      });
      if (data.success) {
        notify.success('提现申请已提交，等待管理员审批');
        setWithdrawForm({ amount: '', method: 'alipay', accountInfo: '', accountName: '' });
        loadData();
      } else {
        notify.error(data.error || '提现申请失败');
      }
    } catch (err) {
      notify.error('提现申请失败: ' + err.message);
    } finally {
      setWithdrawing(false);
    }
  }

  if (loading) return <div style={{ color: '#8888aa', textAlign: 'center', padding: 40 }}>加载中...</div>;

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div style={{ background: '#1a1a2e', borderRadius: 12, padding: 20, border: '1px solid #2a2a4a' }}>
          <div style={{ color: '#8888aa', fontSize: 13, marginBottom: 6 }}>总收益</div>
          <div style={{ color: '#4ade80', fontSize: 22, fontWeight: 700 }}>¥{(agency?.totalRevenue || 0).toFixed(2)}</div>
        </div>
        <div style={{ background: '#1a1a2e', borderRadius: 12, padding: 20, border: '1px solid #2a2a4a' }}>
          <div style={{ color: '#8888aa', fontSize: 13, marginBottom: 6 }}>可用余额</div>
          <div style={{ color: '#fbbf24', fontSize: 22, fontWeight: 700 }}>¥{(agency?.availableBalance || 0).toFixed(2)}</div>
        </div>
        <div style={{ background: '#1a1a2e', borderRadius: 12, padding: 20, border: '1px solid #2a2a4a' }}>
          <div style={{ color: '#8888aa', fontSize: 13, marginBottom: 6 }}>冻结金额</div>
          <div style={{ color: '#ff6b6b', fontSize: 22, fontWeight: 700 }}>¥{(agency?.frozenBalance || 0).toFixed(2)}</div>
        </div>
        <div style={{ background: '#1a1a2e', borderRadius: 12, padding: 20, border: '1px solid #2a2a4a' }}>
          <div style={{ color: '#8888aa', fontSize: 13, marginBottom: 6 }}>已提现</div>
          <div style={{ color: '#a78bfa', fontSize: 22, fontWeight: 700 }}>¥{(agency?.totalWithdrawn || 0).toFixed(2)}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={{ background: '#1a1a2e', borderRadius: 12, padding: 24, border: '1px solid #2a2a4a' }}>
          <h3 style={{ color: '#fff', fontSize: 16, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <ArrowUpRight size={18} /> 申请提现
          </h3>
          <div style={{ marginBottom: 12 }}>
            <label style={{ color: '#8888aa', fontSize: 13, marginBottom: 4, display: 'block' }}>提现金额（最低100元）</label>
            <input type="number" value={withdrawForm.amount} onChange={e => setWithdrawForm(f => ({ ...f, amount: e.target.value }))} placeholder="输入提现金额"
              style={{ width: '100%', background: '#0d0d1a', border: '1px solid #2a2a4a', borderRadius: 8, padding: '10px 12px', color: '#fff', fontSize: 14 }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ color: '#8888aa', fontSize: 13, marginBottom: 4, display: 'block' }}>收款方式</label>
            <select value={withdrawForm.method} onChange={e => setWithdrawForm(f => ({ ...f, method: e.target.value }))}
              style={{ width: '100%', background: '#0d0d1a', border: '1px solid #2a2a4a', borderRadius: 8, padding: '10px 12px', color: '#fff', fontSize: 14 }}>
              <option value="alipay">支付宝</option>
              <option value="wechat">微信</option>
              <option value="bank">银行卡</option>
            </select>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ color: '#8888aa', fontSize: 13, marginBottom: 4, display: 'block' }}>收款账号</label>
            <input value={withdrawForm.accountInfo} onChange={e => setWithdrawForm(f => ({ ...f, accountInfo: e.target.value }))} placeholder="输入收款账号"
              style={{ width: '100%', background: '#0d0d1a', border: '1px solid #2a2a4a', borderRadius: 8, padding: '10px 12px', color: '#fff', fontSize: 14 }} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ color: '#8888aa', fontSize: 13, marginBottom: 4, display: 'block' }}>收款人姓名</label>
            <input value={withdrawForm.accountName} onChange={e => setWithdrawForm(f => ({ ...f, accountName: e.target.value }))} placeholder="输入收款人姓名"
              style={{ width: '100%', background: '#0d0d1a', border: '1px solid #2a2a4a', borderRadius: 8, padding: '10px 12px', color: '#fff', fontSize: 14 }} />
          </div>
          <button onClick={requestWithdraw} disabled={withdrawing} style={{
            background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', color: '#000', border: 'none',
            borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: withdrawing ? 'not-allowed' : 'pointer',
            width: '100%', opacity: withdrawing ? 0.6 : 1
          }}>
            {withdrawing ? '提交中...' : '申请提现'}
          </button>
          <div style={{ color: '#6666aa', fontSize: 12, marginTop: 8 }}>手续费率: 0.6%</div>
        </div>

        <div style={{ background: '#1a1a2e', borderRadius: 12, padding: 24, border: '1px solid #2a2a4a' }}>
          <h3 style={{ color: '#fff', fontSize: 16, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={18} /> 收益记录
          </h3>
          {records.length === 0 ? (
            <div style={{ color: '#6666aa', fontSize: 13, textAlign: 'center', padding: 20 }}>暂无收益记录</div>
          ) : (
            <div style={{ maxHeight: 400, overflowY: 'auto' }}>
              {records.slice(0, 20).map((r, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #2a2a4a' }}>
                  <div>
                    <div style={{ color: '#ccc', fontSize: 13 }}>{r.type || '收益'}</div>
                    <div style={{ color: '#6666aa', fontSize: 12 }}>{new Date(r.createdAt).toLocaleString()}</div>
                  </div>
                  <div style={{ color: '#4ade80', fontSize: 14, fontWeight: 600 }}>+¥{(r.revenue || 0).toFixed(2)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
