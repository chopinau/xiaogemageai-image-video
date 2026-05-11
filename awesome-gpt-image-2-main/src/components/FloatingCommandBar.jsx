import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Send, Paperclip, X, Settings2, User, SlidersHorizontal, Wand2, Minus, Plus, DollarSign } from 'lucide-react';
import { getModelById, getModelsByCategory } from '../config/models';
import { calculateComputeCost, formatCredits } from '../config/modelPricing';
import { DynamicParamPanel } from './DynamicParamPanel';
import { getModelParams, getModelParamDefaults } from '../config/modelParams';
import { getActiveProfile, API_KEY_PROFILES } from '../config/apiKeys';

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

function QuickParamChip({ param, value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const currentOption = param.options?.find(o => o.value === value);
  const label = currentOption?.label || value || param.label;

  return (
    <div className="paramChipWrap" ref={ref}>
      <button
        className={`paramChip ${value !== param.default ? 'tweaked' : ''} ${open ? 'open' : ''}`}
        onClick={() => setOpen(!open)}
        title={param.label}
      >
        <span className="paramChipIcon">
          <SlidersHorizontal size={10} />
        </span>
        <span className="paramChipLabel">{label}</span>
        <ChevronDown size={8} className={`paramChipChevron ${open ? 'flip' : ''}`} />
      </button>
      {open && param.options && (
        <div className="paramChipDropdown">
          {param.options.map(opt => (
            <button
              key={String(opt.value)}
              className={`paramChipOption ${value === opt.value ? 'selected' : ''}`}
              onClick={() => { onChange(param.id, opt.value); setOpen(false); }}
            >
              <span>{opt.label}</span>
              {opt.detail && <span className="paramChipOptionDetail">{opt.detail}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function QuickToggleChip({ param, value, onChange }) {
  return (
    <button
      className={`paramChip paramChipToggle ${value ? 'tweaked on' : ''}`}
      onClick={() => onChange(param.id, !value)}
      title={param.help || param.label}
    >
      <span className="paramChipIcon">
        <Wand2 size={10} />
      </span>
      <span className="paramChipLabel">{param.label}</span>
    </button>
  );
}

function CounterChip({ param, value, onChange }) {
  const val = value ?? param.default;
  const min = param.range?.min || 1;
  const max = param.range?.max || 4;

  return (
    <div className="paramChip counterChip">
      <button
        className="counterChipBtn"
        onClick={() => onChange(param.id, Math.max(min, val - 1))}
        disabled={val <= min}
      >
        <Minus size={10} />
      </button>
      <span className="counterChipValue">×{val}</span>
      <button
        className="counterChipBtn"
        onClick={() => onChange(param.id, Math.min(max, val + 1))}
        disabled={val >= max}
      >
        <Plus size={10} />
      </button>
    </div>
  );
}

export function FloatingCommandBar({
  prompt,
  onPromptChange,
  onSend,
  onFileUpload,
  currentModel,
  currentCategory,
  onModelChange,
  modelParams,
  onParamChange,
  isGenerating,
  refImageUrl,
  onRemoveRef,
  canSend,
  onOpenPricing
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const model = getModelById(currentModel);
  const cost = calculateComputeCost(currentModel, modelParams);
  const paramConfig = getModelParams(currentModel);
  const activeProfile = getActiveProfile();

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

  const renderQuickParam = (param) => {
    const value = modelParams?.[param.id];
    if (param.type === 'toggle') {
      return <QuickToggleChip key={param.id} param={param} value={!!value} onChange={onParamChange} />;
    }
    if (param.type === 'counter') {
      return <CounterChip key={param.id} param={param} value={value} onChange={onParamChange} />;
    }
    if (param.type === 'select' && param.options?.length > 0) {
      return <QuickParamChip key={param.id} param={param} value={value ?? param.default} onChange={onParamChange} />;
    }
    return null;
  };

  const quickParams = paramConfig?.params?.filter(p =>
    p.type === 'select' || p.type === 'toggle' || p.type === 'counter'
  ) || [];
  const hasAdvanced = paramConfig?.params?.some(p => p.type === 'slider' || p.type === 'input') || quickParams.length > 4;

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

      <div className="fcbParamsBar">
        <div className="fcbQuickParams">
          {quickParams.slice(0, 4).map(renderQuickParam)}
          {hasAdvanced && (
            <button
              className={`paramChip paramChipMore ${showAdvanced ? 'tweaked' : ''}`}
              onClick={() => setShowAdvanced(!showAdvanced)}
              title="高级参数"
            >
              <span className="paramChipIcon">
                <Settings2 size={10} />
              </span>
              <span className="paramChipLabel">高级</span>
              <ChevronDown size={8} className={`paramChipChevron ${showAdvanced ? 'flip' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {showAdvanced && paramConfig && (
        <div className="fcbAdvancedPanel">
          <DynamicParamPanel
            modelId={currentModel}
            values={modelParams}
            onChange={onParamChange}
          />
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
          <button
            className="fcbBtn fcbAttachBtn"
            onClick={() => fileInputRef.current?.click()}
            title="上传参考图"
          >
            <Paperclip size={16} />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </button>

          <ModelSelector
            currentModel={currentModel}
            currentCategory={currentCategory}
            onModelChange={onModelChange}
          />

          <button
            className={`fcbSendBtn ${isGenerating ? 'loading' : ''} ${!canSend ? 'disabled' : ''}`}
            onClick={onSend}
            disabled={!canSend || isGenerating}
          >
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