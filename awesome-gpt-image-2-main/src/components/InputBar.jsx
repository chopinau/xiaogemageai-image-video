import React, { useState, useRef, useCallback } from 'react';
import { Send, Paperclip, X, Image as ImageIcon } from 'lucide-react';
import { useFileUpload } from '../hooks/useFileUpload';
import { getModelOptions } from '../config/models';
import { ASPECT_RATIOS, GENERATE_COUNTS } from '../config/constants';

export function InputBar({
  onSend,
  isGenerating,
  currentModel,
  onModelChange,
  currentCategory
}) {
  const [prompt, setPrompt] = useState('');
  const [genCount, setGenCount] = useState(1);
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const textareaRef = useRef(null);

  const upload = useFileUpload({
    accept: 'image/jpeg,image/png,image/webp',
    maxCount: 1
  });

  const hasReferenceImage = upload.hasFiles;

  const modelOptions = getModelOptions(currentCategory === 'image' ? 'image' : currentCategory);

  const handleSend = useCallback(() => {
    if (!prompt.trim() || isGenerating) return;

    const attachments = upload.files.map((file, idx) => ({
      file,
      preview: upload.previews[idx]?.url
    }));

    onSend({
      prompt: prompt.trim(),
      attachments: attachments.length > 0 ? attachments : undefined,
      params: {
        model: currentModel,
        n: genCount,
        aspectRatio,
        size: aspectRatio === '1:1' ? '1024x1024' : aspectRatio === '16:9' ? '1536x1024' : '1024x1536'
      }
    });

    setPrompt('');
    upload.clearFiles?.();
  }, [prompt, isGenerating, upload, onSend, currentModel, genCount, aspectRatio]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleTextareaChange = useCallback((e) => {
    setPrompt(e.target.value);
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 200) + 'px';
    }
  }, []);

  return (
    <div className="inputBar">
      {hasReferenceImage && (
        <div className="inputBarReference">
          {upload.previews.map((preview) => (
            <div key={preview.id} className="inputBarReferenceThumb">
              <img src={preview.url} alt="参考图" />
              <button
                className="inputBarReferenceRemove"
                onClick={() => upload.removeFile(preview.id)}
              >
                <X size={12} />
              </button>
            </div>
          ))}
          <span className="inputBarReferenceHint">基于参考图生成</span>
        </div>
      )}

      <div className="inputBarMain">
        <button
          className="inputBarAttach"
          onClick={upload.handleClick}
          title="上传参考图"
        >
          <Paperclip size={20} />
          <input
            ref={upload.inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={upload.handleChange}
            style={{ display: 'none' }}
          />
        </button>

        <textarea
          ref={textareaRef}
          className="inputBarTextarea"
          value={prompt}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          placeholder={hasReferenceImage
            ? "描述你想要基于参考图生成的内容..."
            : "描述你想要生成的内容，例如：一只穿着宇航服的猫咪，赛博朋克风格..."
          }
          rows={1}
        />

        <button
          className={`inputBarSend ${isGenerating ? 'loading' : ''}`}
          onClick={handleSend}
          disabled={!prompt.trim() || isGenerating}
        >
          <Send size={18} />
        </button>
      </div>

      <div className="inputBarParams">
        <select
          className="inputBarSelect"
          value={currentModel}
          onChange={(e) => onModelChange(e.target.value)}
        >
          {modelOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        <select
          className="inputBarSelect"
          value={genCount}
          onChange={(e) => setGenCount(Number(e.target.value))}
        >
          {GENERATE_COUNTS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        <select
          className="inputBarSelect"
          value={aspectRatio}
          onChange={(e) => setAspectRatio(e.target.value)}
        >
          {ASPECT_RATIOS.mainImage.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
