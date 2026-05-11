import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useMember } from '../../contexts/MemberContext';
import { useNotification } from '../../contexts/NotificationContext';
import { getPlanById } from '../../config/membership';
import { User, Crown, Calendar, CreditCard, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';

export function ProfilePage({ language }) {
  const { user, logout } = useAuth();
  const { membership, currentPlan, isActive, isExpired, cancelAtPeriodEnd, cancelSubscription } = useMember();
  const notify = useNotification();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const handleLogout = async () => {
    await logout();
    notify.success('已退出登录');
  };

  const handleCancelSubscription = async () => {
    const result = await cancelSubscription();
    if (result.success) {
      notify.success('订阅已取消，到期前仍可使用');
    } else {
      notify.error(result.error || '取消失败');
    }
    setShowCancelConfirm(false);
  };

  return (
    <div className="sharedSection">
      <div className="pageHeader">
        <h1>个人中心</h1>
      </div>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div style={{
          padding: '28px',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '16px',
          background: 'rgba(9,15,32,0.68)',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #42e6ff, #78ffb9)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '28px', color: '#06101a', fontWeight: 800
            }}>
              {user?.nickname?.[0] || 'U'}
            </div>
            <div>
              <h2 style={{ margin: '0 0 4px', color: '#eef5ff', fontSize: '20px' }}>{user?.nickname || '用户'}</h2>
              <p style={{ margin: 0, color: '#73859f', fontSize: '14px' }}>{user?.email || ''}</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ padding: '16px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '12px', color: '#73859f', marginBottom: '4px' }}><Crown size={14} style={{ verticalAlign: 'middle' }} /> 会员等级</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: currentPlan.color }}>{currentPlan.name}</div>
            </div>
            <div style={{ padding: '16px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '12px', color: '#73859f', marginBottom: '4px' }}><Calendar size={14} style={{ verticalAlign: 'middle' }} /> 到期时间</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: isExpired ? '#ff6b8a' : '#eef5ff' }}>
                {membership.expiresAt ? new Date(membership.expiresAt).toLocaleDateString() : '永久'}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Link to="/pricing" style={{
            padding: '14px 20px', borderRadius: '10px',
            border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)',
            color: '#eef5ff', textDecoration: 'none', fontSize: '14px', fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: '10px'
          }}>
            <Crown size={18} style={{ color: '#f9ff72' }} /> 升级/变更会员方案
          </Link>
          <Link to="/credits" style={{
            padding: '14px 20px', borderRadius: '10px',
            border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)',
            color: '#eef5ff', textDecoration: 'none', fontSize: '14px', fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: '10px'
          }}>
            <CreditCard size={18} style={{ color: '#42e6ff' }} /> 算力中心
          </Link>

          {membership.planId !== 'free' && isActive && !cancelAtPeriodEnd && (
            <button onClick={() => setShowCancelConfirm(true)} style={{
              padding: '14px 20px', borderRadius: '10px',
              border: '1px solid rgba(255,50,80,0.2)', background: 'rgba(255,50,80,0.04)',
              color: '#ff6b8a', fontSize: '14px', fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '10px', fontFamily: 'inherit'
            }}>
              取消订阅
            </button>
          )}

          {cancelAtPeriodEnd && (
            <div style={{
              padding: '14px 20px', borderRadius: '10px',
              border: '1px solid rgba(249,255,114,0.2)', background: 'rgba(249,255,114,0.06)',
              color: '#f9ff72', fontSize: '14px', fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: '10px'
            }}>
              订阅已取消，到期前仍可使用所有权益（到期日：{membership.expiresAt ? new Date(membership.expiresAt).toLocaleDateString() : '未知'}）
            </div>
          )}

          <button onClick={handleLogout} style={{
            padding: '14px 20px', borderRadius: '10px',
            border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)',
            color: '#73859f', fontSize: '14px', fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '10px', fontFamily: 'inherit'
          }}>
            <LogOut size={18} /> 退出登录
          </button>
        </div>

        {showCancelConfirm && (
          <div style={{
            marginTop: '20px', padding: '20px', borderRadius: '12px',
            border: '1px solid rgba(255,50,80,0.3)', background: 'rgba(255,50,80,0.06)'
          }}>
            <p style={{ color: '#ff6b8a', fontSize: '14px', margin: '0 0 16px' }}>
              确定要取消订阅吗？取消后到期前仍可使用当前权益。
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleCancelSubscription} style={{
                padding: '8px 20px', borderRadius: '8px', border: 'none',
                background: '#ff3250', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit'
              }}>确认取消</button>
              <button onClick={() => setShowCancelConfirm(false)} style={{
                padding: '8px 20px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)',
                background: 'transparent', color: '#aebcd0', fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit'
              }}>返回</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
