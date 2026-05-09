import React from 'react';
import { Download, Layers, FileImage } from 'lucide-react';
import { psdLayerGenerator } from '../services/psdLayerGenerator';

export function PsdResultCard({ result, taskId }) {
  const layers = result.layers || [];
  const hasFgBg = result.foregroundUrl && result.backgroundUrl;

  const displayLayers = hasFgBg
    ? [
        { name: '前景图层', url: result.foregroundUrl, color: '#42e6ff' },
        { name: '背景图层', url: result.backgroundUrl, color: '#a78bfa' }
      ]
    : layers.map(l => ({
        name: l.name || '图层',
        url: l.url,
        color: l.color || '#8899b0'
      }));

  const handleDownloadPSD = () => {
    if (taskId) {
      psdLayerGenerator.downloadPSD(taskId);
    }
  };

  return (
    <div className="psdResultCard">
      <div className="psdResultCardHeader">
        <Layers size={16} />
        <span className="psdResultCardTitle">PSD 分层结果</span>
        <span className="psdResultCardCount">{displayLayers.length} 个图层</span>
      </div>

      <div className="psdResultCardLayers">
        {displayLayers.map((layer, idx) => (
          <div key={idx} className="psdResultCardLayer">
            <div className="psdResultCardLayerThumb" style={{ borderColor: layer.color }}>
              {layer.url ? (
                <img src={layer.url} alt={layer.name} loading="lazy" />
              ) : (
                <div className="psdResultCardLayerEmpty">
                  <FileImage size={16} />
                </div>
              )}
            </div>
            <span className="psdResultCardLayerName" style={{ color: layer.color }}>
              {layer.name}
            </span>
          </div>
        ))}
      </div>

      <div className="psdResultCardActions">
        {taskId && (
          <button className="psdResultCardDownload" onClick={handleDownloadPSD}>
            <Download size={14} />
            下载 PSD
          </button>
        )}
      </div>
    </div>
  );
}
