import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Image, Video, Layers, Download, Film, Scissors, X } from 'lucide-react';

export function AssetShelf({ assets, isOpen, onToggle, onSendToVideo, onSendToPsd, onDragAsset, onDownload }) {
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all' ? assets : assets.filter(a => {
    if (filter === 'image') return a.type === 'image';
    if (filter === 'video') return a.type === 'video';
    return true;
  });

  const handleDragStart = (e, asset) => {
    e.dataTransfer.setData('application/json', JSON.stringify(asset));
    onDragAsset?.(asset);
  };

  return (
    <div className={`assetShelf ${isOpen ? 'open' : ''}`}>
      <button className="assetShelfToggle" onClick={onToggle} title={isOpen ? '收起资产面板' : '展开资产面板'}>
        {isOpen ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      <div className="assetShelfContent">
        <div className="assetShelfHeader">
          <span className="assetShelfTitle">资产面板</span>
          <span className="assetShelfCount">{filtered.length}</span>
        </div>

        <div className="assetShelfFilters">
          <button className={`assetShelfFilter ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
            全部
          </button>
          <button className={`assetShelfFilter ${filter === 'image' ? 'active' : ''}`} onClick={() => setFilter('image')}>
            <Image size={12} /> 图片
          </button>
          <button className={`assetShelfFilter ${filter === 'video' ? 'active' : ''}`} onClick={() => setFilter('video')}>
            <Video size={12} /> 视频
          </button>
        </div>

        <div className="assetShelfGrid">
          {filtered.map((asset, idx) => (
            <div
              key={asset.id || idx}
              className="assetShelfItem"
              draggable
              onDragStart={(e) => handleDragStart(e, asset)}
              title={asset.prompt || '资产'}
            >
              <div className="assetShelfItemThumb">
                {asset.type === 'video' ? (
                  <div className="assetShelfItemVideo">
                    <video src={asset.url} muted preload="metadata" />
                    <div className="assetShelfItemPlayIcon"><Film size={14} /></div>
                    {asset.duration && <span className="assetShelfItemDuration">{asset.duration}s</span>}
                  </div>
                ) : (
                  <img src={asset.url} alt="" loading="lazy" />
                )}
              </div>

              <div className="assetShelfItemActions">
                {asset.type === 'image' && (
                  <>
                    <button
                      className="assetShelfItemAction"
                      onClick={(e) => { e.stopPropagation(); onSendToVideo?.(asset.url, asset.prompt); }}
                      title="生成视频"
                    >
                      <Film size={12} />
                    </button>
                    <button
                      className="assetShelfItemAction"
                      onClick={(e) => { e.stopPropagation(); onSendToPsd?.(asset.url); }}
                      title="PSD分层"
                    >
                      <Scissors size={12} />
                    </button>
                  </>
                )}
                <button
                  className="assetShelfItemAction"
                  onClick={(e) => { e.stopPropagation(); onDownload?.(asset); }}
                  title="下载"
                >
                  <Download size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="assetShelfEmpty">
            <Layers size={24} />
            <span>暂无资产</span>
            <span className="assetShelfEmptyHint">生成图片或视频后将自动显示在这里</span>
          </div>
        )}
      </div>
    </div>
  );
}
