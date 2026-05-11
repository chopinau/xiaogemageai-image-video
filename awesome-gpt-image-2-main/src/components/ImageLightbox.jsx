import React, { useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Download, Heart, Flag, Copy, ImagePlus } from 'lucide-react';

export function ImageLightbox({ items, currentIndex, onClose, onPrev, onNext, onDownload, onFavorite, onFlag, onUseReference }) {
  const item = items[currentIndex];

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'ArrowRight') onNext();
    };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose, onPrev, onNext]);

  if (!item) return null;

  const isVideo = item.type === 'video';

  return (
    <div className="lightboxOverlay" onClick={onClose}>
      <div className="lightboxToolbar">
        <span className="lightboxCounter">
          {currentIndex + 1} / {items.length}
        </span>
        <div className="lightboxActions">
          <button className="lightboxBtn" onClick={() => onDownload?.(item)} title="下载">
            <Download size={18} />
          </button>
          <button className="lightboxBtn" onClick={() => onUseReference?.(item)} title="作为参考图">
            <ImagePlus size={18} />
          </button>
          <button className="lightboxBtn" onClick={() => onFavorite?.(item)} title="收藏">
            <Heart size={18} />
          </button>
          <button className="lightboxBtn" onClick={() => onFlag?.(item)} title="标记">
            <Flag size={18} />
          </button>
          {item.prompt && (
            <button className="lightboxBtn" onClick={() => navigator.clipboard.writeText(item.prompt)} title="复制提示词">
              <Copy size={18} />
            </button>
          )}
        </div>
        <button className="lightboxCloseBtn" onClick={onClose}>
          <X size={20} />
        </button>
      </div>

      <div className="lightboxContent" onClick={e => e.stopPropagation()}>
        {items.length > 1 && (
          <>
            <button className="lightboxNavBtn prev" onClick={onPrev}>
              <ChevronLeft size={28} />
            </button>
            <button className="lightboxNavBtn next" onClick={onNext}>
              <ChevronRight size={28} />
            </button>
          </>
        )}

        {isVideo ? (
          <video
            src={item.url}
            className="lightboxMedia lightboxVideo"
            controls
            autoPlay
          />
        ) : (
          <img
            src={item.url}
            alt={item.prompt || 'Generated image'}
            className="lightboxMedia lightboxImg"
          />
        )}

        {item.prompt && (
          <div className="lightboxPrompt">
            <div className="lightboxPromptLabel">提示词</div>
            <div className="lightboxPromptText">{item.prompt}</div>
          </div>
        )}
      </div>
    </div>
  );
}