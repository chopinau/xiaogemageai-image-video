import React, { useState, useCallback } from 'react';
import { MediaCard } from './MediaCard';
import { Download, Heart, ImagePlus, CheckSquare, X } from 'lucide-react';

export function MasonryGallery({
  items,
  onDownload,
  onSendToVideo,
  onUseAsReference,
  onUsePrompt,
  onFavorite,
  onFlag,
  onOpenLightbox,
  isFavorited,
  isFlagged,
  onBatchDownload,
  onBatchFavorite,
  onBatchReference
}) {
  const [isMultiSelect, setIsMultiSelect] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const handleToggleSelect = useCallback((item) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(item.id)) {
        next.delete(item.id);
      } else {
        next.add(item.id);
      }
      return next;
    });
  }, []);

  const handleBatchAction = useCallback((action) => {
    const selectedItems = items.filter(it => selectedIds.has(it.id));
    if (action === 'download') onBatchDownload?.(selectedItems);
    if (action === 'favorite') onBatchFavorite?.(selectedItems);
    if (action === 'reference') onBatchReference?.(selectedItems);
    setIsMultiSelect(false);
    setSelectedIds(new Set());
  }, [items, selectedIds, onBatchDownload, onBatchFavorite, onBatchReference]);

  const exitMultiSelect = useCallback(() => {
    setIsMultiSelect(false);
    setSelectedIds(new Set());
  }, []);

  if (!items || items.length === 0) {
    return (
      <div className="masonryEmpty">
        <div className="masonryEmptyIcon">✦</div>
        <div className="masonryEmptyText">输入指令开始创作</div>
        <div className="masonryEmptySub">支持文字生成图片和视频</div>
      </div>
    );
  }

  const selectedCount = selectedIds.size;

  return (
    <div className="masonryGalleryWrap">
      {isMultiSelect && (
        <div className="batchToolbar">
          <div className="batchToolbarLeft">
            <span className="batchSelectedCount">已选 {selectedCount} 项</span>
            <button className="batchToolbarBtn" onClick={exitMultiSelect}>
              <X size={14} />
              <span>取消</span>
            </button>
          </div>
          <div className="batchToolbarRight">
            <button
              className="batchToolbarBtn"
              onClick={() => handleBatchAction('download')}
              disabled={selectedCount === 0}
            >
              <Download size={14} />
              <span>下载</span>
            </button>
            <button
              className="batchToolbarBtn"
              onClick={() => handleBatchAction('favorite')}
              disabled={selectedCount === 0}
            >
              <Heart size={14} />
              <span>收藏</span>
            </button>
            <button
              className="batchToolbarBtn"
              onClick={() => handleBatchAction('reference')}
              disabled={selectedCount === 0}
            >
              <ImagePlus size={14} />
              <span>参考</span>
            </button>
          </div>
        </div>
      )}

      {!isMultiSelect && items.length >= 2 && (
        <div className="gallerySelectTrigger">
          <button
            className="gallerySelectToggle"
            onClick={() => setIsMultiSelect(true)}
            title="批量选择"
          >
            <CheckSquare size={13} />
            <span>批量操作</span>
          </button>
        </div>
      )}

      <div className={`masonryGallery ${isMultiSelect ? 'multiSelectMode' : ''}`}>
        {items.map((item) => (
          <MediaCard
            key={item.id}
            item={item}
            onDownload={onDownload}
            onSendToVideo={onSendToVideo}
            onUseAsReference={onUseAsReference}
            onUsePrompt={onUsePrompt}
            onFavorite={onFavorite}
            onFlag={onFlag}
            onOpenLightbox={onOpenLightbox}
            isFavorited={isFavorited?.(item.id)}
            isFlagged={isFlagged?.(item.id)}
            isSelected={selectedIds.has(item.id)}
            onToggleSelect={handleToggleSelect}
            isMultiSelect={isMultiSelect}
          />
        ))}
      </div>
    </div>
  );
}