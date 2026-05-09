import React, { useState } from 'react';
import { Plus, Zap, X, Image } from 'lucide-react';
import { ModelCapsuleGroup } from './ModelCapsuleGroup';
import { ParamCapsuleGroup } from './ParamCapsuleGroup';

export function QuickBatchBar({ category, currentModel, onModelChange, onBatchGenerate }) {
  const [prompts, setPrompts] = useState(['']);
  const [isExpanded, setIsExpanded] = useState(false);

  const addPrompt = () => {
    setPrompts([...prompts, '']);
  };

  const removePrompt = (idx) => {
    if (prompts.length <= 1) return;
    setPrompts(prompts.filter((_, i) => i !== idx));
  };

  const updatePrompt = (idx, value) => {
    const updated = [...prompts];
    updated[idx] = value;
    setPrompts(updated);
  };

  const handleBatchGenerate = () => {
    const validPrompts = prompts.filter(p => p.trim());
    if (validPrompts.length === 0) return;
    onBatchGenerate?.(validPrompts);
    setPrompts(['']);
    setIsExpanded(false);
  };

  if (!isExpanded) {
    return (
      <div className="quickBatchBarCollapsed">
        <button className="quickBatchToggle" onClick={() => setIsExpanded(true)}>
          <Zap size={14} />
          <span>批量生成</span>
        </button>
      </div>
    );
  }

  return (
    <div className="quickBatchBar">
      <div className="quickBatchHeader">
        <span className="quickBatchTitle">
          <Zap size={14} />
          批量生成
        </span>
        <button className="quickBatchClose" onClick={() => setIsExpanded(false)}>
          <X size={14} />
        </button>
      </div>

      <div className="quickBatchPrompts">
        {prompts.map((p, idx) => (
          <div key={idx} className="quickBatchPromptRow">
            <span className="quickBatchPromptNum">{idx + 1}</span>
            <input
              className="quickBatchPromptInput"
              value={p}
              onChange={(e) => updatePrompt(idx, e.target.value)}
              placeholder={`提示词 ${idx + 1}...`}
            />
            {prompts.length > 1 && (
              <button className="quickBatchPromptRemove" onClick={() => removePrompt(idx)}>
                <X size={12} />
              </button>
            )}
          </div>
        ))}
        <button className="quickBatchAddBtn" onClick={addPrompt}>
          <Plus size={12} />
          添加更多
        </button>
      </div>

      <div className="quickBatchModelRow">
        <ModelCapsuleGroup
          category={category}
          currentModel={currentModel}
          onModelChange={onModelChange}
        />
      </div>

      <button
        className="quickBatchGenerateBtn"
        onClick={handleBatchGenerate}
        disabled={prompts.filter(p => p.trim()).length === 0}
      >
        <Zap size={14} />
        批量生成 ({prompts.filter(p => p.trim()).length} 个提示词)
      </button>
    </div>
  );
}
