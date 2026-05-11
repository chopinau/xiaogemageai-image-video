import React, { useMemo } from 'react';
import { X, Flag, RefreshCw, EyeOff } from 'lucide-react';

export function FlaggedPanel({ flagged, onClose, onRetry, onDismiss }) {
  const groupedByReason = useMemo(() => {
    const groups = {};
    flagged.forEach(item => {
      const reason = item.reason || '未分类';
      if (!groups[reason]) groups[reason] = [];
      groups[reason].push(item);
    });
    return groups;
  }, [flagged]);

  return (
    <div className="assetSlidePanel">
      <div className="assetSlidePanelHeader">
        <div className="assetSlidePanelTitle">
          <Flag size={16} className="aspFlagIcon" fill="#fbbf24" color="#fbbf24" />
          <span>标记记录</span>
          <span className="aspCount">{flagged.length}</span>
        </div>
        <button className="aspCloseBtn" onClick={onClose}>
          <X size={16} />
        </button>
      </div>

      {flagged.length === 0 ? (
        <div className="aspEmpty">
          <Flag size={32} className="aspEmptyIcon" />
          <div className="aspEmptyText">还没有标记任何结果</div>
          <div className="aspEmptySub">遇到不满意的结果，点击 🚩 标记并记录原因</div>
        </div>
      ) : (
        <div className="aspList">
          {Object.entries(groupedByReason).map(([reason, items]) => (
            <div key={reason} className="flaggedGroup">
              <div className="flaggedGroupHeader">
                <span className="flaggedGroupReason">{reason}</span>
                <span className="flaggedGroupCount">{items.length} 条</span>
              </div>
              {items.map(item => (
                <div key={item.id} className="flaggedItem">
                  <img src={item.url} alt="" className="flaggedItemImg" />
                  <div className="flaggedItemBody">
                    {item.prompt && (
                      <div className="flaggedItemPrompt">{item.prompt}</div>
                    )}
                    <div className="flaggedItemActions">
                      <button
                        className="flaggedItemBtn retry"
                        onClick={() => onRetry(item)}
                      >
                        <RefreshCw size={11} />
                        <span>用此提示词重试</span>
                      </button>
                      <button
                        className="flaggedItemBtn dismiss"
                        onClick={() => onDismiss(item.id)}
                      >
                        <EyeOff size={11} />
                        <span>忽略</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}