import React from 'react';
import { X, Heart, Image, Video, Copy, Trash2, ArrowLeftToLine, Sparkles } from 'lucide-react';
import { formatCredits } from '../config/modelPricing';

export function FavoritesPanel({ favorites, onClose, onUseReference, onUsePrompt, onRemove, onUnfavorite }) {
  return (
    <div className="assetSlidePanel">
      <div className="assetSlidePanelHeader">
        <div className="assetSlidePanelTitle">
          <Heart size={16} className="aspHeartIcon" fill="#ff4aa6" color="#ff4aa6" />
          <span>我的收藏</span>
          <span className="aspCount">{favorites.length}</span>
        </div>
        <button className="aspCloseBtn" onClick={onClose}>
          <X size={16} />
        </button>
      </div>

      {favorites.length === 0 ? (
        <div className="aspEmpty">
          <Heart size={32} className="aspEmptyIcon" />
          <div className="aspEmptyText">还没有收藏任何作品</div>
          <div className="aspEmptySub">在生成结果上点击 ❤ 即可收藏</div>
        </div>
      ) : (
        <div className="aspGrid">
          {favorites.map(item => (
            <div key={item.id} className="aspCard">
              <div className="aspCardVisual">
                {item.type === 'video' ? (
                  <Video size={24} className="aspCardVideoIcon" />
                ) : (
                  <img src={item.url} alt="" className="aspCardImg" loading="lazy" />
                )}
              </div>
              <div className="aspCardInfo">
                {item.model && <span className="aspCardModel">{item.model}</span>}
                {item.credits && <span className="aspCardCredits">{formatCredits(item.credits)} 算力</span>}
                {item.prompt && (
                  <div className="aspCardPrompt">{item.prompt}</div>
                )}
              </div>
              <div className="aspCardActions">
                <button
                  className="aspCardBtn"
                  onClick={() => onUseReference(item)}
                  title="作为参考图"
                >
                  <ArrowLeftToLine size={13} />
                </button>
                <button
                  className="aspCardBtn"
                  onClick={() => onUsePrompt(item)}
                  title="复用提示词"
                >
                  <Copy size={13} />
                </button>
                <button
                  className="aspCardBtn aspCardBtnDanger"
                  onClick={() => onUnfavorite(item.id)}
                  title="取消收藏"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}