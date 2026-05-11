import React, { useState } from 'react';
import { X, Flag } from 'lucide-react';

const PRESET_REASONS = [
  '图片模糊不清',
  '比例/尺寸不对',
  '内容与提示词不符',
  '风格不对',
  '有水印/LOGO',
  '颜色偏差',
  '构图不佳',
  '人物变形',
  '文字错误',
  '其他问题'
];

export function FlagDialog({ item, onConfirm, onCancel }) {
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');

  const handleConfirm = () => {
    const reason = customReason.trim() || selectedReason || '未指定原因';
    onConfirm(item, reason);
  };

  return (
    <div className="flagDialogOverlay" onClick={onCancel}>
      <div className="flagDialog" onClick={e => e.stopPropagation()}>
        <div className="flagDialogHeader">
          <Flag size={16} className="flagDialogHeaderIcon" />
          <span>标记此结果</span>
          <button className="flagDialogClose" onClick={onCancel}>
            <X size={14} />
          </button>
        </div>

        <div className="flagDialogBody">
          {item.prompt && (
            <div className="flagDialogPrompt">
              <div className="flagDialogPromptLabel">原始提示词</div>
              <div className="flagDialogPromptText">{item.prompt}</div>
            </div>
          )}

          <div className="flagDialogSectionLabel">选择问题类型</div>
          <div className="flagReasonGrid">
            {PRESET_REASONS.map(reason => (
              <button
                key={reason}
                className={`flagReasonBtn ${selectedReason === reason ? 'selected' : ''}`}
                onClick={() => {
                  setSelectedReason(reason);
                  setCustomReason('');
                }}
              >
                {reason}
              </button>
            ))}
          </div>

          <input
            type="text"
            className="flagCustomInput"
            placeholder="或输入自定义原因..."
            value={customReason}
            onChange={e => {
              setCustomReason(e.target.value);
              if (e.target.value) setSelectedReason('');
            }}
          />
        </div>

        <div className="flagDialogFooter">
          <button className="flagDialogCancelBtn" onClick={onCancel}>取消</button>
          <button
            className="flagDialogConfirmBtn"
            onClick={handleConfirm}
            disabled={!selectedReason && !customReason.trim()}
          >
            确认标记
          </button>
        </div>
      </div>
    </div>
  );
}