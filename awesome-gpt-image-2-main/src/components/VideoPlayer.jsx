import React from 'react';
import { Download, RefreshCw, Share2 } from 'lucide-react';

export function VideoPlayer({ src, onDownload, onRegenerate, onShare }) {
  if (!src) return null;
  return (
    <div className="videoPlayer">
      <video controls src={src} />
      <div className="videoActions">
        {onDownload && <button onClick={onDownload}><Download size={16} />下载</button>}
        {onRegenerate && <button onClick={onRegenerate}><RefreshCw size={16} />重新生成</button>}
        {onShare && <button onClick={onShare}><Share2 size={16} />分享</button>}
      </div>
    </div>
  );
}
