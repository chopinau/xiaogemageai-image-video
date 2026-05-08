import React, { useState, useCallback } from 'react';
import { Image, PenTool, Settings, Layers, CheckSquare } from 'lucide-react';
import { StepIndicator } from '../components/StepIndicator';
import { FileUpload } from '../components/FileUpload';
import { TextAreaWithCount } from '../components/TextAreaWithCount';
import { SelectDropdown } from '../components/SelectDropdown';
import { RadioGroup } from '../components/RadioGroup';
import { GenerateButton } from '../components/GenerateButton';
import { ImagePreviewGrid } from '../components/ImagePreviewGrid';
import { ProgressBar } from '../components/ProgressBar';
import { useFileUpload } from '../hooks/useFileUpload';
import { ASPECT_RATIOS, LANGUAGES, RESOLUTIONS, CREDITS, DETAIL_STEPS, DETAIL_PAGE_MODULES } from '../config/constants';
import { getModelOptions } from '../config/models';

export function DetailStudio({ language }) {
  const [currentStep, setCurrentStep] = useState('input');
  const [detailReq, setDetailReq] = useState('');
  const [outputLang, setOutputLang] = useState('zh');
  const [aiModel, setAiModel] = useState('gpt-image-2');
  const [aspectRatio, setAspectRatio] = useState('3:4');
  const [resolution, setResolution] = useState('1k');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [planResult, setPlanResult] = useState(null);
  const [selectedModules, setSelectedModules] = useState([]);
  const [moduleImages, setModuleImages] = useState({});
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);

  const upload = useFileUpload({ accept: 'image/jpeg,image/png', maxCount: 20 });
  const canGenerate = upload.hasFiles;

  const handleGeneratePlan = useCallback(async () => {
    if (!canGenerate) return;
    setIsGenerating(true);
    setProgress(0);
    setTimeout(() => setProgress(50), 1000);
    setTimeout(() => {
      setProgress(100);
      setIsGenerating(false);
      setCurrentStep('plan');
      setPlanResult(DETAIL_PAGE_MODULES);
      setSelectedModules(DETAIL_PAGE_MODULES.map(m => m.id));
    }, 2500);
  }, [canGenerate]);

  const toggleModule = useCallback((id) => {
    setSelectedModules(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  }, []);

  const handleGenerateImages = useCallback(async () => {
    setIsGeneratingImages(true);
    const newImages = {};
    for (const modId of selectedModules) {
      const mod = DETAIL_PAGE_MODULES.find(m => m.id === modId);
      newImages[modId] = {
        id: modId,
        url: `/images/case${Math.floor(Math.random() * 50) + 1}.jpg`,
        alt: mod.name
      };
    }
    setTimeout(() => {
      setModuleImages(newImages);
      setIsGeneratingImages(false);
      setCurrentStep('generate');
    }, 3000);
  }, [selectedModules]);

  const handleDownload = useCallback((img) => {
    const a = document.createElement('a');
    a.href = img.url;
    a.download = `detail-${img.id}.jpg`;
    a.click();
  }, []);

  const handleBatchDownload = useCallback(() => {
    Object.values(moduleImages).forEach((img) => handleDownload(img));
  }, [moduleImages, handleDownload]);

  const modelOptions = getModelOptions('image');
  const allModuleImages = Object.values(moduleImages);

  return (
    <div className="sharedSection">
      <div className="pageHeader">
        <h1>一键生图工作室</h1>
        <p className="subtitle">上传同款商品的多角度参考图，选择详情页模块，AI 先生成详情页规划方案，再按模块出图</p>
        <StepIndicator steps={DETAIL_STEPS} currentStep={currentStep} />
        <div style={{ marginTop: '8px', fontSize: '13px', color: '#73859f' }}>
          单张图片消耗 <strong style={{ color: '#f9ff72' }}>{CREDITS.detailImage.label}</strong>
        </div>
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
            maxCount={20}
            onDragOver={upload.handleDragOver}
            onDragLeave={upload.handleDragLeave}
            onDrop={upload.handleDrop}
            onClick={upload.handleClick}
            onChange={upload.handleChange}
            onRemove={upload.removeFile}
            hint="上传商品多角度参考图，支持批量上传"
          />

          <TextAreaWithCount
            label="细节要求"
            icon={PenTool}
            value={detailReq}
            onChange={setDetailReq}
            maxLength={300}
            placeholder="填写商品品类、核心卖点等辅助生成信息..."
          />

          <div className="paramSection">
            <div className="paramLabel"><Settings size={16} />输出参数配置</div>
            <SelectDropdown value={outputLang} onChange={setOutputLang} options={LANGUAGES} label="输出语言" />
            <SelectDropdown value={aiModel} onChange={setAiModel} options={modelOptions} label="AI 模型" />
            <SelectDropdown value={aspectRatio} onChange={setAspectRatio} options={ASPECT_RATIOS.detailPage} label="图片宽高比" />
            <RadioGroup value={resolution} onChange={setResolution} options={RESOLUTIONS} label="图片分辨率" />
          </div>

          {currentStep === 'input' && (
            <GenerateButton
              onClick={handleGeneratePlan}
              disabled={!canGenerate}
              loading={isGenerating}
              label="生成详情页规划方案"
              loadingLabel="规划中..."
              credits={CREDITS.detailPlan.perPlan}
            />
          )}

          {currentStep === 'plan' && (
            <GenerateButton
              onClick={handleGenerateImages}
              disabled={selectedModules.length === 0}
              loading={isGeneratingImages}
              label={`生成 ${selectedModules.length} 个模块素材`}
              loadingLabel="生成素材中..."
              credits={CREDITS.detailImage.perImage * selectedModules.length}
            />
          )}

          {currentStep === 'generate' && (
            <GenerateButton
              onClick={() => { setCurrentStep('input'); setPlanResult(null); setModuleImages({}); }}
              label="重新开始"
              credits={null}
            />
          )}
        </div>

        <div className="resultPanel">
          {currentStep === 'input' && !isGenerating && (
            <div className="resultEmpty">
              <Layers size={48} />
              <p>上传商品参考图、填写组图要求后<br />点击「生成详情页规划方案」开始操作</p>
            </div>
          )}

          {isGenerating && (
            <div className="resultLoading">
              <div className="loadingSpinner" />
              <ProgressBar progress={progress} />
              <div className="loadingText">AI 正在生成详情页规划方案...</div>
            </div>
          )}

          {currentStep === 'plan' && planResult && (
            <div className="planResult">
              <div style={{ padding: '16px 0', fontSize: '16px', fontWeight: 700, color: '#eef5ff' }}>
                <CheckSquare size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
                详情页模块规划（勾选需要生成素材的模块）
              </div>
              {planResult.map((mod) => (
                <div className="planModule" key={mod.id}>
                  <input
                    type="checkbox"
                    checked={selectedModules.includes(mod.id)}
                    onChange={() => toggleModule(mod.id)}
                  />
                  <div className="planModuleInfo">
                    <h4>{mod.name}</h4>
                    <p>{mod.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {currentStep === 'generate' && isGeneratingImages && (
            <div className="resultLoading">
              <div className="loadingSpinner" />
              <div className="loadingText">正在按模块生成素材图...</div>
            </div>
          )}

          {currentStep === 'generate' && allModuleImages.length > 0 && (
            <ImagePreviewGrid
              images={allModuleImages}
              onDownload={handleDownload}
              onRegenerate={(img) => console.log('regenerate', img)}
              onBatchDownload={handleBatchDownload}
            />
          )}
        </div>
      </div>
    </div>
  );
}
