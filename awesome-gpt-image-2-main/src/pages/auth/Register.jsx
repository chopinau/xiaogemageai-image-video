import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useCredits } from '../../contexts/CreditsContext';
import { WandSparkles, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';

export function RegisterPage() {
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get('ref') || '';
  const [formData, setFormData] = useState({
    nickname: '',
    email: '',
    password: '',
    confirmPassword: '',
    referralCode: refCode
  });
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const { register, isLoading, error, clearError } = useAuth();
  const { grantCredits } = useCredits();
  const notify = useNotification();
  const navigate = useNavigate();

  const handleChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();

    if (formData.password !== formData.confirmPassword) {
      notify.error('两次输入的密码不一致');
      return;
    }
    if (formData.password.length < 8) {
      notify.error('密码长度至少8位');
      return;
    }
    if (!agreed) {
      notify.warning('请先同意用户协议');
      return;
    }

    const result = await register({
      nickname: formData.nickname,
      email: formData.email,
      password: formData.password,
      referralCode: formData.referralCode
    });

    if (result.success) {
      grantCredits(20, '新用户注册赠送');
      notify.success('注册成功！赠送 20 算力');
      navigate('/');
    } else {
      notify.error(result.error || '注册失败');
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

  const labelStyle = {
    display: 'block',
    fontSize: '14px',
    fontWeight: 700,
    color: '#aebcd0',
    marginBottom: '6px'
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
        maxWidth: '420px',
        padding: '40px',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: '16px',
        background: 'rgba(9,15,32,0.68)',
        backdropFilter: 'blur(12px)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <WandSparkles size={36} style={{ color: '#42e6ff', marginBottom: '12px' }} />
          <h1 style={{ color: '#eef5ff', fontSize: '24px', margin: '0 0 8px' }}>注册</h1>
          <p style={{ color: '#73859f', fontSize: '14px', margin: 0 }}>创建你的 AI 创作平台账户</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}><User size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />昵称</label>
            <input type="text" value={formData.nickname} onChange={handleChange('nickname')} placeholder="请输入昵称" required style={inputStyle} />
          </div>
          <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}><Mail size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />邮箱</label>
            <input type="email" value={formData.email} onChange={handleChange('email')} placeholder="请输入邮箱" required style={inputStyle} />
          </div>
          <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}><Lock size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />密码</label>
            <div style={{ position: 'relative' }}>
              <input type={showPassword ? 'text' : 'password'} value={formData.password} onChange={handleChange('password')} placeholder="至少8位" required style={{ ...inputStyle, paddingRight: '40px' }} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#73859f', cursor: 'pointer', padding: 0 }}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}><Lock size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />确认密码</label>
            <input type="password" value={formData.confirmPassword} onChange={handleChange('confirmPassword')} placeholder="再次输入密码" required style={inputStyle} />
          </div>
          <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}>推荐码（选填）</label>
            <input type="text" value={formData.referralCode} onChange={handleChange('referralCode')} placeholder="好友推荐码" style={inputStyle} />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', cursor: 'pointer', fontSize: '13px', color: '#73859f' }}>
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} style={{ accentColor: '#42e6ff' }} />
            我已阅读并同意 <span style={{ color: '#42e6ff', cursor: 'pointer' }}>用户协议</span> 和 <span style={{ color: '#42e6ff', cursor: 'pointer' }}>隐私政策</span>
          </label>

          {error && (
            <div style={{ padding: '10px 14px', marginBottom: '16px', borderRadius: '8px', background: 'rgba(255,50,80,0.1)', border: '1px solid rgba(255,50,80,0.3)', color: '#ff6a8a', fontSize: '13px' }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={isLoading} style={{
            width: '100%', height: '48px', border: 'none', borderRadius: '10px',
            background: isLoading ? 'linear-gradient(135deg, rgba(66,230,255,0.4), rgba(120,255,185,0.4))' : 'linear-gradient(135deg, #42e6ff, #78ffb9)',
            color: '#06101a', fontSize: '16px', fontWeight: 800, cursor: isLoading ? 'not-allowed' : 'pointer', fontFamily: 'inherit'
          }}>
            {isLoading ? '注册中...' : '注册'}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px', color: '#73859f' }}>
          已有账户？{' '}
          <Link to="/login" style={{ color: '#42e6ff', textDecoration: 'none', fontWeight: 700 }}>立即登录</Link>
        </div>
      </div>
    </div>
  );
}
