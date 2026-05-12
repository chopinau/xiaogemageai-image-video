import React, { useState, useEffect, useCallback } from 'react';
import { useNotification } from '../../contexts/NotificationContext';
import { AI_MODELS } from '../../config/models';
import { RefreshCw, Plus, Trash2, Download, DollarSign, TrendingUp, Link, Check, X, ChevronDown, ChevronUp, Search, Zap, Activity, BarChart3, AlertTriangle, Heart, Shield, ArrowRightLeft } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
const ADMIN_KEY = 'admin123';

function apiCall(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', 'x-admin-key': ADMIN_KEY, ...options.headers };
  return fetch(`${API_BASE}${path}`, { ...options, headers });
}

function formatCNY(price) {
  if (price === undefined || price === null) return '--';
  if (price < 0.01) return `¥${(price * 1000).toFixed(2)}m`;
  if (price < 1) return `¥${price.toFixed(4)}`;
  return `¥${price.toFixed(2)}`;
}

function formatCredits(credits) {
  if (!credits) return '--';
  return `${credits} 算力`;
}

function HealthBadge({ status }) {
  const config = {
    healthy: { color: '#78ffb9', bg: 'rgba(120,255,185,0.12)', label: '健康' },
    degraded: { color: '#f9ff72', bg: 'rgba(249,255,114,0.12)', label: '降级' },
    down: { color: '#ff6b8a', bg: 'rgba(255,106,138,0.12)', label: '故障' },
    unknown: { color: '#73859f', bg: 'rgba(115,133,159,0.12)', label: '未知' }
  };
  const c = config[status] || config.unknown;
  return <span style={{ color: c.color, background: c.bg, padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 700 }}>{c.label}</span>;
}

