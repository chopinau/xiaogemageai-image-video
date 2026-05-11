import React, { useState } from 'react';
import { Heart, Flag, Image, Grid3X3 } from 'lucide-react';
import { FavoritesPanel } from './FavoritesPanel';
import { FlaggedPanel } from './FlaggedPanel';

export function AssetPanel({
  favorites,
  flagged,
  onClose,
  onUseReference,
  onUsePrompt,
  onRemoveFavorite,
  onFlagRetry,
  onFlagDismiss
}) {
  const [activeTab, setActiveTab] = useState('favorites');

  return (
    <div className="assetSlidePanel">
      <div className="assetPanelTabs">
        <button
          className={`assetPanelTab ${activeTab === 'favorites' ? 'active' : ''}`}
          onClick={() => setActiveTab('favorites')}
        >
          <Heart size={13} fill={activeTab === 'favorites' ? '#ff4aa6' : 'none'} />
          <span>收藏</span>
          {favorites.length > 0 && <span className="assetPanelTabBadge">{favorites.length}</span>}
        </button>
        <button
          className={`assetPanelTab ${activeTab === 'flagged' ? 'active' : ''}`}
          onClick={() => setActiveTab('flagged')}
        >
          <Flag size={13} fill={activeTab === 'flagged' ? '#fbbf24' : 'none'} />
          <span>标记</span>
          {flagged.length > 0 && <span className="assetPanelTabBadge">{flagged.length}</span>}
        </button>
      </div>

      {activeTab === 'favorites' ? (
        <FavoritesPanel
          favorites={favorites}
          onClose={onClose}
          onUseReference={onUseReference}
          onUsePrompt={onUsePrompt}
          onUnfavorite={onRemoveFavorite}
        />
      ) : (
        <FlaggedPanel
          flagged={flagged}
          onClose={onClose}
          onRetry={onFlagRetry}
          onDismiss={onFlagDismiss}
        />
      )}
    </div>
  );
}