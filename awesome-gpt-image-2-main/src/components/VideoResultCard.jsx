import React, { useState } from 'react';
import { Play, Download } from 'lucide-react';

export function VideoResultCard({ result, onDownload }) {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = () => {
    setIsPlaying(true);
  };

  return (
    <div className="videoResultCard">
      <div className="videoResultCardPreview" onClick={handlePlay}>
        {isPlaying && result.url ? (
          <video
            src={result.url}
            controls
            autoPlay
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <>
            <img
              src={result.thumbnail || result.url}
              alt={result.prompt || '视频'}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <button className="videoResultCardPlayBtn">
              <Play size={20} fill="white" />
            </button>
          </>
        )}
        {result.duration && (
          <div className="videoResultCardDuration">{result.duration}s</div>
        )}
      </div>
      <div className="videoResultCardActions">
        <span className="videoResultCardModel">{result.modelName || '视频'}</span>
        <button
          className="videoResultCardDownload"
          onClick={() => onDownload?.(result)}
        >
          <Download size={12} />
          下载
        </button>
      </div>
    </div>
  );
}
