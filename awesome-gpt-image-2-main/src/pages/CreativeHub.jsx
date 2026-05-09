import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Send, Paperclip, X, Image, Video, Wand2, Layers, Coins, Scissors, Palette, LayoutGrid } from 'lucide-react';
import { CreativeDock } from '../components/CreativeDock';
import { ChatMessage } from '../components/ChatMessage';
import { ModelCapsuleGroup } from '../components/ModelCapsuleGroup';
import { ParamCapsuleGroup } from '../components/ParamCapsuleGroup';
import { HeroShowcase } from '../components/HeroShowcase';
import { AssetShelf } from '../components/AssetShelf';
import { PsdResultCard } from '../components/PsdResultCard';
import { useChat } from '../hooks/useChat';
import { useFileUpload } from '../hooks/useFileUpload';
import { ImageGenerator } from '../services/imageGenerator';
import { VideoGenerator } from '../services/videoGenerator';
import { psdLayerGenerator } from '../services/psdLayerGenerator';
import { getModelById } from '../config/models';

const CATEGORY_DEFAULTS = {
  image: 'gpt-image-2',
  video: 'kling',
  retouch: 'doubao-seededit-retouch',
  psdLayer: 'bria-rmbg-inpainting'
};

const MOBILE_TAB_ITEMS = [
  { key: 'image', icon: Image, label: '图片', color: '#42e6ff' },
  { key: 'video', icon: Video, label: '视频', color: '#f9ff72' },
  { key: 'retouch', icon: Wand2, label: '精修', color: '#ff4aa6' },
  { key: 'psdLayer', icon: Layers, label: 'PSD', color: '#a78bfa' }
];

