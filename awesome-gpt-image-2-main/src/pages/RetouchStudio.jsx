import React, { useState, useCallback } from 'react';
import { Image, PenTool, Settings, WandSparkles } from 'lucide-react';
import { FileUpload } from '../components/FileUpload';
import { TextAreaWithCount } from '../components/TextAreaWithCount';
import { SelectDropdown } from '../components/SelectDropdown';
import { RadioGroup } from '../components/RadioGroup';
import { GenerateButton } from '../components/GenerateButton';
import { ImageCompareView } from '../components/ImageCompareView';
import { ProgressBar } from '../components/ProgressBar';
import { useFileUpload } from '../hooks/useFileUpload';
import { ASPECT_RATIOS, RESOLUTIONS, BACKGROUND_OPTIONS, CREDITS, RETOUCH_EXAMPLES } from '../config/constants';
import { getModelOptions } from '../config/models';

export function RetouchStudio({ language }) {
  const [retouchReq, setRetouchReq] = useState('');
  const [aiModel, setAiModel] = useState('gpt-image-2-retouch');
  const [aspectRatio, setAspectRatio] = useState('original');
  const [resolution, setResolution] = useState('1k');
  const [background, setBackground] = useState('white');
  const [isRetouching, setIsRetouching] = useState(false);
  const [progress, setProgress] = useState(0);
  const [retouchResults, setRetouchResults] = useState(null);

  const upload = useFileUpload({ accept: 'image/jpeg,image/png', maxCount: 5 });
  const canRetouch = upload.hasFiles;

  const handleRetouch = useCallback(async () => {
    if (!canRetouch) return;
    setIsRetouching(true);
    setProgress(0);
    setTimeout(() => setProgress(40), 800);
    setTimeout(() => setProgress(75), 2000);
    setTimeout(() => {
      setProgress(100);
      setIsRetouching(false);
      setRetouchResults(
        upload.previews.map((p, i) => ({
          id: p.id,
          original: p.url,
          retouched: `/images/case${(i * 7 + 10) % 50 + 1}.jpg`
        }))
      );
    }, 3500);
  }, [canRetouch, upload.previews]);

  const handleDownload = useCallback(() => {
    retouchResults?.forEach((item) => {
      const a = document.createElement('a');
      a.href = item.retouched;
      a.download = `retouched-${item.id}.jpg`;
      a.click();
    });
  }, [retouchResults]);

  const handleRegenerate = useCallback(() => {
    setRetouchResults(null);
    setProgress(0);
  }, []);

  const [currentCompare, setCurrentCompare] = useState(0);
  const modelOptions = getModelOptions('retouch');

  return (
    <div className="sharedSection">
      <div className="pageHeader">
        <h1>图片精修工作室</h1>
        <p className="subtitle">上传产品图片与精修要求，AI 先分析问题和处理方向，再批量输出精修结果</p>
      </div>

      <div className="twoColumnLayout">
        <div className="paramPanel">
          <FileUpload
            label="产品图上传"
            icon={Image}
            previews={upload.previews}
            isDragging={upload.isDragging}
            error={upload.error}
            inputRef={upload.inputRef}
            maxCount={5}
            onDragOver={upload.handleDragOver}
            onDragLeave={upload.handleDragLeave}
            onDrop={upload.handleDrop}
            onClick={upload.handleClick}
            onChange={upload.handleChange}
            onRemove={upload.removeFile}
            hint="支持 JPG/PNG 格式，最多 5 张图片"
          />

          <TextAreaWithCount
            label="精修要求"
            icon={PenTool}
            value={retouchReq}
            onChange={setRetouchReq}
            maxLength={500}
            placeholder="描述精修需求，如去除背景杂物、增强产品光泽、修复划痕..."
            example={RETOUCH_EXAMPLES[Math.floor(Math.random() * RETOUCH_EXAMPLES.length)]}
          />

          <div className="paramSection">
            <div className="paramLabel"><Settings size={16} />生成参数配置</div>
            <SelectDropdown value={aiModel} onChange={setAiModel} options={modelOptions} label="AI 模型" />
            <SelectDropdown value={aspectRatio} onChange={setAspectRatio} options={ASPECT_RATIOS.retouch} label="图片宽高比" />
            <RadioGroup value={resolution} onChange={setResolution} options={RESOLUTIONS} label="图片分辨率" />
            <SelectDropdown value={background} onChange={setBackground} options={BACKGROUND_OPTIONS} label="背景设置" />
          </div>

          <GenerateButton
            onClick={handleRetouch}
            disabled={!canRetouch}
            loading={isRetouching}
            label="开始精修"
            loadingLabel="精修中..."
            credits={CREDITS.retouch.perImage * upload.fileCount}
          />
        </div>

        <div className="resultPanel">
          {!retouchResults && !isRetouching && (
            <div className="resultEmpty">
              <WandSparkles size={48} />
              <p>上传产品图片后<br />点击左侧「开始精修」按钮查看精修效果</p>
            </div>
          )}

          {isRetouching && (
            <div className="resultLoading">
              <div className="loadingSpinner" />
              <ProgressBar progress={progress} />
              <div className="loadingText">AI 正在分析并精修图片...</div>
            </div>
          )}

          {retouchResults && retouchResults.length > 0 && (
            <div>
              {retouchResults.length > 1 && (
                <div style={{ display: 'flex', gap: '8px', padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  {retouchResults.map((item, index) => (
                    <button
                      key={item.id}
                      onClick={() => setCurrentCompare(index)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: currentCompare === index ? '1px solid rgba(103,232,249,0.6)' : '1px solid rgba(255,255,255,0.1)',
                        background: currentCompare === index ? 'rgba(103,232,249,0.1)' : 'transparent',
                        color: currentCompare === index ? '#9eeeff' : '#73859f',
                        fontSize: '13px',
                        cursor: 'pointer',
                        fontFamily: 'inherit'
                      }}
                    >
                      图片 {index + 1}
                    </button>
                  ))}
                </div>
              )}
              <ImageCompareView
                original={retouchResults[currentCompare]?.original}
                retouched={retouchResults[currentCompare]?.retouched}
                onDownload={() => {
                  const item = retouchResults[currentCompare];
                  const a = document.createElement('a');
                  a.href = item.retouched;
                  a.download = `retouched-${item.id}.jpg`;
                  a.click();
                }}
                onRegenerate={handleRegenerate}
                onBatchDownload={handleDownload}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
