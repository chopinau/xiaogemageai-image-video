import React, { useState } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import { Modal } from './Modal';

export function ImageCompareView({ original, retouched, onDownload, onRegenerate, onBatchDownload }) {
  const [selectedImage, setSelectedImage] = useState(null);

  return (
    <>
      <div className="compareView">
        <div className="comparePanel">
          <div className="compareLabel">原图</div>
          <img src={original} alt="原图" onClick={() => setSelectedImage({ url: original, label: '原图' })} />
        </div>
        <div className="comparePanel">
          <div className="compareLabel">精修图</div>
          {retouched ? (
            <img src={retouched} alt="精修图" onClick={() => setSelectedImage({ url: retouched, label: '精修图' })} />
          ) : (
            <div className="resultEmpty" style={{ minHeight: '200px' }}>
              <p>精修处理中...</p>
            </div>
          )}
        </div>
      </div>
      {retouched && (
        <div className="batchActions">
          {onDownload && <button onClick={onDownload}><Download size={16} />下载精修图</button>}
          {onRegenerate && <button onClick={onRegenerate}><RefreshCw size={16} />重新精修</button>}
          {onBatchDownload && <button onClick={onBatchDownload}><Download size={16} />批量下载</button>}
        </div>
      )}
      {selectedImage && (
        <Modal onClose={() => setSelectedImage(null)}>
          <img src={selectedImage.url} alt={selectedImage.label} />
        </Modal>
      )}
    </>
  );
}
