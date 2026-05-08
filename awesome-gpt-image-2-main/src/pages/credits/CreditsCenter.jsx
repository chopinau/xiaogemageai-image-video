import React, { useState } from 'react';
import { useCredits } from '../../contexts/CreditsContext';
import { useNotification } from '../../contexts/NotificationContext';
import { CREDITS_RULES } from '../../config/credits';
import { PAYMENT_METHODS } from '../../config/payment';
import { CreditCard, Gift, History, CheckCircle, X, Wallet } from 'lucide-react';

export function CreditsCenter({ language }) {
  const { balance, checkIn, recharge, history, hasEnough, checkedInToday } = useCredits();
  const notify = useNotification();
  const [paymentModal, setPaymentModal] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState('wechat');
  const [processing, setProcessing] = useState(false);

  const handleCheckIn = async () => {
    const result = await checkIn();
    if (result.success) {
      notify.success(`签到成功！获得 ${result.earned} 积分`);
    } else {
      notify.error(result.error || '签到失败');
    }
  };

  const handleBuyPack = (pack) => {
    setPaymentModal(pack);
  };

  const handlePayment = async () => {
    if (!paymentModal) return;
    setProcessing(true);
    const result = await recharge(paymentModal.id, selectedMethod);
    if (result.success) {
      notify.success(`购买成功！获得 ${paymentModal.credits + paymentModal.bonus} 积分`);
      setPaymentModal(null);
    } else {
      notify.error(result.error || '购买失败');
    }
    setProcessing(false);
  };

  return (
    <div className="sharedSection">
      <div className="pageHeader">
        <h1>积分中心</h1>
        <p className="subtitle">管理你的 AI 创作积分</p>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{
          padding: '28px', borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(9,15,32,0.68)',
          marginBottom: '20px', textAlign: 'center'
        }}>
          <div style={{ fontSize: '14px', color: '#73859f', marginBottom: '8px' }}>当前积分余额</div>
          <div style={{ fontSize: '48px', fontWeight: 800, color: '#f9ff72' }}>{balance}</div>
          <button
            onClick={handleCheckIn}
            disabled={checkedInToday}
            style={{
              marginTop: '16px', padding: '10px 24px', borderRadius: '10px',
              border: 'none',
              background: checkedInToday ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg, #42e6ff, #78ffb9)',
              color: checkedInToday ? '#5a6a80' : '#06101a',
              fontSize: '14px', fontWeight: 800, cursor: checkedInToday ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit'
            }}
          >
            {checkedInToday ? <><CheckCircle size={16} style={{ verticalAlign: 'middle' }} /> 已签到</> : '每日签到 +2 积分'}
          </button>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ color: '#eef5ff', marginBottom: '12px' }}><Gift size={18} style={{ verticalAlign: 'middle' }} /> 购买积分包</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
            {CREDITS_RULES.packs.map((pack) => (
              <div key={pack.id} style={{
                padding: '20px', borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(9,15,32,0.5)',
                textAlign: 'center', cursor: 'pointer', transition: 'border-color 0.2s'
              }} onClick={() => handleBuyPack(pack)}>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#9eeeff' }}>{pack.credits}</div>
                <div style={{ fontSize: '12px', color: '#73859f' }}>积分</div>
                {pack.bonus > 0 && <div style={{ fontSize: '12px', color: '#78ffb9', marginTop: '4px' }}>赠送 {pack.bonus}</div>}
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#eef5ff', marginTop: '8px' }}>¥{pack.price}</div>
                <button style={{
                  marginTop: '8px', padding: '6px 16px', borderRadius: '6px',
                  border: '1px solid rgba(66,230,255,0.4)', background: 'rgba(66,230,255,0.08)',
                  color: '#9eeeff', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit'
                }}>购买</button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 style={{ color: '#eef5ff', marginBottom: '12px' }}><History size={18} style={{ verticalAlign: 'middle' }} /> 积分记录</h3>
          <div style={{
            borderRadius: '12px', border: '1px solid rgba(255,255,255,0.12)',
            background: 'rgba(9,15,32,0.5)', overflow: 'hidden'
          }}>
            {history.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#5a6a80' }}>暂无积分记录，签到或购买积分包后将显示记录</div>
            ) : (
              history.map((tx, i) => (
                <div key={tx.id || i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 16px', borderBottom: i < history.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none'
                }}>
                  <div>
                    <div style={{ fontSize: '14px', color: '#eef5ff' }}>{tx.description}</div>
                    <div style={{ fontSize: '12px', color: '#5a6a80' }}>{new Date(tx.createdAt).toLocaleString()}</div>
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: tx.amount > 0 ? '#78ffb9' : '#ff6b8a' }}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
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
              <h3 style={{ color: '#eef5ff', margin: 0 }}>确认支付</h3>
              <button onClick={() => setPaymentModal(null)} style={{ background: 'none', border: 'none', color: '#73859f', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <div style={{ padding: '16px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '20px', textAlign: 'center' }}>
              <div style={{ fontSize: '14px', color: '#73859f' }}>{paymentModal.label}</div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: '#f9ff72', marginTop: '8px' }}>¥{paymentModal.price}</div>
              {paymentModal.bonus > 0 && <div style={{ fontSize: '13px', color: '#78ffb9', marginTop: '4px' }}>含赠送 {paymentModal.bonus} 积分</div>}
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
              {processing ? '处理中...' : `确认支付 ¥${paymentModal.price}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
