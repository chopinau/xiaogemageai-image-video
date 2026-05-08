import React from 'react';
import { Upload, X, Image } from 'lucide-react';

export function FileUpload({
  previews,
  isDragging,
  error,
  inputRef,
  maxCount = 10,
  accept = 'image/jpeg,image/png',
  hint,
  onDragOver,
  onDragLeave,
  onDrop,
  onClick,
  onChange,
  onRemove,
  label,
  icon: Icon = Upload,
  compact = false
}) {
  return (
    <div className="paramSection">
      {label && <div className="paramLabel"><Icon size={16} />{label}</div>}
      <div
        className={`uploadZone ${isDragging ? 'dragging' : ''} ${previews.length >= maxCount ? 'disabled' : ''}`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={previews.length < maxCount ? onClick : undefined}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={maxCount > 1}
          onChange={onChange}
          style={{ display: 'none' }}
        />
        <div className="uploadIcon"><Icon size={compact ? 24 : 32} /></div>
        <div className="uploadText">
          <strong>点击上传</strong> 或拖拽文件到此处
        </div>
        <div className="uploadHint">{hint || `支持 JPG/PNG 格式，最多 ${maxCount} 张`}</div>
        {error && <div className="uploadError">{error}</div>}
      </div>
      {previews.length > 0 && (
        <div className="previewGrid">
          {previews.map((preview) => (
            <div className="previewItem" key={preview.id}>
              <img src={preview.url} alt={preview.name} />
              <button className="previewRemove" onClick={() => onRemove(preview.id)}>
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
