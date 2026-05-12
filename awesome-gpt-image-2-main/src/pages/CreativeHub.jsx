import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Image, Video, Wand2, Layers, Scissors, Palette, LayoutGrid, AlertCircle, CheckCircle2, X, Archive } from 'lucide-react';
import { MasonryGallery } from '../components/MasonryGallery';
import { FloatingCommandBar } from '../components/FloatingCommandBar';
import { CreativeDock } from '../components/CreativeDock';
import { ImageLightbox } from '../components/ImageLightbox';
import { AssetPanel } from '../components/AssetPanel';
import { FlagDialog } from '../components/FlagDialog';
import { ChannelGroupSelector } from '../components/ChannelGroupSelector';
import { useChat } from '../hooks/useChat';
import { useFileUpload } from '../hooks/useFileUpload';
import { useGalleryStore } from '../store/galleryStore';
import { ImageGenerator } from '../services/imageGenerator';
import { VideoGenerator } from '../services/videoGenerator';
import { psdLayerGenerator } from '../services/psdLayerGenerator';
import { getModelById } from '../config/models';
import { getModelParamDefaults } from '../config/modelParams';
import { calculateComputeCost } from '../config/modelPricing';

const IS_DEMO = !import.meta.env.VITE_API_BASE_URL;

function classifyError(err) {
  const msg = (err.message || '').toLowerCase();
  const errStr = (err.error || '').toLowerCase();
  const combined = `${msg} ${errStr}`;

  // 余额/配额不足相关错误 - 优先级最高
  if (combined.includes('quota') || 
      combined.includes('余额') || 
      combined.includes('积分不足') ||
      combined.includes('insufficient') || 
      combined.includes('user quota is not enough') ||
      combined.includes('balance')) {
    return { type: 'error', category: 'quota', message: '余额不足，请前往充值页面补充算力后继续使用', action: 'recharge' };
  }
  // 频率限制相关
  if (combined.includes('rate_limit') || 
      combined.includes('too many') || 
      combined.includes('频率') ||
      combined.includes('429')) {
    return { type: 'warning', category: 'rate', message: '请求过于频繁，请稍等片刻后重试', action: 'wait' };
  }
  // 图片URL无效
  if (combined.includes('invalid url') || combined.includes('invail url')) {
    return { type: 'error', category: 'url', message: '参考图片地址无效，请重新上传图片或使用已生成的图片', action: 'reupload' };
  }
  // 内容安全相关
  if (combined.includes('content_policy') || 
      combined.includes('safety') || 
      combined.includes('不合规') || 
      combined.includes('违规') || 
      combined.includes('blocked') ||
      combined.includes('拒绝')) {
    return { type: 'error', category: 'content', message: '提示词内容不符合安全规范，请修改后重试', action: 'edit_prompt' };
  }
  // 模型不可用
  if (combined.includes('model_not_found') || 
      combined.includes('not available') || 
      combined.includes('不支持') ||
      combined.includes('model not found')) {
    return { type: 'error', category: 'model', message: '当前模型暂不可用，请切换其他模型重试', action: 'switch_model' };
  }
  // 网络相关
  if (combined.includes('network') || 
      combined.includes('fetch') || 
      combined.includes('timeout') || 
      combined.includes('超时') || 
      combined.includes('ECONNREFUSED') ||
      combined.includes('network error')) {
    return { type: 'error', category: 'network', message: '网络连接异常，请检查网络后重试', action: 'retry' };
  }
  // 认证相关
  if (combined.includes('authentication') || 
      combined.includes('api key') || 
      combined.includes('unauthorized') || 
      combined.includes('401') ||
      combined.includes('invalid token')) {
    return { type: 'error', category: 'auth', message: 'API密钥无效，请检查密钥配置', action: 'check_key' };
  }
  // 服务器错误
  if (combined.includes('server') || 
      combined.includes('500') || 
      combined.includes('internal') ||
      combined.includes('service unavailable')) {
    return { type: 'error', category: 'server', message: '服务器暂时异常，请稍后重试', action: 'retry' };
  }
  // 默认错误
  return { type: 'error', category: 'unknown', message: `生成出错：${err.message || '未知错误'}`, action: 'retry' };
}

const DEMO_PLACEHOLDER_IMAGES = [
  'https://picsum.photos/seed/img1/800/800',
  'https://picsum.photos/seed/img2/600/900',
  'https://picsum.photos/seed/img3/900/600',
  'https://picsum.photos/seed/img4/800/1000',
];

