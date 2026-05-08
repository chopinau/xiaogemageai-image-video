import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { WandSparkles, Menu, X, User, CreditCard, Crown, Share2, LogOut, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCredits } from '../contexts/CreditsContext';
import { useMember } from '../contexts/MemberContext';

export function Topbar({ language, setLanguage }) {
  const { isAuthenticated, user, logout } = useAuth();
  const { balance } = useCredits();
  const { currentPlan } = useMember();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  const handleLogout = async () => {
    await logout();
    setUserMenuOpen(false);
    navigate('/');
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userMenuOpen]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (mobileMenuOpen && !e.target.closest('.mobileMenu') && !e.target.closest('.mobileMenuBtn')) {
        setMobileMenuOpen(false);
      }
    };
    if (mobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mobileMenuOpen]);

  return (
    <header className="topbar">
      <NavLink className="brand" to="/">
        <WandSparkles size={21} />
        <span className="brandText">AI 创作平台</span>
      </NavLink>

      <nav className="topbarNav">
        <NavLink to="/" end>主图生成</NavLink>
        <NavLink to="/detail-studio">详情图</NavLink>
        <NavLink to="/retouch-studio">精修</NavLink>
        <NavLink to="/psd-layer">PSD分层</NavLink>
        <NavLink to="/video-gen">视频</NavLink>
        <NavLink to="/gallery">画廊</NavLink>
      </nav>

      <div className="topbarRight">
        {isAuthenticated && (
          <div className="topbarCredits" onClick={() => navigate('/credits')} style={{ cursor: 'pointer' }}>
            <CreditCard size={14} />
            <span>{balance} 积分</span>
          </div>
        )}

        <div className="languageSwitch" aria-label="Language switcher">
          <button className={language === 'en' ? 'active' : ''} type="button" onClick={() => setLanguage('en')}>EN</button>
          <button className={language === 'zh' ? 'active' : ''} type="button" onClick={() => setLanguage('zh')}>中文</button>
        </div>

        {isAuthenticated ? (
          <div ref={userMenuRef} style={{ position: 'relative' }}>
            <button className="userMenuTrigger" onClick={() => setUserMenuOpen(!userMenuOpen)}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #42e6ff, #78ffb9)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '12px', color: '#06101a', fontWeight: 800
              }}>
                {user?.nickname?.[0] || 'U'}
              </div>
            </button>
            {userMenuOpen && (
              <div className="userMenuDropdown">
                <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#eef5ff' }}>{user?.nickname || '用户'}</div>
                  <div style={{ fontSize: '12px', color: currentPlan.color, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                    <Crown size={12} /> {currentPlan.name}
                  </div>
                </div>
                <NavLink to="/profile" onClick={() => setUserMenuOpen(false)} className="userMenuItem"><User size={14} /> 个人中心</NavLink>
                <NavLink to="/credits" onClick={() => setUserMenuOpen(false)} className="userMenuItem"><CreditCard size={14} /> 积分中心</NavLink>
                <NavLink to="/affiliate" onClick={() => setUserMenuOpen(false)} className="userMenuItem"><Share2 size={14} /> 推广中心</NavLink>
                <NavLink to="/pricing" onClick={() => setUserMenuOpen(false)} className="userMenuItem"><Crown size={14} /> 升级会员</NavLink>
                {user?.role === 'admin' && (
                  <NavLink to="/admin" onClick={() => setUserMenuOpen(false)} className="userMenuItem"><Shield size={14} /> 管理后台</NavLink>
                )}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <button onClick={handleLogout} className="userMenuItem" style={{ color: '#ff6b8a', width: '100%', textAlign: 'left' }}>
                    <LogOut size={14} /> 退出登录
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <NavLink to="/login" className="loginBtn">
            <User size={14} /> 登录
          </NavLink>
        )}

        <button className="mobileMenuBtn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {mobileMenuOpen && (
        <>
          <div className="mobileMenuOverlay" onClick={() => setMobileMenuOpen(false)} />
          <div className="mobileMenu">
            <NavLink to="/" end onClick={() => setMobileMenuOpen(false)}>主图生成</NavLink>
            <NavLink to="/detail-studio" onClick={() => setMobileMenuOpen(false)}>详情图生成</NavLink>
            <NavLink to="/retouch-studio" onClick={() => setMobileMenuOpen(false)}>图片精修</NavLink>
            <NavLink to="/psd-layer" onClick={() => setMobileMenuOpen(false)}>PSD分层</NavLink>
            <NavLink to="/video-gen" onClick={() => setMobileMenuOpen(false)}>视频生成</NavLink>
            <NavLink to="/gallery" onClick={() => setMobileMenuOpen(false)}>提示词画廊</NavLink>
            <NavLink to="/pricing" onClick={() => setMobileMenuOpen(false)}>会员方案</NavLink>
            {isAuthenticated && (
              <>
                <NavLink to="/profile" onClick={() => setMobileMenuOpen(false)}>个人中心</NavLink>
                <NavLink to="/credits" onClick={() => setMobileMenuOpen(false)}>积分中心</NavLink>
                <NavLink to="/affiliate" onClick={() => setMobileMenuOpen(false)}>推广中心</NavLink>
              </>
            )}
          </div>
        </>
      )}
    </header>
  );
}
