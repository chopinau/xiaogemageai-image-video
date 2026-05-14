﻿﻿﻿import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { WandSparkles, Menu, X, User, CreditCard, Crown, Share2, LogOut, Shield, Bell, Building2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCredits } from '../contexts/CreditsContext';
import { useMember } from '../contexts/MemberContext';
import { useAgency } from '../contexts/AgencyContext';
import { API_BASE } from '../config/api';

export function Topbar({ language, setLanguage }) {
  const { isAuthenticated, user, logout } = useAuth();
  const { balance } = useCredits();
  const { currentPlan } = useMember();
  const { brand, logoUrl, agencyName } = useAgency();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const userMenuRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchUnread = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/notifications/unread-count`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` } });
        const data = await res.json();
        if (data.success) setUnreadCount(data.data.count);
      } catch {}
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 60000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

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
        {logoUrl ? <img src={logoUrl} alt={agencyName} style={{height:21,width:21,borderRadius:4,objectFit:'cover'}} /> : <WandSparkles size={21} />}
        <span className="brandText">{agencyName || 'AI 创作平台'}</span>
      </NavLink>

      <nav className="topbarNav">
        <NavLink to="/" end className="topbarNavItem">创作</NavLink>
        <NavLink to="/gallery" className="topbarNavItem">画廊</NavLink>
        <NavLink to="/dashboard" className="topbarNavItem">我的</NavLink>
      </nav>

      <div className="topbarRight">
        {isAuthenticated && (
          <div className="topbarCredits" onClick={() => navigate('/credits')} style={{ cursor: 'pointer' }}>
            <CreditCard size={14} />
            <span>{balance} 算力</span>
          </div>
        )}

        {isAuthenticated && (
          <div ref={notifRef} style={{ position: 'relative' }}>
            <button onClick={() => setNotifOpen(!notifOpen)} style={{ background: 'none', border: 'none', color: '#73859f', cursor: 'pointer', position: 'relative', padding: '4px' }}>
              <Bell size={18} />
              {unreadCount > 0 && (
                <span style={{ position: 'absolute', top: '-2px', right: '-4px', background: '#ff6b8a', color: '#fff', fontSize: '10px', fontWeight: 700, minWidth: '16px', height: '16px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
            {notifOpen && (
              <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: '8px', width: '320px', background: '#0d1b2a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', zIndex: 1000, overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#e0e6ed', fontWeight: 700, fontSize: '14px' }}>通知</span>
                  <NavLink to="/dashboard" onClick={() => setNotifOpen(false)} style={{ color: '#42e6ff', fontSize: '12px', textDecoration: 'none' }}>查看全部</NavLink>
                </div>
                <div style={{ maxHeight: '300px', overflowY: 'auto', padding: '8px' }}>
                  <div style={{ textAlign: 'center', padding: '20px', color: '#73859f', fontSize: '13px' }}>
                    {unreadCount > 0 ? `${unreadCount} 条未读通知` : '暂无新通知'}
                  </div>
                </div>
              </div>
            )}
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
                <NavLink to="/credits" onClick={() => setUserMenuOpen(false)} className="userMenuItem"><CreditCard size={14} /> 算力中心</NavLink>
                <NavLink to="/affiliate" onClick={() => setUserMenuOpen(false)} className="userMenuItem"><Share2 size={14} /> 推广中心</NavLink>
                <NavLink to="/pricing" onClick={() => setUserMenuOpen(false)} className="userMenuItem"><Crown size={14} /> 升级会员</NavLink>
                {user?.role === 'admin' && (
                  <NavLink to="/admin" onClick={() => setUserMenuOpen(false)} className="userMenuItem"><Shield size={14} /> 管理后台</NavLink>
                )}
                {(user?.role === 'agency' || user?.role === 'admin') && (
                  <NavLink to="/agency" onClick={() => setUserMenuOpen(false)} className="userMenuItem"><Building2 size={14} /> 代理商中心</NavLink>
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
            <NavLink to="/" end onClick={() => setMobileMenuOpen(false)}>创作工作台</NavLink>
            <NavLink to="/gallery" onClick={() => setMobileMenuOpen(false)}>提示词画廊</NavLink>
            <NavLink to="/pricing" onClick={() => setMobileMenuOpen(false)}>会员方案</NavLink>
            {isAuthenticated && (
              <>
                <NavLink to="/profile" onClick={() => setMobileMenuOpen(false)}>个人中心</NavLink>
                <NavLink to="/credits" onClick={() => setMobileMenuOpen(false)}>算力中心</NavLink>
                <NavLink to="/affiliate" onClick={() => setMobileMenuOpen(false)}>推广中心</NavLink>
              </>
            )}
          </div>
        </>
      )}
    </header>
  );
}
