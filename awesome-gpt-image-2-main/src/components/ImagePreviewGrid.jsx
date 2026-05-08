import React, { useState } from 'react';
import { Download, RefreshCw, Heart, Share2, Trash2 } from 'lucide-react';
import { Modal } from './Modal';

export function ImagePreviewGrid({ images, onDownload, onRegenerate, onCollect, onShare, onDelete, onBatchDownload, onBatchDelete }) {
  const [selectedImage, setSelectedImage] = useState(null);

  if (!images || images.length === 0) return null;

  return (
    <>
      <div className="resultGrid">
        {images.map((img, index) => (
          <div className="resultImageCard" key={img.id || index}>
            <img src={img.url} alt={img.alt || `生成结果 ${index + 1}`} onClick={() => setSelectedImage(img)} />
            <div className="resultImageActions">
              {onDownload && <button onClick={() => onDownload(img)} title="下载"><Download size={14} /></button>}
              {onRegenerate && <button onClick={() => onRegenerate(img, index)} title="重新生成"><RefreshCw size={14} /></button>}
              {onCollect && <button onClick={() => onCollect(img)} title="收藏"><Heart size={14} /></button>}
              {onShare && <button onClick={() => onShare(img)} title="分享"><Share2 size={14} /></button>}
              {onDelete && <button onClick={() => onDelete(img, index)} title="删除"><Trash2 size={14} /></button>}
            </div>
          </div>
        ))}
      </div>
      {(onBatchDownload || onBatchDelete) && (
        <div className="batchActions">
          {onBatchDownload && <button onClick={onBatchDownload}><Download size={16} />批量下载</button>}
          {onBatchDelete && <button onClick={onBatchDelete}><Trash2 size={16} />批量删除</button>}
        </div>
      )}
      {selectedImage && (
        <Modal onClose={() => setSelectedImage(null)}>
          <img src={selectedImage.url} alt="预览" />
        </Modal>
      )}
    </>
  );
}