export function CreativeHub({ language }) {
  const chat = useChat();
  const [activeCategory, setActiveCategory] = useState('image');
  const [genSize, setGenSize] = useState('1024x1024');
  const [genCount, setGenCount] = useState(1);
  const [genDuration, setGenDuration] = useState(5);
  const [prompt, setPrompt] = useState('');
  const [hasStarted, setHasStarted] = useState(false);
  const [refImageUrl, setRefImageUrl] = useState(null);
  const [assetShelfOpen, setAssetShelfOpen] = useState(false);
  const [allAssets, setAllAssets] = useState([]);
  const [psdMode, setPsdMode] = useState('smart');
  const [psdNumColors, setPsdNumColors] = useState(5);
  const [psdIgnoreColor, setPsdIgnoreColor] = useState(null);
  const [psdTaskId, setPsdTaskId] = useState(null);
  const textareaRef = useRef(null);

  const upload = useFileUpload({ accept: 'image/jpeg,image/png,image/webp', maxCount: 1 });

  useEffect(() => {
    chat.scrollToBottom();
  }, [chat.messages]);

  useEffect(() => {
    const assets = [];
    chat.messages.forEach(msg => {
      if (msg.results) {
        msg.results.forEach(r => {
          assets.push({ ...r, messageId: msg.id, model: msg.model });
        });
      }
    });
    setAllAssets(assets);
  }, [chat.messages]);

  const handleCategoryChange = useCallback((category) => {
    setActiveCategory(category);
    chat.setCurrentModel(CATEGORY_DEFAULTS[category] || 'gpt-image-2');
    chat.setCurrentCategory(category);
  }, [chat]);

  const handleSelectFeature = useCallback((category) => {
    handleCategoryChange(category);
    setHasStarted(true);
  }, [handleCategoryChange]);

  const handleQuickPrompt = useCallback((text, category) => {
    handleCategoryChange(category);
    setPrompt(text);
    setHasStarted(true);
    setTimeout(() => textareaRef.current?.focus(), 100);
  }, [handleCategoryChange]);

  const handleSendToVideo = useCallback((imageUrl, imagePrompt) => {
    setActiveCategory('video');
    chat.setCurrentModel(CATEGORY_DEFAULTS.video);
    chat.setCurrentCategory('video');
    setRefImageUrl(imageUrl);
    setPrompt(imagePrompt ? `基于图片生成视频: ${imagePrompt}` : '基于图片生成视频');
    setHasStarted(true);
    setTimeout(() => textareaRef.current?.focus(), 100);
  }, [chat]);

  const handleSendToPsd = useCallback((imageUrl) => {
    setActiveCategory('psdLayer');
    chat.setCurrentModel(CATEGORY_DEFAULTS.psdLayer);
    chat.setCurrentCategory('psdLayer');
    setRefImageUrl(imageUrl);
    setPrompt('PSD智能分层');
    setHasStarted(true);
    setTimeout(() => textareaRef.current?.focus(), 100);
  }, [chat]);

  const handleAssetDrag = useCallback((asset) => {
    if (asset.type === 'image') {
      setRefImageUrl(asset.url);
    }
  }, []);

  const handleSend = useCallback(async () => {
    if (chat.isGenerating) return;

    if (activeCategory === 'psdLayer') {
      const imageUrl = refImageUrl || (upload.previews[0]?.url);
      if (!imageUrl && upload.files.length === 0) return;

      const modeLabels = { smart: 'PSD智能分层', 'color-split': 'PSD颜色拆层', assemble: 'PSD多图组装' };
      chat.addUserMessage(prompt || modeLabels[psdMode], upload.files.length > 0 ? [{ file: upload.files[0], preview: upload.previews[0]?.url }] : [{ url: imageUrl, preview: imageUrl }]);
      const pendingId = chat.addPendingMessage('正在处理PSD分层...', 'image');
      chat.setIsGenerating(true);
      setHasStarted(true);

      const currentPrompt = prompt;
      const currentPsdMode = psdMode;
      setPrompt('');
      setRefImageUrl(null);
      upload.clearFiles?.();

      try {
        let result;
        let fileToProcess = null;

        if (upload.files.length > 0) {
          fileToProcess = upload.files[0];
        } else if (imageUrl) {
          const response = await fetch(imageUrl);
          const blob = await response.blob();
          fileToProcess = new File([blob], 'image.png', { type: blob.type || 'image/png' });
        }

        if (!fileToProcess) {
          chat.failMessage(pendingId, '未找到图片文件');
          chat.setIsGenerating(false);
          return;
        }

        if (currentPsdMode === 'color-split') {
          result = await psdLayerGenerator.splitByColors(fileToProcess, {
            numColors: psdNumColors,
            ignoreColor: psdIgnoreColor
          });
        } else if (currentPsdMode === 'assemble') {
          result = await psdLayerGenerator.assembleImages([fileToProcess]);
        } else {
          result = await psdLayerGenerator.processImage(fileToProcess);
        }

        if (result && result.taskId) {
          setPsdTaskId(result.taskId);
          const modeSteps = {
            smart: 'AI抠图 → 背景补全 → PSD打包',
            'color-split': '颜色分析 → 聚类拆层 → PSD打包',
            assemble: '图层准备 → PSD打包'
          };
          chat.updateMessage(pendingId, { content: `PSD分层处理中... ${modeSteps[currentPsdMode]}` });

          const eventSource = psdLayerGenerator.listenProgress(result.taskId, (data) => {
            if (data.step) {
              const stepLabels = {
                'remove-bg': 'AI抠图中...', 'inpaint': '背景补全中...', 'build-psd': 'PSD打包中...',
                'analyze': '颜色分析中...', 'cluster': '颜色聚类中...', 'split': '拆分图层中...',
                'prepare': '准备图层中...', 'process-layer': '处理图层中...',
                'done': '完成!'
              };
              chat.updateMessage(pendingId, { content: stepLabels[data.step] || data.step });
            }
            if (data.status === 'completed' || data.step === 'done') {
              const items = [];
              if (data.foregroundUrl) {
                items.push({ id: `psd_fg_${Date.now()}`, type: 'image', url: data.foregroundUrl, prompt: currentPrompt, psdLayer: true, layerName: '前景图层' });
              }
              if (data.backgroundUrl) {
                items.push({ id: `psd_bg_${Date.now()}`, type: 'image', url: data.backgroundUrl, prompt: currentPrompt, psdLayer: true, layerName: '背景图层' });
              }
              if (data.layers && data.layers.length > 0) {
                data.layers.forEach((layer, idx) => {
                  if (layer.url) {
                    items.push({ id: `psd_layer_${Date.now()}_${idx}`, type: 'image', url: layer.url, prompt: currentPrompt, psdLayer: true, layerName: layer.name, layerColor: layer.color });
                  }
                });
              }
              if (items.length > 0) {
                chat.completeMessage(pendingId, items, `PSD分层完成，共 ${items.length} 个图层`);
              } else {
                chat.completeMessage(pendingId, [], 'PSD分层完成');
              }
              chat.setIsGenerating(false);
            }
            if (data.status === 'failed') {
              chat.failMessage(pendingId, data.error || 'PSD分层失败');
              chat.setIsGenerating(false);
            }
          });

          setTimeout(() => {
            eventSource.close();
            chat.setIsGenerating(false);
          }, 300000);

        } else {
          chat.failMessage(pendingId, 'PSD处理请求失败');
          chat.setIsGenerating(false);
        }
      } catch (err) {
        chat.failMessage(pendingId, err.message || 'PSD处理失败');
        chat.setIsGenerating(false);
      }
      return;
    }

    if (!prompt.trim()) return;

    const attachments = upload.files.map((file, idx) => ({
      file,
      preview: upload.previews[idx]?.url
    }));

    if (refImageUrl && activeCategory === 'video') {
      attachments.push({ url: refImageUrl, preview: refImageUrl });
    }

    chat.addUserMessage(prompt, attachments);
    const pendingId = chat.addPendingMessage('正在生成...', activeCategory === 'video' ? 'video' : 'image');
    chat.setIsGenerating(true);
    setHasStarted(true);

    const currentPrompt = prompt;
    setPrompt('');
    setRefImageUrl(null);
    upload.clearFiles?.();

    try {
      let result;

      if (activeCategory === 'video') {
        const videoGenerator = new VideoGenerator('', chat.currentModel);

        if (refImageUrl || (attachments.length > 0 && attachments[0].url)) {
          const imageUrl = refImageUrl || attachments[0].url;
          result = await videoGenerator.fromImage(imageUrl, currentPrompt, {
            duration: genDuration,
            aspectRatio: genSize === '1024x1024' ? '1:1' : genSize === '1536x1024' ? '16:9' : '9:16'
          });
        } else if (attachments.length > 0 && (attachments[0].file instanceof File || attachments[0].file instanceof Blob)) {
          result = await videoGenerator.fromImage(attachments[0].file, currentPrompt, {
            duration: genDuration,
            aspectRatio: genSize === '1024x1024' ? '1:1' : genSize === '1536x1024' ? '16:9' : '9:16'
          });
        } else {
          result = await videoGenerator.generate(currentPrompt, {
            duration: genDuration,
            aspectRatio: genSize === '1024x1024' ? '1:1' : genSize === '1536x1024' ? '16:9' : '9:16'
          });
        }

        if (result.success && result.taskId && result.status === 'pending') {
          chat.updateMessage(pendingId, { content: '视频生成中，请稍候...' });
          const pollResult = await videoGenerator.pollUntilComplete(
            result.taskId,
            (progress) => {
              if (progress.progress) {
                chat.updateMessage(pendingId, { content: `视频生成中... ${progress.progress}%` });
              }
            }
          );

          if (pollResult.success && pollResult.videos) {
            const items = pollResult.videos.map((video, idx) => ({
              id: `gen_${Date.now()}_${idx}`,
              type: 'video',
              url: video.url,
              prompt: currentPrompt,
              duration: genDuration,
              sourceImageUrl: refImageUrl
            }));
            chat.completeMessage(pendingId, items, `已生成 ${items.length} 个视频`);
          } else {
            chat.failMessage(pendingId, pollResult.error || '视频生成失败');
          }
        } else if (result.success && result.videos) {
          const items = result.videos.map((video, idx) => ({
            id: `gen_${Date.now()}_${idx}`,
            type: 'video',
            url: video.url || video,
            prompt: currentPrompt,
            duration: genDuration,
            sourceImageUrl: refImageUrl
          }));
          chat.completeMessage(pendingId, items, `已生成 ${items.length} 个视频`);
        } else {
          chat.failMessage(pendingId, result.error || '视频生成失败');
        }

      } else {
        const imageGenerator = new ImageGenerator();

        if (attachments.length > 0 && attachments[0].file) {
          result = await imageGenerator.edit(attachments[0].file, currentPrompt, {
            model: chat.currentModel,
            n: genCount,
            size: genSize
          });
        } else {
          result = await imageGenerator.generate(currentPrompt, {
            model: chat.currentModel,
            n: genCount,
            size: genSize
          });
        }

        if (result.success) {
          const items = (result.images || result.videos || []).map((item, idx) => ({
            id: `gen_${Date.now()}_${idx}`,
            type: 'image',
            url: item.url || item,
            prompt: currentPrompt,
            width: item.width,
            height: item.height
          }));
          chat.completeMessage(pendingId, items, `已生成 ${items.length} 个结果`);
        } else {
          chat.failMessage(pendingId, result.error || '生成失败');
        }
      }
    } catch (err) {
      chat.failMessage(pendingId, err.message || '请求失败');
    } finally {
      chat.setIsGenerating(false);
    }
  }, [prompt, chat, activeCategory, genSize, genCount, genDuration, upload, refImageUrl]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleDownload = useCallback((result) => {
    const a = document.createElement('a');
    a.href = result.url;
    a.download = `generated-${Date.now()}.${result.type === 'video' ? 'mp4' : 'png'}`;
    a.click();
  }, []);

  const handleRegenerate = useCallback((result) => {
    if (result.prompt) {
      setPrompt(result.prompt);
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, []);

  const estimatedCost = useCallback(() => {
    const model = getModelById(chat.currentModel);
    if (!model) return 0;
    if (model.pricing.perImage) {
      return model.pricing.perImage * genCount;
    }
    if (model.pricing.perSecond) {
      return model.pricing.perSecond * genDuration;
    }
    return 0;
  }, [chat.currentModel, genCount, genDuration]);

  const getPlaceholder = () => {
    if (activeCategory === 'psdLayer') {
      return refImageUrl ? '点击发送开始PSD智能分层...' : '上传图片或从资产面板拖入图片...';
    }
    if (activeCategory === 'video') {
      if (refImageUrl) return '描述你想要基于图片生成的视频...';
      return '描述你想要生成的视频内容...';
    }
    if (upload.hasFiles) return '描述你想要基于参考图生成的内容...';
    return '描述你想要生成的内容...';
  };

  const canSend = () => {
    if (chat.isGenerating) return false;
    if (activeCategory === 'psdLayer') {
      return !!(refImageUrl || upload.files.length > 0);
    }
    return !!prompt.trim();
  };

  return (
    <div className="creativeHubFinal">
      <CreativeDock
        activeCategory={activeCategory}
        onCategoryChange={handleCategoryChange}
      />

      <div className="creativeHubFinalMain">
        <div className="chatStreamFinal">
          {!hasStarted ? (
            <HeroShowcase
              onSelectFeature={handleSelectFeature}
              onQuickPrompt={handleQuickPrompt}
            />
          ) : (
            <>
              {chat.messages.map(message => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  onDownload={handleDownload}
                  onRegenerate={handleRegenerate}
                  onSendToVideo={handleSendToVideo}
                  onSendToPsd={handleSendToPsd}
                />
              ))}
            </>
          )}
          <div ref={chat.messagesEndRef} />
        </div>

        <div className="smartCommandBar">
          <div className="smartCommandBarInner">
            {activeCategory !== 'psdLayer' && (
              <div className="smartCommandModelRow">
                <ModelCapsuleGroup
                  category={activeCategory}
                  currentModel={chat.currentModel}
                  onModelChange={(id) => chat.setCurrentModel(id)}
                />
              </div>
            )}

            {activeCategory === 'psdLayer' && (
              <div className="smartCommandModelRow">
                <div className="psdModeSelector">
                  <button
                    className={`psdModeBtn ${psdMode === 'smart' ? 'selected' : ''}`}
                    onClick={() => setPsdMode('smart')}
                  >
                    <Scissors size={14} />
                    <span>智能拆层</span>
                  </button>
                  <button
                    className={`psdModeBtn ${psdMode === 'color-split' ? 'selected' : ''}`}
                    onClick={() => setPsdMode('color-split')}
                  >
                    <Palette size={14} />
                    <span>颜色拆层</span>
                  </button>
                  <button
                    className={`psdModeBtn ${psdMode === 'assemble' ? 'selected' : ''}`}
                    onClick={() => setPsdMode('assemble')}
                  >
                    <LayoutGrid size={14} />
                    <span>多图组装</span>
                  </button>
                </div>
              </div>
            )}

            {(refImageUrl || upload.hasFiles) && (
              <div className="smartCommandRefPreview">
                {refImageUrl && (
                  <div className="smartCommandRefThumb">
                    <img src={refImageUrl} alt="参考图" />
                    <button className="smartCommandRefRemove" onClick={() => setRefImageUrl(null)}>
                      <X size={12} />
                    </button>
                  </div>
                )}
                {upload.previews.map((preview) => (
                  <div key={preview.id} className="smartCommandRefThumb">
                    <img src={preview.url} alt="参考图" />
                    <button className="smartCommandRefRemove" onClick={() => upload.removeFile(preview.id)}>
                      <X size={12} />
                    </button>
                  </div>
                ))}
                <span className="smartCommandRefHint">
                  {activeCategory === 'video' ? '图生视频模式' : activeCategory === 'psdLayer' ? 'PSD分层模式' : '图生图模式'}
                </span>
              </div>
            )}

            <div className="smartCommandInputRow">
              <button className="smartCommandAttach" onClick={upload.handleClick} title="上传参考图">
                <Paperclip size={18} />
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
                className="smartCommandTextarea"
                value={prompt}
                onChange={(e) => {
                  setPrompt(e.target.value);
                  const el = textareaRef.current;
                  if (el) {
                    el.style.height = 'auto';
                    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
                  }
                }}
                onKeyDown={handleKeyDown}
                placeholder={getPlaceholder()}
                rows={1}
              />

              <button
                className={`smartCommandSend ${chat.isGenerating ? 'loading' : ''}`}
                onClick={handleSend}
                disabled={!canSend()}
              >
                <Send size={18} />
              </button>
            </div>

            <div className="smartCommandParamRow">
              <ParamCapsuleGroup
                category={activeCategory}
                size={genSize}
                onSizeChange={setGenSize}
                count={genCount}
                onCountChange={setGenCount}
                duration={genDuration}
                onDurationChange={setGenDuration}
                psdMode={psdMode}
                onPsdModeChange={setPsdMode}
                psdNumColors={psdNumColors}
                onPsdNumColorsChange={setPsdNumColors}
                psdIgnoreColor={psdIgnoreColor}
                onPsdIgnoreColorChange={setPsdIgnoreColor}
              />
              <div className="smartCommandCostHint">
                <Coins size={12} />
                <span>预计</span>
                <span className="costValue">{estimatedCost()}</span>
                <span>积分</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {allAssets.length > 0 && (
        <AssetShelf
          assets={allAssets}
          isOpen={assetShelfOpen}
          onToggle={() => setAssetShelfOpen(!assetShelfOpen)}
          onSendToVideo={handleSendToVideo}
          onSendToPsd={handleSendToPsd}
          onDragAsset={handleAssetDrag}
          onDownload={handleDownload}
        />
      )}

      <div className="mobileTabBar">
        <div className="mobileTabBarItems">
          {MOBILE_TAB_ITEMS.map(item => {
            const Icon = item.icon;
            const isActive = activeCategory === item.key;
            return (
              <button
                key={item.key}
                className={`mobileTabBarItem ${isActive ? 'active' : ''}`}
                onClick={() => handleCategoryChange(item.key)}
                style={{ '--item-color': item.color }}
              >
                <Icon size={20} />
                <span className="mobileTabBarItemLabel">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
