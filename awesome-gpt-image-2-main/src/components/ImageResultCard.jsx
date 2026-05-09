import React, { useState } from 'react';
import { Download, Heart, RotateCcw, Pencil, Film, Scissors } from 'lucide-react';

export function ImageResultCard({ result, onDownload, onCollect, onRegenerate, onEdit, onSendToVideo, onSendToPsd }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isCollected, setIsCollected] = useState(false);

  return (
    <div
      className="imageResultCardV2"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="imageResultCardV2ImageWrap">
        <img src={result.url} alt={result.prompt || '生成结果'} loading="lazy" />

        <div className={`imageResultCardV2Overlay ${isHovered ? 'visible' : ''}`}>
          <button className="ircBtn" onClick={() => onDownload?.()} title="下载">
            <Download size={13} />
          </button>
          <button
            className={`ircBtn collect ${isCollected ? 'active' : ''}`}
            onClick={() => { setIsCollected(!isCollected); onCollect?.(); }}
            title="收藏"
          >
            <Heart size={13} fill={isCollected ? '#ec4899' : 'none'} />
          </button>
          <button className="ircBtn" onClick={() => onRegenerate?.()} title="重绘">
            <RotateCcw size={13} />
          </button>
          <button className="ircBtn" onClick={() => onSendToVideo?.(result.url, result.prompt)} title="生成视频">
            <Film size={13} />
          </button>
          <button className="ircBtn" onClick={() => onSendToPsd?.(result.url)} title="PSD分层">
            <Scissors size={13} />
          </button>
        </div>
      </div>

      {result.prompt && (
        <div className="imageResultCardV2Prompt">
          <p>{result.prompt}</p>
        </div>
      )}

      <div className="imageResultCardV2Meta">
        <span>{result.width && result.height ? `${result.width}×${result.height}` : ''}</span>
        <span>{new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
    </div>
  );
}
