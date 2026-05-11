﻿﻿﻿﻿﻿import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { WandSparkles, Mail, Lock, Eye, EyeOff, Copy, Check } from 'lucide-react';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState(null);
  const { login, isLoading, error, clearError, isDemo, demoAccounts } = useAuth();
  const notify = useNotification();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    const result = await login(email, password);
    if (result.success) {
      notify.success('登录成功！');
      navigate(from, { replace: true });
    } else {
      notify.error(result.error || '登录失败');
    }
  };

  const handleDemoLogin = async (accountEmail) => {
    clearError();
    const account = demoAccounts[accountEmail];
    if (!account) return;
    setEmail(accountEmail);
    setPassword(account.password);
    const result = await login(accountEmail, account.password);
    if (result.success) {
      notify.success(`欢迎，${account.user.nickname}！`);
      navigate(from, { replace: true });
    }
  };

  const handleCopy = async (text, field) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 1500);
    } catch {
      notify.error('复制失败');
    }
  };

  const inputStyle = {
    width: '100%',
    height: '44px',
    padding: '0 14px',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '8px',
    background: 'rgba(255,255,255,0.04)',
    color: '#eef5ff',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit'
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 72px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '480px',
        padding: '40px',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: '16px',
        background: 'rgba(9,15,32,0.68)',
        backdropFilter: 'blur(12px)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <WandSparkles size={36} style={{ color: '#42e6ff', marginBottom: '12px' }} />
          <h1 style={{ color: '#eef5ff', fontSize: '24px', margin: '0 0 8px' }}>登录</h1>
          <p style={{ color: '#73859f', fontSize: '14px', margin: 0 }}>登录你的 AI 创作平台账户</p>
        </div>

        {isDemo && (
          <div style={{
            padding: '16px',
            marginBottom: '20px',
            borderRadius: '12px',
            background: 'rgba(66,230,255,0.06)',
            border: '1px solid rgba(66,230,255,0.18)',
            fontSize: '13px'
          }}>
            <div style={{ fontWeight: 700, color: '#9eeeff', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              🎮 Demo 模式 - 快速体验账户
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {Object.entries(demoAccounts).map(([accountEmail, account]) => (
                <div key={accountEmail} style={{
                  background: 'rgba(0,0,0,0.3)',
                  borderRadius: '10px',
                  padding: '12px',
                  border: '1px solid rgba(255,255,255,0.06)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ color: '#eef5ff', fontWeight: 700, fontSize: '13px' }}>
                      {account.user.role === 'admin' ? '👑 ' : '👤 '}
                      {account.user.nickname}
                    </span>
                    <button
                      onClick={() => handleDemoLogin(accountEmail)}
                      disabled={isLoading}
                      style={{
                        padding: '6px 12px', borderRadius: '6px', border: 'none',
                        background: 'rgba(66,230,255,0.15)', color: '#42e6ff',
                        fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit'
                      }}
                    >
                      一键登录
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: '#73859f', fontSize: '12px', minWidth: '60px' }}>邮箱</span>
                      <code style={{
                        color: '#78ffb9', fontSize: '12px', padding: '4px 8px',
                        background: 'rgba(0,0,0,0.3)', borderRadius: '4px', flex: 1
                      }}>
                        {accountEmail}
                      </code>
                      <button onClick={() => handleCopy(accountEmail, 'email')} style={{
                        background: 'rgba(255,255,255,0.06)', border: 'none', padding: '4px',
                        borderRadius: '4px', cursor: 'pointer', color: '#73859f'
                      }}>
                        {copiedField === 'email' ? <Check size={14} style={{ color: '#10b981' }} /> : <Copy size={14} />}
                      </button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: '#73859f', fontSize: '12px', minWidth: '60px' }}>密码</span>
                      <code style={{
                        color: '#ffcc99', fontSize: '12px', padding: '4px 8px',
                        background: 'rgba(0,0,0,0.3)', borderRadius: '4px', flex: 1
                      }}>
                        {account.password}
                      </code>
                      <button onClick={() => handleCopy(account.password, 'pwd')} style={{
                        background: 'rgba(255,255,255,0.06)', border: 'none', padding: '4px',
                        borderRadius: '4px', cursor: 'pointer', color: '#73859f'
                      }}>
                        {copiedField === 'pwd' ? <Check size={14} style={{ color: '#10b981' }} /> : <Copy size={14} />}
                      </button>
                    </div>
                    {account.initialCredits && (
                      <div style={{ color: '#a78bfa', fontSize: '12px', marginTop: '4px' }}>
                        🎁 初始算力: <strong>{account.initialCredits.toFixed(2)} 算力</strong>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: '#aebcd0', marginBottom: '6px' }}>
              <Mail size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />邮箱
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="请输入邮箱"
              required
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: '#aebcd0', marginBottom: '6px' }}>
              <Lock size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />密码
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                required
                style={{ ...inputStyle, paddingRight: '40px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: '#73859f', cursor: 'pointer', padding: 0
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div style={{
              padding: '10px 14px', marginBottom: '16px', borderRadius: '8px',
              background: 'rgba(255,50,80,0.1)', border: '1px solid rgba(255,50,80,0.3)',
              color: '#ff6b8a', fontSize: '13px'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%', height: '48px', border: 'none', borderRadius: '10px',
              background: isLoading
                ? 'linear-gradient(135deg, rgba(66,230,255,0.4), rgba(120,255,185,0.4))'
                : 'linear-gradient(135deg, #42e6ff, #78ffb9)',
              color: '#06101a', fontSize: '16px', fontWeight: 800,
              cursor: isLoading ? 'not-allowed' : 'pointer', fontFamily: 'inherit'
            }}
          >
            {isLoading ? '登录中...' : '登录'}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px', color: '#73859f' }}>
          还没有账户？{' '}
          <Link to="/register" style={{ color: '#42e6ff', textDecoration: 'none', fontWeight: 700 }}>立即注册</Link>
        </div>
      </div>
    </div>
  );
}
