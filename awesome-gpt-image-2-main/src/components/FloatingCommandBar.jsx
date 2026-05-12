import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ChevronDown, Send, Paperclip, X, User, Minus, Plus, DollarSign } from 'lucide-react';
import { getModelById, getModelsByCategory } from '../config/models';
import { calculateComputeCost, formatCredits } from '../config/modelPricing';
import { getModelParams, getModelParamDefaults, getModelGroups } from '../config/modelParams';
import { getActiveProfile } from '../config/apiKeys';

export function ModelSelector({ currentModel, currentCategory, onModelChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const model = getModelById(currentModel);
  const models = getModelsByCategory(currentCategory);

  return (
    <div className="modelSelector" ref={ref}>
      <button className="modelSelectorTrigger" onClick={() => setIsOpen(!isOpen)}>
        <span className="mstName">{model?.name || '选择模型'}</span>
        <ChevronDown size={12} className={`mstChevron ${isOpen ? 'open' : ''}`} />
      </button>
      {isOpen && (
        <div className="modelSelectorDropdown">
          <div className="msdHeader">选择模型</div>
          {models.map(m => (
            <button
              key={m.id}
              className={`msdItem ${currentModel === m.id ? 'selected' : ''}`}
              onClick={() => { onModelChange(m.id); setIsOpen(false); }}
            >
              <span className="msdItemName">{m.name}</span>
              <span className="msdItemCredits">{formatCredits(m.pricing.baseCredits)} 算力</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ParamSelectRow({ param, value, onChange }) {
  return (
    <div className="npField">
      <div className="npFieldLabel">
        <span>{param.label}</span>
        {param.help && <span className="npFieldHelp" title={param.help}>ⓘ</span>}
      </div>
      <div className="npOptionGrid">
        {param.options.map(opt => (
          <button
            key={String(opt.value)}
            className={`npOptionBtn ${value === opt.value ? 'selected' : ''}`}
            onClick={() => onChange(param.id, opt.value)}
            title={opt.detail || opt.label}
          >
            <span className="npOptLabel">{opt.label}</span>
            {opt.detail && <span className="npOptDetail">{opt.detail}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

function ParamToggleRow({ param, value, onChange }) {
  return (
    <div className="npField npFieldRow">
      <div className="npFieldLabel">
        <span>{param.label}</span>
        {param.help && <span className="npFieldHelp" title={param.help}>ⓘ</span>}
      </div>
      <button
        className={`npToggle ${value ? 'on' : ''}`}
        onClick={() => onChange(param.id, !value)}
      >
        <span className="npToggleKnob" />
      </button>
    </div>
  );
}

function ParamCounterRow({ param, value, onChange }) {
  const val = value ?? param.default;
  const min = param.range?.min || 1;
  const max = param.range?.max || 4;
  return (
    <div className="npField npFieldRow">
      <div className="npFieldLabel">
        <span>{param.label}</span>
        {param.help && <span className="npFieldHelp" title={param.help}>ⓘ</span>}
      </div>
      <div className="npCounter">
        <button className="npCounterBtn" onClick={() => onChange(param.id, Math.max(min, val - 1))} disabled={val <= min}>
          <Minus size={12} />
        </button>
        <span className="npCounterVal">{val}</span>
        <button className="npCounterBtn" onClick={() => onChange(param.id, Math.min(max, val + 1))} disabled={val >= max}>
          <Plus size={12} />
        </button>
      </div>
    </div>
  );
}

function ParamSliderRow({ param, value, onChange }) {
  const { min, max, step } = param.range;
  return (
    <div className="npField">
      <div className="npFieldLabel">
        <span>{param.label}</span>
        <span className="npFieldValue">{value}</span>
      </div>
      <input
        type="range" className="npSlider"
        min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(param.id, parseFloat(e.target.value))}
      />
    </div>
  );
}

function ParamInputRow({ param, value, onChange }) {
  return (
    <div className="npField">
      <div className="npFieldLabel">
        <span>{param.label}</span>
      </div>
      <input
        type="text" className="npInput"
        value={value || ''}
        placeholder={param.placeholder || ''}
        onChange={(e) => onChange(param.id, e.target.value)}
      />
    </div>
  );
}

export function FloatingCommandBar({
  prompt, onPromptChange, onSend, onFileUpload,
  currentModel, currentCategory, onModelChange,
  modelParams, onParamChange, isGenerating,
  refImageUrl, onRemoveRef, canSend, onOpenPricing
}) {
  const [panelOpen, setPanelOpen] = useState(true);
  const [activeGroup, setActiveGroup] = useState(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const model = getModelById(currentModel);
  const cost = calculateComputeCost(currentModel, modelParams);
  const paramConfig = getModelParams(currentModel);
  const activeProfile = getActiveProfile();

  const groups = paramConfig ? getModelGroups(currentModel) : [];
  const allParams = paramConfig?.params || [];

  useEffect(() => {
    if (groups.length > 0 && !activeGroup) {
      setActiveGroup(groups[0].id);
    }
  }, [currentModel, groups, activeGroup]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (canSend) onSend();
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files?.[0]) {
      onFileUpload(e.target.files[0]);
      e.target.value = '';
    }
  };

  const handleChange = useCallback((paramId, value) => {
    if (onParamChange) onParamChange(paramId, value);
  }, [onParamChange]);

  const renderParam = (param) => {
    const value = modelParams?.[param.id] !== undefined ? modelParams[param.id] : param.default;
    const props = { param, value, onChange: handleChange };
    switch (param.type) {
      case 'select': return <ParamSelectRow key={param.id} {...props} />;
      case 'toggle': return <ParamToggleRow key={param.id} {...props} />;
      case 'counter': return <ParamCounterRow key={param.id} {...props} />;
      case 'slider': return <ParamSliderRow key={param.id} {...props} />;
      case 'input': return <ParamInputRow key={param.id} {...props} />;
      default: return null;
    }
  };

  const activeGroupParams = activeGroup
    ? allParams.filter(p => p.group === activeGroup)
    : allParams;

  return (
    <div className="floatingCommandBar">
      {refImageUrl && (
        <div className="fcbRefPreview">
          <img src={refImageUrl} alt="参考图" className="fcbRefImg" />
          <span className="fcbRefHint">参考图片已添加</span>
          <button className="fcbRefRemove" onClick={onRemoveRef}>
            <X size={12} />
          </button>
        </div>
      )}

      {paramConfig && panelOpen && (
        <div className="npPanel">
          <div className="npHeader">
            <div className="npTabs">
              {groups.map(g => (
                <button
                  key={g.id}
                  className={`npTab ${activeGroup === g.id ? 'active' : ''}`}
                  onClick={() => setActiveGroup(g.id)}
                >
                  <span className="npTabIcon">{g.icon}</span>
                  <span className="npTabLabel">{g.label}</span>
                </button>
              ))}
            </div>
            <button className="npCollapseBtn" onClick={() => setPanelOpen(false)} title="收起参数">
              <ChevronDown size={14} />
            </button>
          </div>
          <div className="npBody">
            {activeGroupParams.map(renderParam)}
          </div>
        </div>
      )}

      {!panelOpen && paramConfig && (
        <div className="npCollapsedBar">
          {allParams.slice(0, 3).map(p => {
            const val = modelParams?.[p.id] !== undefined ? modelParams[p.id] : p.default;
            const opt = p.options?.find(o => o.value === val);
            const display = opt?.label || (p.type === 'toggle' ? (val ? '开' : '关') : val);
            return (
              <span key={p.id} className="npCollapsedTag" onClick={() => setPanelOpen(true)}>
                {p.label}: {display}
              </span>
            );
          })}
          <button className="npExpandBtn" onClick={() => setPanelOpen(true)} title="展开参数">
            <ChevronDown size={12} style={{ transform: 'rotate(180deg)' }} />
          </button>
        </div>
      )}

      <div className="fcbMain">
        <div className="fcbAvatar">
          <User size={16} />
        </div>
        <textarea
          ref={textareaRef}
          className="fcbInput"
          value={prompt}
          onChange={(e) => {
            onPromptChange(e.target.value);
            const el = textareaRef.current;
            if (el) {
              el.style.height = 'auto';
              el.style.height = Math.min(el.scrollHeight, 120) + 'px';
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={`描述你想生成的${currentCategory === 'video' ? '视频画面' : '图片内容'}...`}
          rows={1}
        />
        <div className="fcbActions">
          <button className="fcbBtn fcbAttachBtn" onClick={() => fileInputRef.current?.click()} title="上传参考图">
            <Paperclip size={16} />
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} style={{ display: 'none' }} />
          </button>
          <ModelSelector currentModel={currentModel} currentCategory={currentCategory} onModelChange={onModelChange} />
          <button className={`fcbSendBtn ${isGenerating ? 'loading' : ''} ${!canSend ? 'disabled' : ''}`} onClick={onSend} disabled={!canSend || isGenerating}>
            <Send size={16} />
          </button>
        </div>
      </div>

      <div className="fcbFooter">
        <span className="fcbCostHint">
          {model?.name} · <span className="fcbProfileTag" style={{ color: activeProfile.color }}>{activeProfile.icon} {activeProfile.label}</span> · 预计 <strong>{formatCredits(cost)}</strong> 算力
        </span>
        {onOpenPricing && (
          <button className="fcbPricingBtn" onClick={onOpenPricing} title="查看渠道价格">
            <DollarSign size={12} />
            <span>价格</span>
          </button>
        )}
      </div>
    </div>
  );
}
