import React from 'react';
import { Loader2 } from 'lucide-react';

export function GenerateButton({ onClick, disabled, loading, label, credits, loadingLabel }) {
  return (
    <div className="paramSection">
      <button
        className={`generateBtn ${loading ? 'loading' : ''}`}
        onClick={onClick}
        disabled={disabled || loading}
      >
        {loading ? (
          <>
            <Loader2 size={18} className="spin" />
            {loadingLabel || '生成中...'}
          </>
        ) : label}
      </button>
      {credits && <div className="creditsHint">单次消耗 <strong>{credits}</strong> 积分</div>}
    </div>
  );
}