export function PricingAdmin() {
  const notify = useNotification();
  const [activeSubTab, setActiveSubTab] = useState('overview');
  const [loading, setLoading] = useState(false);

  const SUB_TABS = [
    { id: 'overview', label: '价格总览', icon: DollarSign },
    { id: 'upstream', label: '上游监控', icon: Link },
    { id: 'compare', label: '供应商比价', icon: ArrowRightLeft },
    { id: 'adjust', label: '价格调整', icon: TrendingUp },
    { id: 'history', label: '变更记录', icon: RefreshCw }
  ];

  return (
    <div>
      <h2 className="adminPageTitle">API 价格管理</h2>
      <div className="pricingAdminTabs">
        {SUB_TABS.map(tab => (
          <button
            key={tab.id}
            className={`pricingAdminTab ${activeSubTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveSubTab(tab.id)}
          >
            <tab.icon size={14} /> {tab.label}
          </button>
        ))}
      </div>
      <div className="pricingAdminContent">
        {activeSubTab === 'overview' && <PriceOverviewTab notify={notify} />}
        {activeSubTab === 'upstream' && <UpstreamMonitorTab notify={notify} />}
        {activeSubTab === 'compare' && <PriceCompareTab notify={notify} />}
        {activeSubTab === 'adjust' && <PriceAdjustTab notify={notify} />}
        {activeSubTab === 'history' && <PriceHistoryTab notify={notify} />}
      </div>
    </div>
  );
}

function PriceOverviewTab({ notify }) {
  const [models, setModels] = useState([]);
  const [markupConfig, setMarkupConfigData] = useState({ defaultPercent: 15, perModel: {} });
  const [search, setSearch] = useState('');
  const [expandedModel, setExpandedModel] = useState(null);
  const [livePricing, setLivePricing] = useState({});
  const [fetchingLive, setFetchingLive] = useState(false);
  const [usageStats, setUsageStats] = useState(null);

  useEffect(() => {
    loadModels();
    loadMarkupConfig();
    loadUsageStats();
  }, []);

  async function loadModels() {
    try {
      const res = await apiCall('/pricing-admin/models');
      const data = await res.json();
      if (data.success) {
        setModels(data.models || {});
        setMarkupConfigData(data.markupConfig || { defaultPercent: 15, perModel: {} });
      }
    } catch (err) {
      console.error('Failed to load models:', err);
    }
  }

  async function loadMarkupConfig() {
    try {
      const res = await apiCall('/pricing-admin/markup');
      const data = await res.json();
      if (data.success) setMarkupConfigData(data.config);
    } catch (err) {
      console.error('Failed to load markup config:', err);
    }
  }

  async function loadUsageStats() {
    try {
      const res = await apiCall('/pricing-admin/usage/stats');
      const data = await res.json();
      if (data.success) setUsageStats(data.data);
    } catch (err) {
      console.error('Failed to load usage stats:', err);
    }
  }

  async function fetchLivePrices() {
    setFetchingLive(true);
    try {
      const res = await apiCall('/pricing-admin/live/fetch-all', { method: 'POST' });
      const data = await res.json();
      if (data.success && data.data) {
        setLivePricing(data.data);
        notify.success('实时价格获取成功');
      } else {
        notify.error('获取实时价格失败');
      }
    } catch (err) {
      notify.error('获取实时价格失败: ' + err.message);
    }
    setFetchingLive(false);
  }

  const allModels = [];
  for (const [cat, catModels] of Object.entries(AI_MODELS)) {
    for (const model of Object.values(catModels)) {
      allModels.push({ ...model, category: cat });
    }
  }

  const filtered = allModels.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.id.toLowerCase().includes(search.toLowerCase()) ||
    m.provider.toLowerCase().includes(search.toLowerCase())
  );

  const modelCallCounts = {};
  if (usageStats?.modelStats) {
    for (const [model, stats] of usageStats.modelStats) {
      modelCallCounts[model] = stats.totalCalls;
    }
  }

  return (
    <div>
      <div className="pricingAdminToolbar">
        <div className="pricingAdminSearch">
          <Search size={14} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索模型..." className="adminInput" />
        </div>
        <button className="adminPrimaryBtn" onClick={fetchLivePrices} disabled={fetchingLive}>
          <RefreshCw size={14} className={fetchingLive ? 'spinning' : ''} /> 获取实时价格
        </button>
      </div>

      {usageStats && (
        <div className="adminStatGrid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', marginBottom: '16px' }}>
          <div className="adminStatCard">
            <div className="adminStatLabel">今日总请求</div>
            <div className="adminStatValue" style={{ color: '#42e6ff' }}>{usageStats.activeUsers || 0}</div>
          </div>
          <div className="adminStatCard">
            <div className="adminStatLabel">今日消费</div>
            <div className="adminStatValue" style={{ color: '#f9ff72' }}>¥{usageStats.totalDailySpent || 0}</div>
          </div>
          <div className="adminStatCard">
            <div className="adminStatLabel">活跃用户</div>
            <div className="adminStatValue" style={{ color: '#78ffb9' }}>{usageStats.activeUsers || 0}</div>
          </div>
          <div className="adminStatCard">
            <div className="adminStatLabel">熔断告警</div>
            <div className="adminStatValue" style={{ color: Object.keys(usageStats.circuitBreakers || {}).length > 0 ? '#ff6b8a' : '#78ffb9' }}>
              {Object.values(usageStats.circuitBreakers || {}).filter(cb => cb.state === 'open').length}
            </div>
          </div>
        </div>
      )}

      <div className="pricingAdminMarkupBar">
        <span className="pricingAdminMarkupLabel">默认加价率：</span>
        <span className="pricingAdminMarkupValue">{markupConfig.defaultPercent}%</span>
        <span className="pricingAdminMarkupHint">（上游价格 × (1 + 加价率) = 售价）</span>
      </div>

      <div className="adminTableWrap">
        <table className="adminTable pricingTable">
          <thead>
            <tr>
              <th>模型</th>
              <th>供应商</th>
              <th>类别</th>
              <th>基础算力</th>
              <th>加价率</th>
              <th>上游最低价</th>
              <th>今日调用</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(m => {
              const liveData = livePricing[m.lingkeModel || m.id];
              const activeGroups = liveData?.channel_groups?.filter(g => g.is_active !== false) || [];
              const cheapestUpstream = activeGroups.length > 0
                ? Math.min(...activeGroups.map(g => g.base_price))
                : null;
              const markup = markupConfig.perModel?.[m.id] ?? markupConfig.defaultPercent;
              const isExpanded = expandedModel === m.id;
              const callCount = modelCallCounts[m.id] || modelCallCounts[m.lingkeModel] || 0;

              return (
                <React.Fragment key={m.id}>
                  <tr>
                    <td>
                      <div className="pricingModelCell">
                        <span className="pricingModelName">{m.name}</span>
                        <span className="pricingModelId">{m.id}</span>
                      </div>
                    </td>
                    <td className="adminCellMuted">{m.provider}</td>
                    <td className="adminCellMuted">{m.category}</td>
                    <td className="adminCellCredits">{formatCredits(m.pricing?.baseCredits)}</td>
                    <td>
                      <span className="pricingMarkupBadge" style={{ background: markup > 20 ? 'rgba(255,106,138,0.15)' : markup > 10 ? 'rgba(249,255,114,0.15)' : 'rgba(120,255,185,0.15)', color: markup > 20 ? '#ff6b8a' : markup > 10 ? '#f9ff72' : '#78ffb9' }}>
                        {markup}%
                      </span>
                    </td>
                    <td className="adminCellCredits">{cheapestUpstream !== null ? formatCNY(cheapestUpstream) : '--'}</td>
                    <td>
                      {callCount > 0 ? <span style={{ color: '#42e6ff', fontWeight: 700 }}>{callCount}</span> : <span style={{ color: '#5a6a80' }}>0</span>}
                    </td>
                    <td>
                      <button className="adminActionBtn" onClick={() => setExpandedModel(isExpanded ? null : m.id)}>
                        {isExpanded ? '收起' : '详情'}
                      </button>
                    </td>
                  </tr>
                  {isExpanded && liveData && (
                    <tr className="pricingExpandedRow">
                      <td colSpan={8}>
                        <div className="pricingGroupDetail">
                          <div className="pricingGroupDetailHeader">
                            <span>渠道分组详情</span>
                            <span className="pricingGroupDetailCount">{liveData.channel_groups?.length || 0} 个分组</span>
                          </div>
                          <div className="pricingGroupCards">
                            {(liveData.channel_groups || []).map((group, idx) => {
                              const sellingPrice = group.base_price * (1 + markup / 100);
                              return (
                                <div key={idx} className={`pricingGroupCard ${group.is_active === false ? 'inactive' : ''}`}>
                                  <div className="pricingGroupCardHeader">
                                    <span className="pricingGroupCardName">{group.group_name}</span>
                                    {group.is_active === false && <span className="cgpBadge inactive">已关闭</span>}
                                  </div>
                                  <div className="pricingGroupCardStats">
                                    <div>上游价: <strong>{formatCNY(group.base_price)}</strong></div>
                                    <div>售价: <strong style={{ color: '#78ffb9' }}>{formatCNY(sellingPrice)}</strong></div>
                                    <div>成功率: <span style={{ color: group.success_rate_24h >= 90 ? '#78ffb9' : group.success_rate_24h >= 70 ? '#f9ff72' : '#ff6b8a' }}>{group.success_rate_24h > 0 ? `${group.success_rate_24h.toFixed(1)}%` : '--'}</span></div>
                                    <div>耗时: {group.avg_response_seconds > 0 ? `${Math.round(group.avg_response_seconds)}s` : '--'}</div>
                                  </div>
                                  {group.option_prices && group.option_prices.length > 0 && (
                                    <div className="pricingGroupOptions">
                                      {group.option_prices.map((opt, i) => (
                                        <div key={i} className="pricingGroupOption">
                                          <span>{opt.option_label || `${opt.param_name}=${opt.option_value}`}</span>
                                          <span>{formatCNY(opt.final_price || group.base_price)}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UpstreamMonitorTab({ notify }) {
  const [providers, setProviders] = useState([]);
  const [fetchedPrices, setFetchedPrices] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProvider, setNewProvider] = useState({ name: '', url: '', apiKey: '' });
  const [fetching, setFetching] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [selectedModels, setSelectedModels] = useState({});
  const [applying, setApplying] = useState(false);
  const [applyResults, setApplyResults] = useState(null);
  const [healthData, setHealthData] = useState({});
  const [checkingHealth, setCheckingHealth] = useState(false);

  useEffect(() => {
    loadProviders();
    loadFetchedPrices();
  }, []);

  async function loadProviders() {
    try {
      const res = await apiCall('/pricing-admin/upstream/providers');
      const data = await res.json();
      if (data.success) setProviders(data.providers);
    } catch (err) {
      console.error('Failed to load providers:', err);
    }
  }

  async function loadFetchedPrices() {
    try {
      const res = await apiCall('/pricing-admin/upstream/prices');
      const data = await res.json();
      if (data.success) setFetchedPrices(data.data);
    } catch (err) {
      console.error('Failed to load fetched prices:', err);
    }
  }

  async function checkHealth() {
    setCheckingHealth(true);
    try {
      const res = await apiCall('/pricing-admin/upstream/health');
      const data = await res.json();
      if (data.success) {
        setHealthData(data.data);
        notify.success('健康检查完成');
      }
    } catch (err) {
      notify.error('健康检查失败: ' + err.message);
    }
    setCheckingHealth(false);
  }

  async function addProvider() {
    if (!newProvider.name || !newProvider.url || !newProvider.apiKey) {
      notify.error('请填写完整的供应商信息');
      return;
    }
    try {
      const res = await apiCall('/pricing-admin/upstream/providers', {
        method: 'POST',
        body: JSON.stringify(newProvider)
      });
      const data = await res.json();
      if (data.success) {
        notify.success(`供应商 ${newProvider.name} 添加成功`);
        setNewProvider({ name: '', url: '', apiKey: '' });
        setShowAddForm(false);
        loadProviders();
      } else {
        notify.error(data.error || '添加失败');
      }
    } catch (err) {
      notify.error('添加失败: ' + err.message);
    }
  }

  async function removeProvider(name) {
    try {
      const res = await apiCall(`/pricing-admin/upstream/providers/${encodeURIComponent(name)}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        notify.success(`供应商 ${name} 已删除`);
        setSelectedProvider(null);
        setSelectedModels({});
        setApplyResults(null);
        loadProviders();
      }
    } catch (err) {
      notify.error('删除失败');
    }
  }

  async function fetchPrices(providerName) {
    setFetching(true);
    try {
      const res = await apiCall('/pricing-admin/upstream/fetch', {
        method: 'POST',
        body: JSON.stringify({ providerName: providerName || undefined })
      });
      const data = await res.json();
      if (data.success) {
        notify.success('上游价格抓取成功');
        setApplyResults(null);
        loadFetchedPrices();
      } else {
        notify.error('抓取失败');
      }
    } catch (err) {
      notify.error('抓取失败: ' + err.message);
    }
    setFetching(false);
  }

  async function checkFallback(providerName, modelName) {
    try {
      const res = await apiCall(`/pricing-admin/upstream/fallback/${encodeURIComponent(providerName)}/${encodeURIComponent(modelName)}`);
      const data = await res.json();
      if (data.success && data.hasFallback) {
        notify.success(`可切换到供应商: ${data.fallback.provider.name}`);
      } else {
        notify.warning('暂无可用的备选供应商');
      }
    } catch (err) {
      notify.error('查询失败');
    }
  }

  function toggleModelSelection(upstreamModelName) {
    setSelectedModels(prev => {
      const next = { ...prev };
      if (next[upstreamModelName]) {
        delete next[upstreamModelName];
      } else {
        next[upstreamModelName] = upstreamModelName;
      }
      return next;
    });
    setApplyResults(null);
  }

  function updateModelMapping(upstreamModel, localModelId) {
    setSelectedModels(prev => ({ ...prev, [upstreamModel]: localModelId }));
    setApplyResults(null);
  }

  function selectAllModels() {
    const models = Object.entries(fetchedPrices?.providers?.[selectedProvider]?.models || {});
    const newSelection = {};
    models.forEach(([name]) => { newSelection[name] = name; });
    setSelectedModels(newSelection);
    setApplyResults(null);
  }

  function clearAllModels() {
    setSelectedModels({});
    setApplyResults(null);
  }

  async function applySelectedModels() {
    const entries = Object.entries(selectedModels);
    if (entries.length === 0) {
      notify.error('请至少选中一个模型');
      return;
    }
    setApplying(true);
    try {
      const modelMappings = entries.map(([upstream, local]) => ({ upstreamModel: upstream, localModel: local, groupIndex: 0 }));
      const res = await apiCall('/pricing-admin/upstream/apply', {
        method: 'POST',
        body: JSON.stringify({ providerName: selectedProvider, modelMappings })
      });
      const data = await res.json();
      setApplyResults(data);
      const successCount = data.results?.filter(r => r.saved).length || 0;
      if (successCount > 0) {
        notify.success(`成功同步 ${successCount}/${entries.length} 个模型价格`);
      } else {
        notify.error('价格同步失败');
      }
    } catch (err) {
      notify.error('应用失败: ' + err.message);
    }
    setApplying(false);
  }

  const providerModels = selectedProvider && fetchedPrices?.providers?.[selectedProvider]
    ? Object.entries(fetchedPrices.providers[selectedProvider].models || {})
    : [];
  const selectedCount = Object.keys(selectedModels).length;
  const allLocalModels = flatLocalModels();

  return (
    <div>
      <div className="pricingAdminToolbar">
        <button className="adminPrimaryBtn" onClick={() => fetchPrices()} disabled={fetching}>
          <RefreshCw size={14} className={fetching ? 'spinning' : ''} /> 抓取全部上游价格
        </button>
        <button className="adminActionBtn" onClick={checkHealth} disabled={checkingHealth}>
          <Activity size={14} /> 健康检查
        </button>
        <button className="adminActionBtn" onClick={() => setShowAddForm(!showAddForm)}>
          <Plus size={14} /> 添加供应商
        </button>
      </div>

      {showAddForm && (
        <div className="adminCard" style={{ marginBottom: '16px' }}>
          <h3 className="adminCardTitle">添加上游供应商</h3>
          <div className="adminGrid2">
            <div className="adminFormField">
              <label className="adminLabel">名称</label>
              <input className="adminInput" placeholder="如：LingkeAPI" value={newProvider.name} onChange={e => setNewProvider(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="adminFormField">
              <label className="adminLabel">API URL</label>
              <input className="adminInput" placeholder="https://api.example.com/api" value={newProvider.url} onChange={e => setNewProvider(p => ({ ...p, url: e.target.value }))} />
            </div>
            <div className="adminFormField">
              <label className="adminLabel">API Key</label>
              <input className="adminInput" type="password" placeholder="Bearer Token" value={newProvider.apiKey} onChange={e => setNewProvider(p => ({ ...p, apiKey: e.target.value }))} />
            </div>
            <div className="adminFormField" style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button className="adminPrimaryBtn" onClick={addProvider}>添加</button>
            </div>
          </div>
        </div>
      )}

      <div className="adminTableWrap" style={{ marginBottom: '24px' }}>
        <table className="adminTable">
          <thead>
            <tr>
              <th>名称</th>
              <th>URL</th>
              <th>API Key</th>
              <th>健康状态</th>
              <th>响应时间</th>
              <th>添加时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {providers.map(p => {
              const health = healthData[p.name];
              return (
                <tr key={p.name}>
                  <td><strong>{p.name}</strong></td>
                  <td className="adminCellMuted" style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.url}</td>
                  <td className="adminCellMuted">{p.apiKey}</td>
                  <td><HealthBadge status={health?.status} /></td>
                  <td className="adminCellMuted">{health?.responseTime ? `${health.responseTime}ms` : '--'}</td>
                  <td className="adminCellMuted">{p.addedAt ? new Date(p.addedAt).toLocaleDateString() : '--'}</td>
                  <td>
                    <div className="adminActionBtns">
                      <button className="adminActionBtn" onClick={() => fetchPrices(p.name)} disabled={fetching}>
                        <Download size={12} /> 抓取
                      </button>
                      <button className="adminActionBtn" onClick={() => checkHealth()} disabled={checkingHealth}>
                        <Heart size={12} />
                      </button>
                      <button className="adminActionBtn danger" onClick={() => removeProvider(p.name)}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {providers.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: 'center', color: '#73859f', padding: '24px' }}>暂无上游供应商，请点击"添加供应商"</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {fetchedPrices && fetchedPrices.lastFetch && (
        <div className="adminCard">
          <h3 className="adminCardTitle">上游价格数据 & 一键匹配</h3>
          <div className="pricingAdminMarkupBar" style={{ marginBottom: '12px' }}>
            <span>最后抓取时间：{new Date(fetchedPrices.lastFetch).toLocaleString()}</span>
          </div>

          <div className="adminFormField" style={{ marginBottom: '16px' }}>
            <label className="adminLabel">选择供应商查看和匹配</label>
            <select className="adminInput" value={selectedProvider || ''} onChange={e => { setSelectedProvider(e.target.value || null); setSelectedModels({}); setApplyResults(null); }}>
              <option value="">-- 选择 --</option>
              {Object.keys(fetchedPrices.providers || {}).map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          {selectedProvider && providerModels.length > 0 && (
            <>
              <div className="pricingAdminToolbar">
                <button className="adminActionBtn" onClick={selectAllModels}>全选</button>
                <button className="adminActionBtn" onClick={clearAllModels}>清空</button>
                <button className="adminPrimaryBtn" onClick={applySelectedModels} disabled={applying || selectedCount === 0}>
                  <Zap size={14} /> 一键匹配并应用 ({selectedCount})
                </button>
                <span className="pricingAdminMarkupHint" style={{ marginLeft: '8px' }}>
                  勾选上游模型后点击"一键匹配并应用"，系统自动按名称匹配到本地模型并应用价格
                </span>
              </div>

              <div className="adminTableWrap">
                <table className="adminTable">
                  <thead>
                    <tr>
                      <th style={{ width: '40px' }}></th>
                      <th>上游模型</th>
                      <th>匹配到本地</th>
                      <th>类型</th>
                      <th>分组数</th>
                      <th>上游最低价</th>
                      <th>故障切换</th>
                      <th>状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {providerModels.map(([modelName, modelData]) => {
                      const activeGroups = (modelData.channel_groups || []).filter(g => g.is_active !== false);
                      const cheapest = activeGroups.length > 0 ? Math.min(...activeGroups.map(g => g.base_price)) : null;
                      const isSelected = !!selectedModels[modelName];
                      const mappedName = selectedModels[modelName] || modelName;
                      const applyResult = applyResults?.results?.find(r => r.upstreamModel === modelName);

                      return (
                        <tr key={modelName} style={{ background: isSelected ? 'rgba(66,230,255,0.06)' : undefined }}>
                          <td>
                            <input type="checkbox" checked={isSelected} onChange={() => toggleModelSelection(modelName)}
                              style={{ accentColor: '#42e6ff', width: '16px', height: '16px', cursor: 'pointer' }}
                            />
                          </td>
                          <td>
                            <div className="pricingModelCell">
                              <span className="pricingModelName">{modelData.display_name || modelName}</span>
                              <span className="pricingModelId">{modelName}</span>
                            </div>
                          </td>
                          <td>
                            {isSelected ? (
                              <select
                                className="adminInput" style={{ width: '180px', fontSize: '12px' }}
                                value={mappedName}
                                onChange={e => updateModelMapping(modelName, e.target.value)}
                              >
                                <option value={modelName}>{modelName} (自动)</option>
                                <optgroup label="本地模型">
                                  {allLocalModels.map(lm => (
                                    <option key={lm.id} value={lm.id}>{lm.name} ({lm.id})</option>
                                  ))}
                                </optgroup>
                              </select>
                            ) : (
                              <span className="adminCellMuted">{modelName}</span>
                            )}
                          </td>
                          <td className="adminCellMuted">{modelData.type || '--'}</td>
                          <td>{activeGroups.length}</td>
                          <td className="adminCellCredits">
                            {cheapest !== null ? formatCNY(cheapest) : '--'}
                          </td>
                          <td>
                            <button className="adminActionBtn" onClick={() => checkFallback(selectedProvider, modelName)} style={{ fontSize: '11px' }}>
                              <Shield size={10} /> 切换
                            </button>
                          </td>
                          <td>
                            {applyResult ? (
                              applyResult.saved
                                ? <span style={{ color: '#78ffb9', fontSize: '12px' }}>✓ 已同步</span>
                                : <span style={{ color: '#ff6b8a', fontSize: '12px' }}>✗ 失败</span>
                            ) : null}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {applyResults && (
                <div className="adminCard" style={{ marginTop: '16px' }}>
                  <h3 className="adminCardTitle">同步结果</h3>
                  <div className="adminTableWrap">
                    <table className="adminTable">
                      <thead>
                        <tr>
                          <th>上游模型</th>
                          <th>本地模型</th>
                          <th>上游价</th>
                          <th>最终售价</th>
                          <th>分组</th>
                          <th>状态</th>
                        </tr>
                      </thead>
                      <tbody>
                        {applyResults.results?.map((r, idx) => (
                          <tr key={idx}>
                            <td className="adminCellId">{r.upstreamModel}</td>
                            <td className="adminCellId">{r.localModel}</td>
                            <td className="adminCellCredits">{r.upstreamPrice ? formatCNY(r.upstreamPrice) : '--'}</td>
                            <td className="adminCellCredits" style={{ color: '#78ffb9' }}>{r.finalPrice ? formatCNY(r.finalPrice) : '--'}</td>
                            <td className="adminCellMuted">{r.groupName || 'default'}</td>
                            <td>
                              {r.saved ? (
                                <span style={{ color: '#78ffb9', fontSize: '12px', fontWeight: 700 }}>✓ 已同步</span>
                              ) : (
                                <span style={{ color: '#ff6b8a', fontSize: '12px' }}>{r.error || '失败'}</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function PriceCompareTab({ notify }) {
  const [compareData, setCompareData] = useState([]);
  const [selectedModel, setSelectedModel] = useState(null);
  const [modelCompareDetail, setModelCompareDetail] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    loadCompareData();
  }, []);

  async function loadCompareData() {
    setLoading(true);
    try {
      const res = await apiCall('/pricing-admin/upstream/compare');
      const data = await res.json();
      if (data.success) setCompareData(data.data);
    } catch (err) {
      console.error('Failed to load compare data:', err);
    }
    setLoading(false);
  }

  async function loadModelCompare(modelName) {
    setSelectedModel(modelName);
    try {
      const res = await apiCall(`/pricing-admin/upstream/compare?model=${encodeURIComponent(modelName)}`);
      const data = await res.json();
      if (data.success) setModelCompareDetail(data.data);
    } catch (err) {
      console.error('Failed to load model compare:', err);
    }
  }

  const filtered = filterType === 'all' ? compareData : compareData.filter(m => m.type === filterType);
  const multiProviderModels = filtered.filter(m => m.providerCount > 1);

  return (
    <div>
      <div className="pricingAdminToolbar">
        <button className="adminPrimaryBtn" onClick={loadCompareData} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'spinning' : ''} /> 刷新比价数据
        </button>
        <div style={{ display: 'flex', gap: '6px' }}>
          {['all', 'image', 'video', 'text'].map(t => (
            <button key={t} className={`adminActionBtn ${filterType === t ? 'active' : ''}`} onClick={() => setFilterType(t)}>
              {t === 'all' ? '全部' : t === 'image' ? '图片' : t === 'video' ? '视频' : '文本'}
            </button>
          ))}
        </div>
      </div>

      {multiProviderModels.length > 0 && (
        <div className="adminCard" style={{ marginBottom: '16px' }}>
          <h3 className="adminCardTitle">
            <AlertTriangle size={14} style={{ color: '#f9ff72', marginRight: '6px' }} />
            多供应商模型比价 ({multiProviderModels.length} 个模型有多个供应商)
          </h3>
          <div className="adminTableWrap">
            <table className="adminTable">
              <thead>
                <tr>
                  <th>模型</th>
                  <th>类型</th>
                  <th>供应商数</th>
                  <th>最低价</th>
                  <th>最高价</th>
                  <th>价差%</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {multiProviderModels.map(m => (
                  <tr key={m.model} style={{ background: selectedModel === m.model ? 'rgba(66,230,255,0.06)' : undefined }}>
                    <td>
                      <div className="pricingModelCell">
                        <span className="pricingModelName">{m.displayName}</span>
                        <span className="pricingModelId">{m.model}</span>
                      </div>
                    </td>
                    <td className="adminCellMuted">{m.type}</td>
                    <td><span style={{ color: '#42e6ff', fontWeight: 700 }}>{m.providerCount}</span></td>
                    <td className="adminCellCredits" style={{ color: '#78ffb9' }}>{m.bestPrice !== null ? formatCNY(m.bestPrice) : '--'}</td>
                    <td className="adminCellCredits" style={{ color: '#ff6b8a' }}>{m.worstPrice !== null ? formatCNY(m.worstPrice) : '--'}</td>
                    <td>
                      <span style={{ color: m.priceDiff > 20 ? '#ff6b8a' : m.priceDiff > 10 ? '#f9ff72' : '#78ffb9', fontWeight: 700 }}>
                        {m.priceDiff > 0 ? `+${m.priceDiff}%` : '0%'}
                      </span>
                    </td>
                    <td>
                      <button className="adminActionBtn" onClick={() => loadModelCompare(m.model)}>
                        <BarChart3 size={12} /> 详情
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedModel && modelCompareDetail.length > 0 && (
        <div className="adminCard">
          <h3 className="adminCardTitle">
            <ArrowRightLeft size={14} style={{ color: '#42e6ff', marginRight: '6px' }} />
            {selectedModel} - 供应商价格对比
          </h3>
          <div className="adminTableWrap">
            <table className="adminTable">
              <thead>
                <tr>
                  <th>排名</th>
                  <th>供应商</th>
                  <th>健康状态</th>
                  <th>最低价</th>
                  <th>分组数</th>
                  <th>响应时间</th>
                  <th>推荐</th>
                </tr>
              </thead>
              <tbody>
                {modelCompareDetail.map((item, idx) => (
                  <tr key={item.provider} style={{ background: idx === 0 ? 'rgba(120,255,185,0.06)' : undefined }}>
                    <td>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: '24px', height: '24px', borderRadius: '50%',
                        background: idx === 0 ? 'rgba(120,255,185,0.2)' : idx === 1 ? 'rgba(249,255,114,0.15)' : 'rgba(115,133,159,0.1)',
                        color: idx === 0 ? '#78ffb9' : idx === 1 ? '#f9ff72' : '#73859f',
                        fontSize: '12px', fontWeight: 800
                      }}>
                        {idx + 1}
                      </span>
                    </td>
                    <td><strong>{item.provider}</strong></td>
                    <td><HealthBadge status={item.providerHealth} /></td>
                    <td className="adminCellCredits" style={{ color: idx === 0 ? '#78ffb9' : '#fff' }}>
                      {item.cheapestPrice !== null ? formatCNY(item.cheapestPrice) : '--'}
                    </td>
                    <td>{item.groupCount}</td>
                    <td className="adminCellMuted">{item.responseTime ? `${item.responseTime}ms` : '--'}</td>
                    <td>
                      {idx === 0 && item.cheapestPrice !== null && (
                        <span style={{ color: '#78ffb9', fontSize: '11px', fontWeight: 700 }}>
                          ✓ 最优选择
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {modelCompareDetail.some(item => item.groups?.length > 0) && (
            <div style={{ marginTop: '16px' }}>
              <h4 style={{ color: '#9eeeff', fontSize: '13px', marginBottom: '8px' }}>渠道分组详情</h4>
              <div className="pricingGroupCards">
                {modelCompareDetail.map(item => (
                  item.groups?.map((group, idx) => (
                    <div key={`${item.provider}-${idx}`} className="pricingGroupCard">
                      <div className="pricingGroupCardHeader">
                        <span className="pricingGroupCardName">{item.provider} / {group.name}</span>
                      </div>
                      <div className="pricingGroupCardStats">
                        <div>价格: <strong style={{ color: '#78ffb9' }}>{formatCNY(group.price)}</strong></div>
                        <div>成功率: <span style={{ color: group.successRate >= 90 ? '#78ffb9' : '#f9ff72' }}>{group.successRate > 0 ? `${group.successRate.toFixed(1)}%` : '--'}</span></div>
                        <div>耗时: {group.avgResponse > 0 ? `${Math.round(group.avgResponse)}s` : '--'}</div>
                      </div>
                    </div>
                  ))
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!selectedModel && multiProviderModels.length === 0 && (
        <div className="adminCard">
          <div style={{ textAlign: 'center', color: '#73859f', padding: '32px' }}>
            <BarChart3 size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
            <p>暂无比价数据，请先添加多个供应商并抓取价格</p>
            <p style={{ fontSize: '12px', color: '#5a6a80' }}>当同一模型在多个供应商都有报价时，此处将展示价格对比</p>
          </div>
        </div>
      )}
    </div>
  );
}

function flatLocalModels() {
  const all = [];
  for (const [cat, catModels] of Object.entries(AI_MODELS)) {
    for (const model of Object.values(catModels)) {
      all.push({ ...model, category: cat });
    }
  }
  return all;
}

function PriceAdjustTab({ notify }) {
  const [markupConfig, setMarkupConfigData] = useState({ defaultPercent: 15, perModel: {} });
  const [editingModel, setEditingModel] = useState(null);
  const [editMarkup, setEditMarkup] = useState('');

  useEffect(() => {
    loadMarkupConfig();
  }, []);

  async function loadMarkupConfig() {
    try {
      const res = await apiCall('/pricing-admin/markup');
      const data = await res.json();
      if (data.success) setMarkupConfigData(data.config);
    } catch (err) {
      console.error('Failed to load markup config:', err);
    }
  }

  async function saveDefaultMarkup() {
    try {
      const res = await apiCall('/pricing-admin/markup', {
        method: 'PUT',
        body: JSON.stringify({ defaultPercent: markupConfig.defaultPercent })
      });
      const data = await res.json();
      if (data.success) {
        notify.success(`默认加价率已更新为 ${markupConfig.defaultPercent}%`);
        loadMarkupConfig();
      }
    } catch (err) {
      notify.error('保存失败');
    }
  }

  async function saveModelMarkup(modelId, markup) {
    try {
      const res = await apiCall(`/pricing-admin/markup/${encodeURIComponent(modelId)}`, {
        method: 'PUT',
        body: JSON.stringify({ markupPercent: parseFloat(markup) })
      });
      const data = await res.json();
      if (data.success) {
        notify.success(`模型 ${modelId} 加价率已更新为 ${markup}%`);
        setEditingModel(null);
        loadMarkupConfig();
      }
    } catch (err) {
      notify.error('保存失败');
    }
  }

  const allModels = [];
  for (const [cat, catModels] of Object.entries(AI_MODELS)) {
    for (const model of Object.values(catModels)) {
      allModels.push({ ...model, category: cat });
    }
  }

  return (
    <div>
      <div className="adminCard" style={{ marginBottom: '24px' }}>
        <h3 className="adminCardTitle">全局加价率配置</h3>
        <p style={{ color: '#73859f', fontSize: '13px', marginBottom: '12px' }}>
          售价 = 上游价格 × (1 + 加价率%)。加价率越高，利润越大但价格竞争力越低。
        </p>
        <div className="adminGrid2">
          <div className="adminFormField">
            <label className="adminLabel">默认加价率 (%)</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="number" className="adminInput"
                value={markupConfig.defaultPercent}
                onChange={e => setMarkupConfigData(prev => ({ ...prev, defaultPercent: parseFloat(e.target.value) || 0 }))}
              />
              <button className="adminPrimaryBtn" onClick={saveDefaultMarkup}>保存</button>
            </div>
          </div>
          <div className="adminFormField">
            <label className="adminLabel">快速设置</label>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {[10, 15, 20, 25, 30, 50].map(v => (
                <button
                  key={v} className={`adminActionBtn ${markupConfig.defaultPercent === v ? 'active' : ''}`}
                  onClick={() => { setMarkupConfigData(prev => ({ ...prev, defaultPercent: v })); }}
                >{v}%</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <h3 className="adminCardTitle" style={{ marginBottom: '12px' }}>按模型调整加价率</h3>
      <div className="adminTableWrap">
        <table className="adminTable">
          <thead>
            <tr>
              <th>模型</th>
              <th>供应商</th>
              <th>类别</th>
              <th>当前加价率</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {allModels.map(m => {
              const markup = markupConfig.perModel?.[m.id] ?? markupConfig.defaultPercent;
              const isEditing = editingModel === m.id;
              return (
                <tr key={m.id}>
                  <td>
                    <div className="pricingModelCell">
                      <span className="pricingModelName">{m.name}</span>
                      <span className="pricingModelId">{m.id}</span>
                    </div>
                  </td>
                  <td className="adminCellMuted">{m.provider}</td>
                  <td className="adminCellMuted">{m.category}</td>
                  <td>
                    {isEditing ? (
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <input
                          type="number" className="adminInput" style={{ width: '60px' }}
                          value={editMarkup}
                          onChange={e => setEditMarkup(e.target.value)}
                          autoFocus
                        />
                        <span>%</span>
                        <button className="adminActionBtn success" onClick={() => saveModelMarkup(m.id, editMarkup)}>
                          <Check size={12} />
                        </button>
                        <button className="adminActionBtn" onClick={() => setEditingModel(null)}>
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <span
                        className="pricingMarkupBadge"
                        style={{
                          background: markup > 20 ? 'rgba(255,106,138,0.15)' : markup > 10 ? 'rgba(249,255,114,0.15)' : 'rgba(120,255,185,0.15)',
                          color: markup > 20 ? '#ff6b8a' : markup > 10 ? '#f9ff72' : '#78ffb9',
                          cursor: 'pointer'
                        }}
                        onClick={() => { setEditingModel(m.id); setEditMarkup(String(markup)); }}
                      >
                        {markup}%
                      </span>
                    )}
                  </td>
                  <td>
                    <button className="adminActionBtn" onClick={() => { setEditingModel(m.id); setEditMarkup(String(markup)); }}>
                      调整
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PriceHistoryTab({ notify }) {
  const [history, setHistory] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadHistory();
  }, [page]);

  async function loadHistory() {
    try {
      const res = await apiCall(`/pricing-admin/history?page=${page}&limit=20`);
      const data = await res.json();
      if (data.success) {
        setHistory(data.entries || []);
        setTotal(data.total || 0);
      }
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  }

  return (
    <div>
      <div className="adminTableWrap">
        <table className="adminTable">
          <thead>
            <tr>
              <th>时间</th>
              <th>类别</th>
              <th>模型</th>
              <th>旧价格</th>
              <th>新价格</th>
              <th>变化</th>
              <th>原因</th>
            </tr>
          </thead>
          <tbody>
            {history.map((entry, idx) => (
              <tr key={idx}>
                <td className="adminCellMuted">{new Date(entry.timestamp).toLocaleString()}</td>
                <td>{entry.type}</td>
                <td className="adminCellId">{entry.model}</td>
                <td>{formatCNY(entry.oldPrice)}</td>
                <td>{formatCNY(entry.newPrice)}</td>
                <td>
                  <span style={{ color: entry.changePercent > 0 ? '#ff6b8a' : entry.changePercent < 0 ? '#78ffb9' : '#73859f' }}>
                    {entry.changePercent > 0 ? '+' : ''}{entry.changePercent}%
                  </span>
                </td>
                <td className="adminCellMuted">{entry.reason || '--'}</td>
              </tr>
            ))}
            {history.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: 'center', color: '#73859f', padding: '24px' }}>暂无价格变更记录</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {total > 20 && (
        <div className="pricingPagination">
          <button className="adminActionBtn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>上一页</button>
          <span className="pricingPageInfo">第 {page} 页 / 共 {Math.ceil(total / 20)} 页</span>
          <button className="adminActionBtn" disabled={page >= Math.ceil(total / 20)} onClick={() => setPage(p => p + 1)}>下一页</button>
        </div>
      )}
    </div>
  );
}
