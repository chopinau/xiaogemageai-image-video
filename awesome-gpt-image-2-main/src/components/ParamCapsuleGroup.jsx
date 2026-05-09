import React from 'react';

const IMAGE_SIZES = [
  { value: '1024x1024', label: '1:1' },
  { value: '1536x1024', label: '16:9' },
  { value: '1024x1536', label: '9:16' }
];

const IMAGE_COUNTS = [
  { value: 1, label: '×1' },
  { value: 2, label: '×2' },
  { value: 4, label: '×4' }
];

const VIDEO_DURATIONS = [
  { value: 5, label: '5秒' },
  { value: 10, label: '10秒' }
];

const VIDEO_RATIOS = [
  { value: '16:9', label: '16:9' },
  { value: '9:16', label: '9:16' }
];

const PSD_COLOR_COUNTS = [
  { value: 3, label: '3色' },
  { value: 5, label: '5色' },
  { value: 8, label: '8色' },
  { value: 10, label: '10色' }
];

const PSD_IGNORE_COLORS = [
  { value: null, label: '无' },
  { value: 'white', label: '白色' },
  { value: 'black', label: '黑色' }
];

export function ParamCapsuleGroup({
  category,
  size, onSizeChange,
  count, onCountChange,
  duration, onDurationChange,
  psdMode, onPsdModeChange,
  psdNumColors, onPsdNumColorsChange,
  psdIgnoreColor, onPsdIgnoreColorChange
}) {
  const isVideo = category === 'video';
  const isPsd = category === 'psdLayer';

  if (isPsd) {
    return (
      <div className="paramCapsuleGroup">
        {psdMode === 'color-split' && (
          <>
            <div className="paramGroup">
              <span className="paramLabel">拆层数</span>
              {PSD_COLOR_COUNTS.map(c => (
                <button
                  key={c.value}
                  className={`paramCapsule ${psdNumColors === c.value ? 'selected' : ''}`}
                  onClick={() => onPsdNumColorsChange?.(c.value)}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <div className="paramGroup">
              <span className="paramLabel">忽略色</span>
              {PSD_IGNORE_COLORS.map(c => (
                <button
                  key={c.value || 'none'}
                  className={`paramCapsule ${psdIgnoreColor === c.value ? 'selected' : ''}`}
                  onClick={() => onPsdIgnoreColorChange?.(c.value)}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </>
        )}
        {psdMode === 'assemble' && (
          <div className="paramGroup">
            <span className="paramLabel">提示：上传多张图片将自动组装</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="paramCapsuleGroup">
      {isVideo ? (
        <>
          <div className="paramGroup">
            <span className="paramLabel">时长</span>
            {VIDEO_DURATIONS.map(d => (
              <button
                key={d.value}
                className={`paramCapsule ${duration === d.value ? 'selected' : ''}`}
                onClick={() => onDurationChange?.(d.value)}
              >
                {d.label}
              </button>
            ))}
          </div>
          <div className="paramGroup">
            <span className="paramLabel">比例</span>
            {VIDEO_RATIOS.map(r => (
              <button
                key={r.value}
                className={`paramCapsule ${size === r.value ? 'selected' : ''}`}
                onClick={() => onSizeChange?.(r.value)}
              >
                {r.label}
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="paramGroup">
            <span className="paramLabel">比例</span>
            {IMAGE_SIZES.map(s => (
              <button
                key={s.value}
                className={`paramCapsule ${size === s.value ? 'selected' : ''}`}
                onClick={() => onSizeChange?.(s.value)}
              >
                {s.label}
              </button>
            ))}
          </div>
          <div className="paramGroup">
            <span className="paramLabel">数量</span>
            {IMAGE_COUNTS.map(c => (
              <button
                key={c.value}
                className={`paramCapsule ${count === c.value ? 'selected' : ''}`}
                onClick={() => onCountChange?.(c.value)}
              >
                {c.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
