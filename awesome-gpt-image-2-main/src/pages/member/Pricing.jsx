import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useMember } from '../../contexts/MemberContext';
import { useNotification } from '../../contexts/NotificationContext';
import { MEMBERSHIP_PLANS } from '../../config/membership';
import { PAYMENT_METHODS } from '../../config/payment';
import { Check, Zap, Crown, Building2, X } from 'lucide-react';

const planIcons = { free: Zap, basic: Check, pro: Crown, enterprise: Building2 };

export function PricingPage({ language }) {
  const { isAuthenticated } = useAuth();
  const { subscribe, membership } = useMember();
  const notify = useNotification();
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [subscribingPlan, setSubscribingPlan] = useState(null);
  const [paymentModal, setPaymentModal] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState('wechat');
  const [processing, setProcessing] = useState(false);

  const handleSubscribe = async (plan) => {
    if (!isAuthenticated) {
      notify.warning('请先登录');
      navigate('/login');
      return;
    }
    if (membership.planId === plan.id) {
      notify.info('您已经是该等级会员');
      return;
    }
    if (plan.price === 0) {
      notify.info('免费版无需订阅');
      return;
    }
    setPaymentModal(plan);
  };

  const handlePayment = async () => {
    if (!paymentModal) return;
    setProcessing(true);
    const result = await subscribe(paymentModal.id, selectedMethod);
    if (result.success) {
      notify.success('订阅成功！');
      setPaymentModal(null);
    } else {
      notify.error(result.error || '订阅失败');
    }
    setProcessing(false);
    setSubscribingPlan(null);
  };

  return (
    <div className="sharedSection">
      <div className="pageHeader">
        <h1>选择适合你的方案</h1>
        <p className="subtitle">从免费版开始，随时升级解锁更多 AI 创作能力</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginTop: '16px', padding: '4px', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', background: 'rgba(9,15,32,0.6)' }}>
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`tabItem ${billingCycle === 'monthly' ? 'active' : ''}`}
            style={{ fontFamily: 'inherit' }}
          >月付</button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`tabItem ${billingCycle === 'yearly' ? 'active' : ''}`}
            style={{ fontFamily: 'inherit' }}
          >年付（省20%）</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', maxWidth: '1100px', margin: '0 auto' }}>
        {MEMBERSHIP_PLANS.map((plan) => {
          const Icon = planIcons[plan.id] || Check;
          const price = billingCycle === 'yearly' ? plan.yearlyPrice : plan.price;
          const isCurrent = membership.planId === plan.id;
          return (
            <div key={plan.id} style={{
              padding: '28px',
              border: plan.popular ? '2px solid rgba(66,230,255,0.6)' : '1px solid rgba(255,255,255,0.12)',
              borderRadius: '16px',
              background: plan.popular ? 'rgba(66,230,255,0.04)' : 'rgba(9,15,32,0.68)',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {plan.popular && (
                <div style={{
                  position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)',
                  padding: '4px 16px', borderRadius: '12px',
                  background: 'linear-gradient(135deg, #42e6ff, #78ffb9)',
                  color: '#06101a', fontSize: '12px', fontWeight: 800
                }}>最受欢迎</div>
              )}
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <span style={{ fontSize: '32px' }}>{plan.icon}</span>
                <h3 style={{ color: plan.color, margin: '8px 0 4px', fontSize: '20px' }}>{plan.name}</h3>
                <div style={{ marginTop: '12px' }}>
                  <span style={{ fontSize: '36px', fontWeight: 800, color: '#eef5ff' }}>
                    {price === 0 ? '免费' : `¥${price}`}
                  </span>
                  {price > 0 && <span style={{ fontSize: '14px', color: '#73859f' }}>/月</span>}
                </div>
                {plan.monthlyCredits > 0 && (
                  <div style={{ fontSize: '14px', color: '#f9ff72', marginTop: '4px' }}>
                    每月 {plan.monthlyCredits} 算力
                  </div>
                )}
                {plan.dailyCredits > 0 && (
                  <div style={{ fontSize: '14px', color: '#9eeeff', marginTop: '4px' }}>
                    每日 {plan.dailyCredits} 免费算力
                  </div>
                )}
              </div>
              <div style={{ flex: 1, marginBottom: '20px' }}>
                {[
                  plan.features.maxResolution === '1k' ? '标清 1K 分辨率' : plan.features.maxResolution === '2k' ? '高清 2K 分辨率' : '超清 4K 分辨率',
                  `最多生成 ${plan.features.maxGenCount} 张`,
                  `${plan.features.models.length} 个图像模型`,
                  plan.features.videoModels.length > 1 ? `${plan.features.videoModels.length} 个视频模型` : '基础视频模型',
                  plan.features.priority ? '优先生成队列' : '标准生成队列',
                  plan.features.batchSize ? '批量生成' : '单张生成',
                  plan.features.customBackground ? '自定义背景' : null,
                  plan.features.apiAccess ? 'API 接入' : null,
                  plan.features.watermark ? '带水印' : '无水印'
                ].filter(Boolean).map((feature, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0', fontSize: '14px', color: '#aebcd0' }}>
                    <Check size={14} style={{ color: plan.color, flexShrink: 0 }} />
                    {feature}
                  </div>
                ))}
              </div>
              <button
                onClick={() => handleSubscribe(plan)}
                disabled={isCurrent}
                style={{
                  width: '100%', height: '44px', border: 'none', borderRadius: '10px',
                  background: isCurrent ? 'rgba(255,255,255,0.08)' : plan.popular ? 'linear-gradient(135deg, #42e6ff, #78ffb9)' : 'rgba(255,255,255,0.08)',
                  color: isCurrent ? '#5a6a80' : plan.popular ? '#06101a' : '#aebcd0',
                  fontSize: '14px', fontWeight: 800, cursor: isCurrent ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit'
                }}
              >
                {isCurrent ? '当前方案' : price === 0 ? '免费开始' : `订阅 ¥${price}/月`}
              </button>
            </div>
          );
        })}
      </div>

      {paymentModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100, padding: '20px'
        }} onClick={() => setPaymentModal(null)}>
          <div style={{
            width: '100%', maxWidth: '400px', padding: '28px',
            borderRadius: '16px', background: 'rgba(9,15,32,0.98)',
            border: '1px solid rgba(255,255,255,0.12)'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ color: '#eef5ff', margin: 0 }}>确认订阅</h3>
              <button onClick={() => setPaymentModal(null)} style={{ background: 'none', border: 'none', color: '#73859f', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <div style={{ padding: '16px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '20px', textAlign: 'center' }}>
              <div style={{ fontSize: '14px', color: '#73859f' }}>{paymentModal.name} · {billingCycle === 'yearly' ? '年付' : '月付'}</div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: '#f9ff72', marginTop: '8px' }}>
                ¥{billingCycle === 'yearly' ? paymentModal.yearlyPrice : paymentModal.price}
                <span style={{ fontSize: '14px', color: '#73859f' }}>/月</span>
              </div>
              {billingCycle === 'yearly' && (
                <div style={{ fontSize: '13px', color: '#ff74a6', marginTop: '4px' }}>
                  年付总价 ¥{paymentModal.yearlyPrice * 12}（省 ¥{((paymentModal.price - paymentModal.yearlyPrice) * 12).toFixed(0)}）
                </div>
              )}
              {paymentModal.monthlyCredits > 0 && (
                <div style={{ fontSize: '13px', color: '#78ffb9', marginTop: '4px' }}>含每月 {paymentModal.monthlyCredits} 算力</div>
              )}
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#aebcd0', marginBottom: '10px' }}>选择支付方式</div>
              {Object.values(PAYMENT_METHODS).map(method => (
                <button
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px', width: '100%',
                    padding: '12px 14px', borderRadius: '8px', border: selectedMethod === method.id ? '1px solid rgba(66,230,255,0.6)' : '1px solid rgba(255,255,255,0.08)',
                    background: selectedMethod === method.id ? 'rgba(66,230,255,0.08)' : 'transparent',
                    color: '#eef5ff', fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit',
                    marginBottom: '6px'
                  }}
                >
                  <span style={{ fontSize: '20px' }}>{method.icon}</span>
                  {method.name}
                </button>
              ))}
            </div>

            <button
              onClick={handlePayment}
              disabled={processing}
              style={{
                width: '100%', height: '48px', border: 'none', borderRadius: '10px',
                background: processing ? 'rgba(66,230,255,0.4)' : 'linear-gradient(135deg, #42e6ff, #78ffb9)',
                color: '#06101a', fontSize: '16px', fontWeight: 800,
                cursor: processing ? 'not-allowed' : 'pointer', fontFamily: 'inherit'
              }}
            >
              {processing ? '处理中...' : `确认订阅 ¥${billingCycle === 'yearly' ? paymentModal.yearlyPrice : paymentModal.price}/月`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