const DEMO_PLACEHOLDER_VIDEOS = [
  'https://test-videos.co.uk/vids/bigbuckbunny/mp4av1.mp4',
];

const CATEGORY_DEFAULTS = {
  image: 'gpt-image-2',
  video: 'kling-v3-video',
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
  const store = useGalleryStore();
  const [activeCategory, setActiveCategory] = useState('image');
  const [modelParams, setModelParams] = useState(getModelParamDefaults('gpt-image-2'));
  const [prompt, setPrompt] = useState('');
  const [refImageUrl, setRefImageUrl] = useState(null);
  const [psdMode, setPsdMode] = useState('smart');
  const [psdNumColors, setPsdNumColors] = useState(5);
  const [psdIgnoreColor, setPsdIgnoreColor] = useState(null);
  const [galleryItems, setGalleryItems] = useState([]);
  const [toast, setToast] = useState(null);

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [showAssetPanel, setShowAssetPanel] = useState(false);
  const [flagDialogItem, setFlagDialogItem] = useState(null);
  const [showPricing, setShowPricing] = useState(false);

  const showToast = useCallback((type, message) => {
    setToast({ type, message, key: Date.now() });
    setTimeout(() => setToast(null), 5000);
  }, []);

  const upload = useFileUpload({ accept: 'image/jpeg,image/png,image/webp', maxCount: 1 });

  useEffect(() => {
    const items = [];
    chat.messages.forEach(msg => {
      if (msg.results) {
        msg.results.forEach(r => {
          items.push({
            ...r,
            messageId: msg.id,
            model: msg.model || getModelById(chat.currentModel)?.name,
            credits: calculateComputeCost(chat.currentModel, modelParams)
          });
        });
      }
    });
    setGalleryItems(items);
  }, [chat.messages, chat.currentModel, modelParams]);

  const handleCategoryChange = useCallback((category) => {
    setActiveCategory(category);
    const defaultModel = CATEGORY_DEFAULTS[category] || 'gpt-image-2';
    chat.setCurrentModel(defaultModel);
    chat.setCurrentCategory(category);
    setModelParams(getModelParamDefaults(defaultModel));
  }, [chat]);

  const handleModelChange = useCallback((modelId) => {
    chat.setCurrentModel(modelId);
    setModelParams(getModelParamDefaults(modelId));
  }, [chat]);

  const handleParamChange = useCallback((paramId, value) => {
    setModelParams(prev => ({ ...prev, [paramId]: value }));
  }, []);

  const handleFileUpload = useCallback((file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setRefImageUrl(e.target.result);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleRemoveRef = useCallback(() => {
    setRefImageUrl(null);
  }, []);

  const handleSendToVideo = useCallback((imageUrl, imagePrompt) => {
    setActiveCategory('video');
    const defaultModel = CATEGORY_DEFAULTS.video;
    chat.setCurrentModel(defaultModel);
    chat.setCurrentCategory('video');
    setModelParams(getModelParamDefaults(defaultModel));
    setRefImageUrl(imageUrl);
    setPrompt(imagePrompt ? `基于图片生成视频: ${imagePrompt}` : '基于图片生成视频');
  }, [chat]);

  const handleDownload = useCallback(async (item) => {
    try {
      showToast('info', '正在准备下载...');
      const response = await fetch(item.url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `generated-${Date.now()}.${item.type === 'video' ? 'mp4' : 'png'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      showToast('success', '下载完成');
    } catch {
      window.open(item.url, '_blank');
      showToast('info', '已在新窗口打开');
    }
  }, [showToast]);

  const handleFavorite = useCallback((item) => {
    store.toggleFavorite(item);
    if (store.isFavorited(item.id)) {
      showToast('info', '已取消收藏');
    } else {
      showToast('success', '已加入收藏');
    }
  }, [store, showToast]);

  const handleFlag = useCallback((item) => {
    if (store.isFlagged(item.id)) {
      store.toggleFlag(item, '');
      showToast('info', '已取消标记');
    } else {
      setFlagDialogItem(item);
    }
  }, [store, showToast]);

  const handleFlagConfirm = useCallback((item, reason) => {
    store.toggleFlag(item, reason);
    setFlagDialogItem(null);
    showToast('success', `已标记：${reason}`);
  }, [store, showToast]);

  const handleFlagCancel = useCallback(() => {
    setFlagDialogItem(null);
  }, []);

  const handleUseAsReference = useCallback((item) => {
    setRefImageUrl(item.url);
    if (item.prompt) {
      setPrompt(`基于参考图：${item.prompt}`);
    }
    if (item.model) {
      const modelId = Object.entries(CATEGORY_DEFAULTS).find(([,v]) => v === item.model || v.includes(item.model?.split('-')[0]));
      if (modelId?.[0]) {
        setActiveCategory(modelId[0]);
        chat.setCurrentModel(modelId[1] || item.model);
        chat.setCurrentCategory(modelId[0]);
      }
    }
    showToast('success', '已设为参考图，可修改提示词后生成');
  }, [chat, showToast]);

  const handleUsePrompt = useCallback((item) => {
    if (item.prompt) {
      setPrompt(item.prompt);
      showToast('success', '提示词已回填到输入框');
    }
  }, [showToast]);

  const handleOpenLightbox = useCallback((item) => {
    const imageOnly = galleryItems.filter(it => it.type === 'image');
    const idx = imageOnly.findIndex(it => it.id === item.id);
    setLightboxIndex(idx >= 0 ? idx : 0);
    setLightboxOpen(true);
  }, [galleryItems]);

  const handleCloseLightbox = useCallback(() => {
    setLightboxOpen(false);
  }, []);

  const handleLightboxPrev = useCallback(() => {
    const imageOnly = galleryItems.filter(it => it.type === 'image');
    setLightboxIndex(prev => (prev > 0 ? prev - 1 : imageOnly.length - 1));
  }, [galleryItems]);

  const handleLightboxNext = useCallback(() => {
    const imageOnly = galleryItems.filter(it => it.type === 'image');
    setLightboxIndex(prev => (prev < imageOnly.length - 1 ? prev + 1 : 0));
  }, [galleryItems]);

  const handleLightboxDownload = useCallback((item) => {
    handleDownload(item);
  }, [handleDownload]);

  const handleAssetUseRef = useCallback((item) => {
    handleUseAsReference(item);
    setShowAssetPanel(false);
  }, [handleUseAsReference]);

  const handleAssetUsePrompt = useCallback((item) => {
    handleUsePrompt(item);
    setShowAssetPanel(false);
  }, [handleUsePrompt]);

  const handleFlagRetry = useCallback((item) => {
    if (item.prompt) setPrompt(item.prompt);
    if (item.model) {
      const models = { image: 'gpt-image-2', video: 'kling-v3-video' };
      for (const [cat, mid] of Object.entries(models)) {
        if (item.model.toLowerCase().includes(mid.split('-')[0]) || item.model.includes(mid.split('-')[0])) {
          setActiveCategory(cat);
          chat.setCurrentModel(mid);
          chat.setCurrentCategory(cat);
          break;
        }
      }
    }
    setShowAssetPanel(false);
    showToast('info', '已回填提示词，可修改后重新生成');
  }, [chat, showToast]);

  const handleFlagDismiss = useCallback((id) => {
    store.removeFlag(id);
    showToast('info', '已忽略该标记');
  }, [store, showToast]);

  const handleBatchDownload = useCallback((items) => {
    items.forEach((item, i) => {
      setTimeout(() => handleDownload(item), i * 500);
    });
    showToast('success', `正在批量下载 ${items.length} 项`);
  }, [handleDownload, showToast]);

  const handleBatchFavorite = useCallback((items) => {
    items.forEach(item => store.toggleFavorite(item));
    showToast('success', `已批量收藏 ${items.length} 项`);
  }, [store, showToast]);

  const handleBatchReference = useCallback((items) => {
    if (items.length > 0) {
      setRefImageUrl(items[items.length - 1].url);
      setPrompt(`批量参考图生成（共${items.length}张）`);
      showToast('success', `已设置 ${items.length} 张参考图`);
    }
  }, [showToast]);

  const buildApiParams = useCallback(() => {
    return { ...modelParams };
  }, [modelParams]);

  const handleSend = useCallback(async () => {
    if (chat.isGenerating) return;

    if (activeCategory === 'psdLayer') {
      const imageUrl = refImageUrl || (upload?.previews?.[0]?.url);
      if (!imageUrl && upload?.files?.length === 0) return;

      chat.setIsGenerating(true);

      try {
        let fileToProcess = null;
        if (upload?.files?.length > 0) {
          fileToProcess = upload.files[0];
        } else if (imageUrl) {
          const response = await fetch(imageUrl);
          const blob = await response.blob();
          fileToProcess = new File([blob], 'image.png', { type: blob.type || 'image/png' });
        }

        if (!fileToProcess) { chat.setIsGenerating(false); return; }

        let result;
        if (psdMode === 'color-split') {
          result = await psdLayerGenerator.splitByColors(fileToProcess, { numColors: psdNumColors, ignoreColor: psdIgnoreColor });
        } else if (psdMode === 'assemble') {
          result = await psdLayerGenerator.assembleImages([fileToProcess]);
        } else {
          result = await psdLayerGenerator.processImage(fileToProcess);
        }

        if (result && result.taskId) {
          const eventSource = psdLayerGenerator.listenProgress(result.taskId, (data) => {
            if (data.status === 'completed' || data.step === 'done') {
              const items = [];
              if (data.foregroundUrl) items.push({ id: `psd_fg_${Date.now()}`, type: 'image', url: data.foregroundUrl, prompt: prompt, psdLayer: true, layerName: '前景图层' });
              if (data.backgroundUrl) items.push({ id: `psd_bg_${Date.now()}`, type: 'image', url: data.backgroundUrl, prompt: prompt, psdLayer: true, layerName: '背景图层' });
              if (data.layers) data.layers.forEach((layer, idx) => { if (layer.url) items.push({ id: `psd_l_${Date.now()}_${idx}`, type: 'image', url: layer.url, prompt: prompt, psdLayer: true, layerName: layer.name, layerColor: layer.color }); });
              chat.addAssistantMessage(items.length > 0 ? `PSD分层完成，共 ${items.length} 个图层` : 'PSD分层完成', 'image', items);
              chat.setIsGenerating(false);
            }
            if (data.status === 'failed') { chat.setIsGenerating(false); }
          });
          setTimeout(() => { eventSource.close(); chat.setIsGenerating(false); }, 300000);
        } else { chat.setIsGenerating(false); }
      } catch (err) { chat.setIsGenerating(false); }

      setPrompt('');
      setRefImageUrl(null);
      upload.clearFiles?.();
      return;
    }

    if (!prompt.trim()) return;

    chat.setIsGenerating(true);
    const currentPrompt = prompt;
    const apiParams = buildApiParams();
    const model = getModelById(chat.currentModel);
    const nCount = apiParams.n ? parseInt(apiParams.n) : 1;
    setPrompt('');
    setRefImageUrl(null);
    upload.clearFiles?.();

    try {
      let result;

      if (activeCategory === 'video') {
        const videoGenerator = new VideoGenerator('', model?.lingkeModel || chat.currentModel);
        const videoOpts = {
          duration: apiParams.duration ? parseInt(apiParams.duration) : 5,
          aspectRatio: apiParams.aspect_ratio || apiParams.ratio || '16:9',
          resolution: apiParams.resolution || '720P',
          quality: apiParams.quality || apiParams.mode || 'standard',
          enhancePrompt: apiParams.enhance_prompt || false,
          promptExtend: apiParams.prompt_extend || false
        };

        if (IS_DEMO) {
          const demoItems = DEMO_PLACEHOLDER_VIDEOS.slice(0, nCount).map((url, idx) => ({
            id: `demo_v_${Date.now()}_${idx}`,
            type: 'video',
            url,
            prompt: currentPrompt,
            duration: videoOpts.duration,
            model: model?.name || chat.currentModel
          }));
          chat.addAssistantMessage(`[演示] 已生成 ${demoItems.length} 个视频`, 'video', demoItems);
          showToast('success', `演示模式：${model?.name || chat.currentModel} 返回 ${demoItems.length} 个结果`);
        } else if (refImageUrl) {
          result = await videoGenerator.fromImage(refImageUrl, currentPrompt, videoOpts);
          if (result.success && result.taskId && result.status === 'pending') {
            const pollResult = await videoGenerator.pollUntilComplete(result.taskId, () => {});
            if (pollResult.success && pollResult.videos) {
              const items = pollResult.videos.map((video, idx) => ({
                id: `gen_${Date.now()}_${idx}`, type: 'video', url: video.url, prompt: currentPrompt, duration: videoOpts.duration, model: model?.name
              }));
              chat.addAssistantMessage(`已生成 ${items.length} 个视频`, 'video', items);
            }
          } else if (result.success && result.videos) {
            const items = result.videos.map((video, idx) => ({
              id: `gen_${Date.now()}_${idx}`, type: 'video', url: video.url || video, prompt: currentPrompt, duration: videoOpts.duration, model: model?.name
            }));
            chat.addAssistantMessage(`已生成 ${items.length} 个视频`, 'video', items);
          } else {
            const fallbackInfo = result.fallbackModel ? `\n\n💡 建议切换到模型：${result.fallbackModel}` : '';
            const classified = classifyError({ message: result.error || '视频生成失败', error: result.error });
            showToast(classified.type, classified.message + fallbackInfo);
          }
        } else {
          result = await videoGenerator.generate(currentPrompt, videoOpts);
          if (result.success && result.taskId && result.status === 'pending') {
            const pollResult = await videoGenerator.pollUntilComplete(result.taskId, () => {});
            if (pollResult.success && pollResult.videos) {
              const items = pollResult.videos.map((video, idx) => ({
                id: `gen_${Date.now()}_${idx}`, type: 'video', url: video.url, prompt: currentPrompt, duration: videoOpts.duration, model: model?.name
              }));
              chat.addAssistantMessage(`已生成 ${items.length} 个视频`, 'video', items);
            }
          } else if (result.success && result.videos) {
            const items = result.videos.map((video, idx) => ({
              id: `gen_${Date.now()}_${idx}`, type: 'video', url: video.url || video, prompt: currentPrompt, duration: videoOpts.duration, model: model?.name
            }));
            chat.addAssistantMessage(`已生成 ${items.length} 个视频`, 'video', items);
          } else {
            const fallbackInfo = result.fallbackModel ? `\n\n💡 建议切换到模型：${result.fallbackModel}` : '';
            const classified = classifyError({ message: result.error || '视频生成失败', error: result.error });
            showToast(classified.type, classified.message + fallbackInfo);
          }
        }
      } else {
        if (IS_DEMO) {
          await new Promise(r => setTimeout(r, 800 + Math.random() * 1500));
          const shuffled = [...DEMO_PLACEHOLDER_IMAGES].sort(() => Math.random() - 0.5);
          const demoItems = [];
          for (let i = 0; i < Math.min(nCount, shuffled.length); i++) {
            demoItems.push({
              id: `demo_${Date.now()}_${i}`,
              type: 'image',
              url: `${shuffled[i]}?random=${Date.now() + i}`,
              prompt: currentPrompt,
              model: model?.name || chat.currentModel
            });
          }
          chat.addAssistantMessage(`[演示] 已生成 ${demoItems.length} 个结果`, 'image', demoItems);
          showToast('success', `演示模式：${model?.name || chat.currentModel} ×${demoItems.length}`);
        } else {
          const imageGenerator = new ImageGenerator();
          const imageOpts = {
            model: model?.lingkeModel || chat.currentModel,
            ...apiParams
          };

          if (refImageUrl && refImageUrl.startsWith('data:')) {
            imageOpts.image_url = refImageUrl;
          } else if (refImageUrl && refImageUrl.startsWith('http')) {
            imageOpts.image_url = refImageUrl;
          }

          result = await imageGenerator.generate(currentPrompt, imageOpts);

          if (result.success) {
            const items = (result.images || []).map((item, idx) => ({
              id: `gen_${Date.now()}_${idx}`, type: 'image', url: item.url || item, prompt: currentPrompt, model: model?.name
            }));
            chat.addAssistantMessage(`已生成 ${items.length} 个结果`, 'image', items);
            showToast('success', `${model?.name} 返回 ${items.length} 个结果`);
          } else {
            const fallbackInfo = result.fallbackModel ? `\n\n💡 建议切换到模型：${result.fallbackModel}` : '';
            const classified = classifyError({ message: result.error || '图片生成失败，请检查API连接', error: result.error });
            showToast(classified.type, classified.message + fallbackInfo);
          }
        }
      }
    } catch (err) {
      console.error('Generation error:', err);
      const classified = classifyError(err);
      showToast(classified.type, classified.message);
    } finally {
      chat.setIsGenerating(false);
    }
  }, [prompt, chat, activeCategory, modelParams, upload, refImageUrl, buildApiParams, psdMode, psdNumColors, psdIgnoreColor, showToast]);

  const canSend = () => {
    if (chat.isGenerating) return false;
    if (activeCategory === 'psdLayer') return !!(refImageUrl || (upload?.files?.length > 0));
    return !!prompt.trim();
  };

  const imageOnlyItems = galleryItems.filter(it => it.type === 'image');

  return (
    <div className="creativeHubFlow">
      {toast && (
        <div className={`hubToast toast_${toast.type}`} key={toast.key}>
          <span className="hubToastIcon">
            {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          </span>
          <span className="hubToastMsg">{toast.message}</span>
          <button className="hubToastClose" onClick={() => setToast(null)}>
            <X size={12} />
          </button>
        </div>
      )}

      {lightboxOpen && (
        <ImageLightbox
          items={imageOnlyItems}
          currentIndex={lightboxIndex}
          onClose={handleCloseLightbox}
          onPrev={handleLightboxPrev}
          onNext={handleLightboxNext}
          onDownload={handleLightboxDownload}
          onFavorite={handleFavorite}
          onFlag={handleFlag}
          onUseReference={handleUseAsReference}
        />
      )}

      {flagDialogItem && (
        <FlagDialog
          item={flagDialogItem}
          onConfirm={handleFlagConfirm}
          onCancel={handleFlagCancel}
        />
      )}

      {showPricing && (
        <ChannelGroupSelector
          modelName={chat.currentModel}
          currentParams={modelParams}
          onClose={() => setShowPricing(false)}
          onProfileChange={() => {}}
        />
      )}

      <CreativeDock
        activeCategory={activeCategory}
        onCategoryChange={handleCategoryChange}
        currentModel={chat.currentModel}
        onModelChange={handleModelChange}
      />

      <div className="creativeHubFlowMain">
        <button
          className={`assetToggleBtn ${showAssetPanel ? 'active' : ''}`}
          onClick={() => setShowAssetPanel(!showAssetPanel)}
          title="资产面板"
        >
          <Archive size={18} />
          {(store.favorites.length > 0 || store.flagged.length > 0) && (
            <span className="assetToggleBadge">
              {store.favorites.length + store.flagged.length}
            </span>
          )}
        </button>

        {showAssetPanel && (
          <div className="assetPanelWrapper">
            <AssetPanel
              favorites={store.favorites}
              flagged={store.flagged}
              onClose={() => setShowAssetPanel(false)}
              onUseReference={handleAssetUseRef}
              onUsePrompt={handleAssetUsePrompt}
              onRemoveFavorite={store.removeFavorite}
              onFlagRetry={handleFlagRetry}
              onFlagDismiss={handleFlagDismiss}
            />
          </div>
        )}

        {activeCategory === 'psdLayer' && (
          <div className="flowPsdMode">
            <button className={`psdModeBtn ${psdMode === 'smart' ? 'selected' : ''}`} onClick={() => setPsdMode('smart')}>
              <Scissors size={14} /><span>智能拆层</span>
            </button>
            <button className={`psdModeBtn ${psdMode === 'color-split' ? 'selected' : ''}`} onClick={() => setPsdMode('color-split')}>
              <Palette size={14} /><span>颜色拆层</span>
            </button>
            <button className={`psdModeBtn ${psdMode === 'assemble' ? 'selected' : ''}`} onClick={() => setPsdMode('assemble')}>
              <LayoutGrid size={14} /><span>多图组装</span>
            </button>
          </div>
        )}

        <MasonryGallery
          items={galleryItems}
          onDownload={handleDownload}
          onSendToVideo={handleSendToVideo}
          onUseAsReference={handleUseAsReference}
          onUsePrompt={handleUsePrompt}
          onFavorite={handleFavorite}
          onFlag={handleFlag}
          onOpenLightbox={handleOpenLightbox}
          isFavorited={store.isFavorited}
          isFlagged={store.isFlagged}
          onBatchDownload={handleBatchDownload}
          onBatchFavorite={handleBatchFavorite}
          onBatchReference={handleBatchReference}
        />

        <FloatingCommandBar
          prompt={prompt}
          onPromptChange={setPrompt}
          onSend={handleSend}
          onFileUpload={handleFileUpload}
          currentModel={chat.currentModel}
          currentCategory={activeCategory}
          onModelChange={handleModelChange}
          modelParams={modelParams}
          onParamChange={handleParamChange}
          isGenerating={chat.isGenerating}
          refImageUrl={refImageUrl}
          onRemoveRef={handleRemoveRef}
          canSend={canSend()}
          onOpenPricing={() => setShowPricing(true)}
        />
      </div>

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