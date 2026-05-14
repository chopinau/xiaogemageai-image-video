import React, { useState, useEffect } from 'react';
import { useNotification } from '../../contexts/NotificationContext';
import { API_BASE, safeFetch } from '../../config/api';
import { Users, Search, Mail, Calendar, Coins } from 'lucide-react';

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

export function AgencyUsers() {
  const notify = useNotification();
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadUsers(); }, [page]);

  async function loadUsers() {
    setLoading(true);
    try {
      const data = await agencyApiCall(`/api/agency/me/users?page=${page}&limit=20`);
      if (data.success) {
        setUsers(data.data?.users || data.data || []);
        setTotal(data.data?.total || 0);
      }
    } catch (err) {
      notify.error('加载用户列表失败');
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div style={{ color: '#8888aa', textAlign: 'center', padding: 40 }}>加载中...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ color: '#8888aa', fontSize: 14 }}>共 {total} 位用户</div>
      </div>

      {users.length === 0 ? (
        <div style={{ background: '#1a1a2e', borderRadius: 12, padding: 40, border: '1px solid #2a2a4a', textAlign: 'center' }}>
          <Users size={40} style={{ color: '#2a2a4a', marginBottom: 12 }} />
          <div style={{ color: '#6666aa', fontSize: 14 }}>暂无用户</div>
          <div style={{ color: '#444466', fontSize: 12, marginTop: 4 }}>通过子域名注册的用户将自动归属到您的代理商</div>
        </div>
      ) : (
        <div style={{ background: '#1a1a2e', borderRadius: 12, border: '1px solid #2a2a4a', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #2a2a4a' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#8888aa', fontSize: 12, fontWeight: 500 }}>用户</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#8888aa', fontSize: 12, fontWeight: 500 }}>邮箱</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#8888aa', fontSize: 12, fontWeight: 500 }}>算力</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#8888aa', fontSize: 12, fontWeight: 500 }}>累计消费</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#8888aa', fontSize: 12, fontWeight: 500 }}>加入时间</th>
              </tr>
            </thead>
            <tbody>
              {users.map((au, i) => {
                const u = au.user || au;
                return (
                  <tr key={i} style={{ borderBottom: '1px solid #1a1a2e' }}>
                    <td style={{ padding: '10px 16px', color: '#ccc', fontSize: 13 }}>{u.nickname || '-'}</td>
                    <td style={{ padding: '10px 16px', color: '#8888aa', fontSize: 13 }}>{u.email || '-'}</td>
                    <td style={{ padding: '10px 16px', color: '#42e6ff', fontSize: 13 }}>{(u.credits || 0).toFixed(2)}</td>
                    <td style={{ padding: '10px 16px', color: '#4ade80', fontSize: 13 }}>¥{(u.totalSpent || 0).toFixed(2)}</td>
                    <td style={{ padding: '10px 16px', color: '#6666aa', fontSize: 12 }}>{new Date(au.joinedAt || u.createdAt).toLocaleDateString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {total > 20 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            style={{ background: '#1a1a2e', border: '1px solid #2a2a4a', color: page === 1 ? '#444466' : '#42e6ff', borderRadius: 6, padding: '6px 12px', cursor: page === 1 ? 'not-allowed' : 'pointer' }}>
            上一页
          </button>
          <span style={{ color: '#8888aa', fontSize: 13, lineHeight: '30px' }}>第 {page} 页</span>
          <button onClick={() => setPage(p => p + 1)} disabled={page * 20 >= total}
            style={{ background: '#1a1a2e', border: '1px solid #2a2a4a', color: page * 20 >= total ? '#444466' : '#42e6ff', borderRadius: 6, padding: '6px 12px', cursor: page * 20 >= total ? 'not-allowed' : 'pointer' }}>
            下一页
          </button>
        </div>
      )}
    </div>
  );
}
