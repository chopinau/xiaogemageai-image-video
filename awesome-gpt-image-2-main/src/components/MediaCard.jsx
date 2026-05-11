import React, { useState, useCallback } from 'react';
import { Download, Video, Copy, Flag, Heart, ImagePlus, ArrowLeftToLine, CheckCircle2, Eye } from 'lucide-react';
import { formatCredits } from '../config/modelPricing';

export function MediaCard({
  item,
  onDownload,
  onSendToVideo,
  onUseAsReference,
  onUsePrompt,
  onFavorite,
  onFlag,
  onOpenLightbox,
  isFavorited,
  isFlagged,
  isSelected,
  onToggleSelect,
  isMultiSelect
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyPrompt = useCallback(() => {
    if (item.prompt) {
      navigator.clipboard.writeText(item.prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [item.prompt]);

  const isVideo = item.type === 'video';

  const handleCardClick = (e) => {
    if (isMultiSelect) {
      onToggleSelect?.(item);
      return;
    }
    if (!isVideo) {
      onOpenLightbox?.(item);
    }
  };

  return (
    <div
      className={`mediaCard ${isFavorited ? 'favorited' : ''} ${isFlagged ? 'flagged' : ''} ${isSelected ? 'selected' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="mediaCardVisual" onClick={handleCardClick}>
        {isVideo ? (
          <div className="mediaCardVideo">
            <video
              src={item.url}
              className="mediaCardVideoEl"
              muted
              loop
              playsInline
              onMouseEnter={(e) => e.target.play()}
              onMouseLeave={(e) => { e.target.pause(); e.target.currentTime = 0; }}
            />
            <div className="mediaCardPlayIcon">
              <Eye size={18} />
            </div>
            {item.duration && (
              <div className="mediaCardDuration">{item.duration}s</div>
            )}
          </div>
        ) : (
          <>
            <img
              src={item.url}
              alt={item.prompt || 'Generated image'}
              className="mediaCardImg"
              loading="lazy"
            />
            {isMultiSelect && (
              <div className={`mediaCardSelectCheck ${isSelected ? 'checked' : ''}`}>
                <CheckCircle2 size={20} />
              </div>
            )}
          </>
        )}

        {isHovered && (
          <div className="mediaCardOverlay">
            <div className="mediaCardOverlayTop">
              {isMultiSelect && (
                <button className="mcAction" onClick={(e) => { e.stopPropagation(); onToggleSelect?.(item); }}>
                  <CheckCircle2 size={15} fill={isSelected ? '#42e6ff' : 'none'} />
                </button>
              )}
            </div>
            <div className="mediaCardOverlayBottom">
              <div className="mediaCardActions">
                <button className="mcAction" onClick={(e) => { e.stopPropagation(); onDownload?.(item); }} title="下载">
                  <Download size={15} />
                </button>
                {!isVideo && (
                  <button className="mcAction" onClick={(e) => { e.stopPropagation(); onSendToVideo?.(item.url, item.prompt); }} title="生成视频">
                    <Video size={15} />
                  </button>
                )}
                {!isVideo && (
                  <button className="mcAction" onClick={(e) => { e.stopPropagation(); onUseAsReference?.(item); }} title="作为参考图生图">
                    <ImagePlus size={15} />
                  </button>
                )}
                <button className="mcAction" onClick={(e) => { e.stopPropagation(); onUsePrompt?.(item); }} title="回填提示词">
                  <ArrowLeftToLine size={15} />
                </button>
              </div>
              <div className="mediaCardActionsRight">
                <button
                  className={`mcAction mcFav ${isFavorited ? 'active' : ''}`}
                  onClick={(e) => { e.stopPropagation(); onFavorite?.(item); }}
                  title={isFavorited ? '取消收藏' : '收藏'}
                >
                  <Heart size={15} fill={isFavorited ? '#ff4aa6' : 'none'} />
                </button>
                <button
                  className={`mcAction mcFlag ${isFlagged ? 'active' : ''}`}
                  onClick={(e) => { e.stopPropagation(); onFlag?.(item); }}
                  title={isFlagged ? '取消标记' : '标记问题'}
                >
                  <Flag size={15} fill={isFlagged ? '#fbbf24' : 'none'} />
                </button>
              </div>
            </div>
          </div>
        )}

        {isFavorited && (
          <div className="mcCornerBadge fav">
            <Heart size={10} fill="#ff4aa6" />
          </div>
        )}
        {isFlagged && (
          <div className="mcCornerBadge flag">
            <Flag size={10} fill="#fbbf24" />
          </div>
        )}
      </div>

      {(isHovered || showPrompt) && item.prompt && (
        <div className="mediaCardPrompt">
          <div className="mcPromptText">{item.prompt}</div>
          <button className="mcPromptCopy" onClick={handleCopyPrompt}>
            {copied ? <CheckCircle2 size={11} color="#34d399" /> : <Copy size={11} />}
          </button>
        </div>
      )}

      <div className="mediaCardMeta">
        {item.model && <span className="mcModelTag">{item.model}</span>}
        {item.credits != null && <span className="mcCreditsTag">{formatCredits(item.credits)} 算力</span>}
        {item.psdLayer && item.layerName && (
          <span className="mcLayerTag">{item.layerName}</span>
        )}
      </div>
    </div>
  );
}