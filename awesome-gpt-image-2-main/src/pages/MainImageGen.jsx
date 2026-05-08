import React, { useState, useCallback } from 'react';
import { Image, PenTool, Megaphone, Settings, Sparkles } from 'lucide-react';
import { StepIndicator } from '../components/StepIndicator';
import { FileUpload } from '../components/FileUpload';
import { TextAreaWithCount } from '../components/TextAreaWithCount';
import { SelectDropdown } from '../components/SelectDropdown';
import { RadioGroup } from '../components/RadioGroup';
import { GenerateButton } from '../components/GenerateButton';
import { ImagePreviewGrid } from '../components/ImagePreviewGrid';
import { ProgressBar } from '../components/ProgressBar';
import { useFileUpload } from '../hooks/useFileUpload';
import { ASPECT_RATIOS, LANGUAGES, RESOLUTIONS, GENERATE_COUNTS, CREDITS, MAIN_IMAGE_STEPS, PROMOTION_EXAMPLES } from '../config/constants';
import { getModelOptions } from '../config/models';

const MOCK_IMAGES = [
  { id: '1', url: '/images/case1.jpg', alt: '生成结果 1' },
  { id: '2', url: '/images/case2.jpg', alt: '生成结果 2' },
  { id: '3', url: '/images/case17.jpg', alt: '生成结果 3' },
  { id: '4', url: '/images/case334.png', alt: '生成结果 4' }
];

export function MainImageGen({ language }) {
  const [currentStep, setCurrentStep] = useState('input');
  const [designReq, setDesignReq] = useState('');
  const [promotionInfo, setPromotionInfo] = useState('');
  const [outputLang, setOutputLang] = useState('zh');
  const [genCount, setGenCount] = useState(1);
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [aiModel, setAiModel] = useState('gpt-image-2');
  const [resolution, setResolution] = useState('1k');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);

  const upload = useFileUpload({ accept: 'image/jpeg,image/png', maxCount: 10 });

  const canGenerate = upload.hasFiles;

  const handleGenerate = useCallback(async () => {
    if (!canGenerate) return;
    setCurrentStep('generate');
    setIsGenerating(true);
    setProgress(0);

    setTimeout(() => { setCurrentStep('processing'); setProgress(30); }, 500);
    setTimeout(() => setProgress(60), 2000);
    setTimeout(() => setProgress(85), 3500);
    setTimeout(() => {
      setProgress(100);
      setIsGenerating(false);
      setCurrentStep('complete');
      setResults(MOCK_IMAGES.slice(0, genCount));
    }, 5000);
  }, [canGenerate, genCount]);

  const handleDownload = useCallback((img) => {
    const a = document.createElement('a');
    a.href = img.url;
    a.download = `main-image-${img.id}.jpg`;
    a.click();
  }, []);

  const handleRegenerate = useCallback(() => {
    setResults(null);
    setCurrentStep('input');
    setProgress(0);
  }, []);

  const handleBatchDownload = useCallback(() => {
    results?.forEach((img) => handleDownload(img));
  }, [results, handleDownload]);

  const handleBatchDelete = useCallback(() => {
    setResults(null);
    setCurrentStep('input');
  }, []);

  const modelOptions = getModelOptions('image');

  return (
    <div className="sharedSection">
      <div className="pageHeader">
        <h1>主图生成 2.0</h1>
        <p className="subtitle">AI 智能分析产品风格与文案，一键生成专业主图</p>
        <StepIndicator steps={MAIN_IMAGE_STEPS} currentStep={currentStep} />
      </div>

      <div className="twoColumnLayout">
        <div className="paramPanel">
          <FileUpload
            label="产品素材上传"
            icon={Image}
            previews={upload.previews}
            isDragging={upload.isDragging}
            error={upload.error}
            inputRef={upload.inputRef}
            maxCount={10}
            onDragOver={upload.handleDragOver}
            onDragLeave={upload.handleDragLeave}
            onDrop={upload.handleDrop}
            onClick={upload.handleClick}
            onChange={upload.handleChange}
            onRemove={upload.removeFile}
            hint="上传清晰、无背景的商品图，仅上传必要的商品视角或 SKU 图"
          />

          <TextAreaWithCount
            label="设计要求"
            icon={PenTool}
            value={designReq}
            onChange={setDesignReq}
            maxLength={350}
            placeholder="填写产品核心卖点、视觉方向、想要强调的产品亮点，以及对场景、构图、灯光的要求..."
          />

          <TextAreaWithCount
            label="促销信息"
            icon={Megaphone}
            value={promotionInfo}
            onChange={setPromotionInfo}
            maxLength={350}
            placeholder="填写营销活动文案，如折扣信息、活动规则、优惠力度..."
            example={PROMOTION_EXAMPLES[Math.floor(Math.random() * PROMOTION_EXAMPLES.length)]}
          />

          <div className="paramSection">
            <div className="paramLabel"><Settings size={16} />输出参数配置</div>
            <SelectDropdown value={outputLang} onChange={setOutputLang} options={LANGUAGES} label="输出语言" />
            <SelectDropdown value={genCount} onChange={(v) => setGenCount(Number(v))} options={GENERATE_COUNTS} label="生成数量" />
            <SelectDropdown value={aspectRatio} onChange={setAspectRatio} options={ASPECT_RATIOS.mainImage} label="图片宽高比" />
            <SelectDropdown value={aiModel} onChange={setAiModel} options={modelOptions} label="AI 模型" />
            <RadioGroup value={resolution} onChange={setResolution} options={RESOLUTIONS} label="图片分辨率" />
          </div>

          <GenerateButton
            onClick={handleGenerate}
            disabled={!canGenerate}
            loading={isGenerating}
            label="生成主图"
            loadingLabel="生成中..."
            credits={CREDITS.mainImage.perImage * genCount}
          />
        </div>

        <div className="resultPanel">
          {currentStep === 'input' && (
            <div className="resultEmpty">
              <Sparkles size={48} />
              <p>上传商品图、填写设计要求后<br />点击「生成主图」按钮即可开始制作主图</p>
            </div>
          )}

          {(currentStep === 'generate' || currentStep === 'processing') && (
            <div className="resultLoading">
              <div className="loadingSpinner" />
              <ProgressBar progress={progress} />
              <div className="loadingText">AI 正在生成中，请稍候</div>
            </div>
          )}

          {currentStep === 'complete' && results && (
            <ImagePreviewGrid
              images={results}
              onDownload={handleDownload}
              onRegenerate={handleRegenerate}
              onCollect={(img) => console.log('collect', img)}
              onShare={(img) => console.log('share', img)}
              onDelete={(img) => setResults(results.filter(r => r.id !== img.id))}
              onBatchDownload={handleBatchDownload}
              onBatchDelete={handleBatchDelete}
            />
          )}
        </div>
      </div>
    </div>
  );
}
