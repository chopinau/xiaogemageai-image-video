import React, { useState, useEffect } from 'react';
import { useNotification } from '../../contexts/NotificationContext';
import { API_BASE, safeFetch } from '../../config/api';
import { Save, Palette, Type, Image, Eye } from 'lucide-react';

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

export function AgencyBrandConfig() {
  const notify = useNotification();
  const [agency, setAgency] = useState(null);
  const [form, setForm] = useState({ agencyName: '', logoUrl: '', primaryColor: '#42e6ff', description: '', heroTitle: '', heroSubtitle: '', footerText: '', hidePoweredBy: false });
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadAgency(); }, []);

  async function loadAgency() {
    try {
      const data = await agencyApiCall('/api/agency/me');
      if (data.success && data.data) {
        setAgency(data.data);
        const bc = data.data.brandConfig || {};
        setForm({
          agencyName: data.data.agencyName || '',
          logoUrl: data.data.logoUrl || '',
          primaryColor: data.data.primaryColor || '#42e6ff',
          description: data.data.description || '',
          heroTitle: bc.heroTitle || '',
          heroSubtitle: bc.heroSubtitle || '',
          footerText: bc.footerText || '',
          hidePoweredBy: bc.hidePoweredBy || false,
        });
      }
    } catch (err) {
      notify.error('加载代理商信息失败');
    }
  }

  async function saveBrand() {
    setSaving(true);
    try {
      const data = await agencyApiCall('/api/agency/me/brand', {
        method: 'PUT',
        body: JSON.stringify(form)
      });
      if (data.success) {
        notify.success('品牌配置保存成功');
        loadAgency();
      } else {
        notify.error(data.error || '保存失败');
      }
    } catch (err) {
      notify.error('保存失败: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  function InputField({ label, field, placeholder, icon: Icon, type = 'text' }) {
    return (
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#8888aa', fontSize: 13, marginBottom: 6 }}>
          {Icon && <Icon size={14} />} {label}
        </label>
        {type === 'textarea' ? (
          <textarea value={form[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} placeholder={placeholder}
            style={{ width: '100%', background: '#0d0d1a', border: '1px solid #2a2a4a', borderRadius: 8, padding: '10px 12px', color: '#fff', fontSize: 14, minHeight: 80, resize: 'vertical' }} />
        ) : (
          <input type={type} value={form[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} placeholder={placeholder}
            style={{ width: '100%', background: '#0d0d1a', border: '1px solid #2a2a4a', borderRadius: 8, padding: '10px 12px', color: '#fff', fontSize: 14 }} />
        )}
      </div>
    );
  }

  return (
    <div>
      <div style={{ background: '#1a1a2e', borderRadius: 12, padding: 24, border: '1px solid #2a2a4a', marginBottom: 20 }}>
        <h3 style={{ color: '#fff', fontSize: 16, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Palette size={18} /> 基本品牌信息
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <InputField label="品牌名称" field="agencyName" placeholder="输入品牌名称" icon={Type} />
          <InputField label="Logo URL" field="logoUrl" placeholder="输入Logo图片链接" icon={Image} />
          <InputField label="主色调" field="primaryColor" type="color" icon={Palette} />
          <div />
          <div style={{ gridColumn: '1 / -1' }}>
            <InputField label="品牌描述" field="description" placeholder="输入品牌描述" type="textarea" />
          </div>
        </div>
      </div>

      <div style={{ background: '#1a1a2e', borderRadius: 12, padding: 24, border: '1px solid #2a2a4a', marginBottom: 20 }}>
        <h3 style={{ color: '#fff', fontSize: 16, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Eye size={18} /> 页面展示配置
        </h3>
        <InputField label="首页标题" field="heroTitle" placeholder="例如: XX AI创作平台" />
        <InputField label="首页副标题" field="heroSubtitle" placeholder="例如: 一站式AI创作工具" />
        <InputField label="页脚文字" field="footerText" placeholder="页脚版权信息" type="textarea" />
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#ccc', fontSize: 14, cursor: 'pointer' }}>
          <input type="checkbox" checked={form.hidePoweredBy} onChange={e => setForm(f => ({ ...f, hidePoweredBy: e.target.checked }))} />
          隐藏"由小马AI提供技术支持"标识
        </label>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={saveBrand} disabled={saving} style={{
          background: 'linear-gradient(135deg, #42e6ff, #4ade80)', color: '#000', border: 'none',
          borderRadius: 8, padding: '10px 24px', fontSize: 14, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', gap: 8, opacity: saving ? 0.6 : 1
        }}>
          <Save size={16} /> {saving ? '保存中...' : '保存配置'}
        </button>
      </div>

      {form.primaryColor && (
        <div style={{ marginTop: 24, background: '#1a1a2e', borderRadius: 12, padding: 24, border: '1px solid #2a2a4a' }}>
          <h3 style={{ color: '#fff', fontSize: 16, fontWeight: 600, marginBottom: 16 }}>品牌预览</h3>
          <div style={{ background: form.primaryColor + '11', borderRadius: 12, padding: 32, border: `2px solid ${form.primaryColor}44` }}>
            {form.logoUrl && <img src={form.logoUrl} alt="logo" style={{ height: 40, marginBottom: 12 }} />}
            <h2 style={{ color: form.primaryColor, fontSize: 24, fontWeight: 700, marginBottom: 8 }}>{form.heroTitle || form.agencyName || '品牌名称'}</h2>
            <p style={{ color: '#8888aa', fontSize: 14 }}>{form.heroSubtitle || 'AI创作平台'}</p>
          </div>
        </div>
      )}
    </div>
  );
}
