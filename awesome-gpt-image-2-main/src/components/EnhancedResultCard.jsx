import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Heart, Flag, Copy, Check, Video, Sparkles,
  FolderPlus, ChevronDown, Bookmark, X, Download,
  RotateCw, MessageSquare, MoreHorizontal
} from 'lucide-react';
import favoritesManager from '../services/favoritesManager';

export function EnhancedResultCard({
  result,
  onAddToPrompt,
  onGenerateVideo,
  onRegenerate,
  onDownload,
  compact = false
}) {
  const [isFavorited, setIsFavorited] = useState(false);
  const [isFlagged, setIsFlagged] = useState(false);
  const [showGroups, setShowGroups] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [copied, setCopied] = useState(false);
  const [flagNote, setFlagNote] = useState('');
  const [showFlagInput, setShowFlagInput] = useState(false);
  const [showPrompt, setShowPrompt] = useState(!compact);
  const cardRef = useRef(null);
  const groupsRef = useRef(null);

  const imageId = result.id || result.imageUrl;
  const prompt = result.prompt || result.originalPrompt || '';
  const model = result.model || '';
  const resolution = result.resolution || result.size || '';

  useEffect(() => {
    setIsFavorited(favoritesManager.isFavorite(imageId));
    setIsFlagged(favoritesManager.isFlagged(imageId));
    const flag = favoritesManager.getFlag(imageId);
    if (flag) setFlagNote(flag.note || '');
  }, [imageId]);

  useEffect(() => {
    if (!showGroups) return;
    const handleClick = (e) => {
      if (groupsRef.current && !groupsRef.current.contains(e.target)) {
        setShowGroups(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showGroups]);

  const handleFavorite = useCallback(() => {
    if (isFavorited) {
      favoritesManager.removeFavorite(imageId);
      setIsFavorited(false);
    } else {
      favoritesManager.addFavorite(imageId, {
        imageUrl: result.imageUrl,
        prompt,
        model,
        resolution
      });
      setIsFavorited(true);
    }
  }, [isFavorited, imageId, result, prompt, model, resolution]);

  const handleAddToGroup = useCallback((groupId) => {
    if (isFavorited) {
      favoritesManager.moveFavorite(imageId, groupId);
    } else {
      favoritesManager.addFavorite(imageId, {
        imageUrl: result.imageUrl,
        prompt,
        model,
        resolution
      }, groupId);
      setIsFavorited(true);
    }
    setShowGroups(false);
  }, [isFavorited, imageId, result, prompt, model, resolution]);

  const handleFlag = useCallback(() => {
    if (isFlagged && !showFlagInput) {
      favoritesManager.removeFlag(imageId);
      setIsFlagged(false);
      setFlagNote('');
    } else {
      setShowFlagInput(true);
    }
  }, [isFlagged, imageId, showFlagInput]);

  const handleSaveFlag = useCallback(() => {
    favoritesManager.addFlag(imageId, flagNote);
    setIsFlagged(true);
    setShowFlagInput(false);
  }, [imageId, flagNote]);

  const handleCopyPrompt = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* ignore */ }
  }, [prompt]);

  const handleAddToPrompt = useCallback(() => {
    if (onAddToPrompt) {
      onAddToPrompt({
        imageUrl: result.imageUrl,
        prompt,
        model,
        resolution,
        imageId
      });
    }
  }, [onAddToPrompt, result, prompt, model, resolution, imageId]);

  const handleGenerateVideo = useCallback(() => {
    if (onGenerateVideo) {
      onGenerateVideo({
        imageUrl: result.imageUrl,
        prompt,
        model,
        imageId
      });
    }
  }, [onGenerateVideo, result, prompt, model, imageId]);

  const groups = favoritesManager.getGroups();

  return (
    <div className="enhancedResultCard" ref={cardRef}>
      <div className="ercImageWrap">
        {result.imageUrl ? (
          <img src={result.imageUrl} alt={prompt} className="ercImage" loading="lazy" />
        ) : (
          <div className="ercPlaceholder">
            <Sparkles size={24} />
          </div>
        )}

        <div className="ercOverlay">
          <div className="ercOverlayTop">
            <button
              className={`ercIconBtn ${isFavorited ? 'active fav' : ''}`}
              onClick={handleFavorite}
              title="收藏"
            >
              <Heart size={16} fill={isFavorited ? 'currentColor' : 'none'} />
            </button>

            {isFavorited && (
              <button
                className="ercIconBtn"
                onClick={() => setShowGroups(!showGroups)}
                title="移至分组"
              >
                <FolderPlus size={16} />
              </button>
            )}

            <button
              className={`ercIconBtn ${isFlagged ? 'active flag' : ''}`}
              onClick={handleFlag}
              title="标注重点"
            >
              <Flag size={16} fill={isFlagged ? 'currentColor' : 'none'} />
            </button>
          </div>

          <div className="ercOverlayBottom">
            <button className="ercActionBtn primary" onClick={handleAddToPrompt}>
              <MessageSquare size={14} />
              <span>引用</span>
            </button>
            <button className="ercActionBtn" onClick={handleGenerateVideo}>
              <Video size={14} />
              <span>视频</span>
            </button>
            <button className="ercActionBtn" onClick={() => onDownload?.(result)}>
              <Download size={14} />
            </button>
            <button className="ercActionBtn" onClick={() => onRegenerate?.(result)}>
              <RotateCw size={14} />
            </button>
          </div>
        </div>

        {isFlagged && (
          <div className="ercFlagBadge">
            <Flag size={10} fill="currentColor" />
          </div>
        )}

        {showGroups && (
          <div className="ercGroupsDropdown" ref={groupsRef}>
            <div className="ercGroupsHeader">移至分组</div>
            {groups.map(group => (
              <button
                key={group.id}
                className="ercGroupItem"
                onClick={() => handleAddToGroup(group.id)}
              >
                <span>{group.icon}</span>
                <span className="ercGroupName">{group.name}</span>
                <span className="ercGroupCount">{group.count}</span>
              </button>
            ))}
            <button
              className="ercGroupItem ercNewGroup"
              onClick={() => {
                const name = prompt('输入分组名称:');
                if (name) {
                  favoritesManager.createGroup(name);
                  setShowGroups(false);
                }
              }}
            >
              <span>➕</span>
              <span>新建分组</span>
            </button>
          </div>
        )}
      </div>

      {showFlagInput && (
        <div className="ercFlagInput">
          <input
            type="text"
            value={flagNote}
            onChange={(e) => setFlagNote(e.target.value)}
            placeholder="添加标注备注..."
            className="ercFlagInputField"
            autoFocus
            onKeyDown={(e) => { if (e.key === 'Enter') handleSaveFlag(); if (e.key === 'Escape') setShowFlagInput(false); }}
          />
          <button className="ercFlagSaveBtn" onClick={handleSaveFlag}>
            <Check size={14} />
          </button>
          <button className="ercFlagCancelBtn" onClick={() => setShowFlagInput(false)}>
            <X size={14} />
          </button>
        </div>
      )}

      {isFlagged && flagNote && !showFlagInput && (
        <div className="ercFlagNote" onClick={() => setShowFlagInput(true)}>
          <Flag size={10} /> {flagNote}
        </div>
      )}

      <div className="ercPromptSection">
        <div className="ercPromptHeader" onClick={() => setShowPrompt(!showPrompt)}>
          <span className="ercPromptLabel">提示词</span>
          <ChevronDown size={12} className={`ercChevron ${showPrompt ? 'open' : ''}`} />
        </div>
        {showPrompt && prompt && (
          <div className="ercPromptContent">
            <p className="ercPromptText">{prompt}</p>
            <button className="ercCopyBtn" onClick={handleCopyPrompt} title="复制提示词">
              {copied ? <Check size={12} /> : <Copy size={12} />}
              <span>{copied ? '已复制' : '复制'}</span>
            </button>
          </div>
        )}
        {showPrompt && (
          <div className="ercMeta">
            {model && <span className="ercMetaTag">{model}</span>}
            {resolution && <span className="ercMetaTag">{resolution}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
