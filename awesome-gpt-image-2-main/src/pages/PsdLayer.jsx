import React, { useState, useCallback, useRef } from 'react';
import { Image, Layers, Download, WandSparkles, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { FileUpload } from '../components/FileUpload';
import { GenerateButton } from '../components/GenerateButton';
import { ProgressBar } from '../components/ProgressBar';
import { useFileUpload } from '../hooks/useFileUpload';
import { psdLayerGenerator } from '../services/psdLayerGenerator';

const STEPS = [
  { key: 'remove-bg', label: 'AI抠图', icon: '✂️' },
  { key: 'inpaint', label: '背景补全', icon: '🎨' },
  { key: 'build-psd', label: 'PSD打包', icon: '📦' }
];

export function PsdLayer({ language }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState('');
  const [stepProgress, setStepProgress] = useState({});
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [taskId, setTaskId] = useState(null);
  const eventSourceRef = useRef(null);

  const upload = useFileUpload({ accept: 'image/jpeg,image/png,image/webp', maxCount: 1 });
  const canProcess = upload.hasFiles && !isProcessing;

  const handleProcess = useCallback(async () => {
    if (!canProcess || !upload.files || upload.files.length === 0) return;

    setIsProcessing(true);
    setError(null);
    setResult(null);
    setStepProgress({});
    setCurrentStep('upload');

    try {
      const response = await psdLayerGenerator.processImage(upload.files[0]);

      if (!response.success) {
        setError(response.error || '处理失败');
        setIsProcessing(false);
        return;
      }

      const newTaskId = response.taskId;
      setTaskId(newTaskId);
      setCurrentStep('remove-bg');

      psdLayerGenerator.listenProgress(newTaskId, (data) => {
        if (data.step && data.step !== 'done') {
          setCurrentStep(data.step);
          setStepProgress(prev => ({
            ...prev,
            [data.step]: data.status === 'completed' ? 'completed' : 'processing'
          }));
        }

        if (data.step === 'done' || data.status === 'completed' || data.status === 'failed') {
          if (data.success === false || data.status === 'failed') {
            setError(data.error || '处理失败');
            setIsProcessing(false);
            return;
          }

          setResult({
            foregroundUrl: data.foregroundUrl,
            backgroundUrl: data.backgroundUrl
          });
          setStepProgress({
            'remove-bg': 'completed',
            'inpaint': 'completed',
            'build-psd': 'completed'
          });
          setIsProcessing(false);
        }
      });
    } catch (err) {
      setError(err.message || '请求失败');
      setIsProcessing(false);
    }
  }, [canProcess, upload.files]);

  const handleDownload = useCallback(() => {
    if (!taskId) return;
    psdLayerGenerator.downloadPSD(taskId);
  }, [taskId]);

  const handleReset = useCallback(() => {
    setResult(null);
    setError(null);
    setStepProgress({});
    setCurrentStep('');
    setTaskId(null);
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  const overallProgress = Object.values(stepProgress).filter(s => s === 'completed').length / STEPS.length * 100;

  return (
    <div className="sharedSection">
      <div className="pageHeader">
        <h1>PSD 智能分层</h1>
        <p className="subtitle">上传图片，AI 自动抠图 + 补全背景 + 打包分层 PSD，一键获取可编辑的 Photoshop 文件</p>
      </div>

      <div className="twoColumnLayout">
        <div className="paramPanel">
          <FileUpload
            label="图片上传"
            icon={Image}
            previews={upload.previews}
            isDragging={upload.isDragging}
            error={upload.error}
            inputRef={upload.inputRef}
            maxCount={1}
            onDragOver={upload.handleDragOver}
            onDragLeave={upload.handleDragLeave}
            onDrop={upload.handleDrop}
            onClick={upload.handleClick}
            onChange={upload.handleChange}
            onRemove={upload.removeFile}
            hint="支持 JPG/PNG/WebP 格式，建议 ≤ 5MB"
          />

          <div className="paramSection">
            <div className="paramLabel"><Layers size={16} />处理流程</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '8px 0' }}>
              {STEPS.map((step, idx) => {
                const status = stepProgress[step.key];
                return (
                  <div
                    key={step.key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: status === 'completed'
                        ? 'rgba(34,197,94,0.08)'
                        : currentStep === step.key
                          ? 'rgba(103,232,249,0.08)'
                          : 'rgba(255,255,255,0.03)',
                      border: status === 'completed'
                        ? '1px solid rgba(34,197,94,0.2)'
                        : currentStep === step.key
                          ? '1px solid rgba(103,232,249,0.2)'
                          : '1px solid rgba(255,255,255,0.06)',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <span style={{ fontSize: '18px' }}>{step.icon}</span>
                    <span style={{
                      flex: 1,
                      fontSize: '13px',
                      color: status === 'completed' ? '#4ade80' : currentStep === step.key ? '#9eeeff' : '#73859f'
                    }}>
                      {step.label}
                    </span>
                    {status === 'completed' && <CheckCircle size={16} color="#4ade80" />}
                    {status === 'processing' && <Loader size={16} color="#67e8f9" className="spin" />}
                  </div>
                );
              })}
            </div>
          </div>

          <GenerateButton
            onClick={handleProcess}
            disabled={!canProcess}
            loading={isProcessing}
            label="生成分层 PSD"
            loadingLabel="处理中..."
            credits={15}
          />
        </div>

        <div className="resultPanel">
          {!result && !isProcessing && !error && (
            <div className="resultEmpty">
              <Layers size={48} />
              <p>上传图片后<br />点击左侧「生成分层 PSD」按钮<br />AI 将自动完成抠图、补全背景、打包 PSD</p>
            </div>
          )}

          {isProcessing && (
            <div className="resultLoading">
              <div className="loadingSpinner" />
              <ProgressBar progress={overallProgress} />
              <div className="loadingText" style={{ marginTop: '12px' }}>
                {currentStep === 'upload' && '上传原图中...'}
                {currentStep === 'remove-bg' && 'AI 抠图中，提取主体...'}
                {currentStep === 'generate-mask' && '生成遮罩中...'}
                {currentStep === 'inpaint' && 'AI 补全背景中...'}
                {currentStep === 'build-psd' && '打包 PSD 文件中...'}
              </div>
            </div>
          )}

          {error && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px',
              padding: '40px',
              textAlign: 'center'
            }}>
              <AlertCircle size={48} color="#f87171" />
              <p style={{ color: '#f87171', fontSize: '14px' }}>{error}</p>
              <button
                onClick={handleReset}
                style={{
                  padding: '8px 20px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.15)',
                  background: 'rgba(255,255,255,0.05)',
                  color: '#e0e0e0',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontFamily: 'inherit'
                }}
              >
                重新尝试
              </button>
            </div>
          )}

          {result && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <CheckCircle size={20} color="#4ade80" />
                <span style={{ fontSize: '16px', fontWeight: 600, color: '#e0e0e0' }}>分层完成</span>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px'
              }}>
                {result.foregroundUrl && (
                  <div style={{
                    borderRadius: '10px',
                    overflow: 'hidden',
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'repeating-conic-gradient(rgba(255,255,255,0.05) 0% 25%, transparent 0% 50%) 50% / 16px 16px'
                  }}>
                    <img
                      src={result.foregroundUrl}
                      alt="主体图层"
                      style={{ width: '100%', display: 'block' }}
                    />
                    <div style={{ padding: '8px 10px', fontSize: '12px', color: '#73859f', background: 'rgba(0,0,0,0.3)' }}>
                      ✂️ 主体图层（透明背景）
                    </div>
                  </div>
                )}

                {result.backgroundUrl && (
                  <div style={{
                    borderRadius: '10px',
                    overflow: 'hidden',
                    border: '1px solid rgba(255,255,255,0.08)'
                  }}>
                    <img
                      src={result.backgroundUrl}
                      alt="背景图层"
                      style={{ width: '100%', display: 'block' }}
                    />
                    <div style={{ padding: '8px 10px', fontSize: '12px', color: '#73859f', background: 'rgba(0,0,0,0.3)' }}>
                      🎨 背景图层（AI补全）
                    </div>
                  </div>
                )}
              </div>

              <div style={{
                display: 'flex',
                gap: '10px',
                marginTop: '8px'
              }}>
                <button
                  onClick={handleDownload}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '12px 20px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #67e8f9, #22d3ee)',
                    color: '#0f172a',
                    fontWeight: 600,
                    fontSize: '14px',
                    cursor: 'pointer',
                    fontFamily: 'inherit'
                  }}
                >
                  <Download size={18} />
                  下载分层 PSD
                </button>

                <button
                  onClick={handleReset}
                  style={{
                    padding: '12px 20px',
                    borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,0.12)',
                    background: 'rgba(255,255,255,0.05)',
                    color: '#e0e0e0',
                    fontSize: '14px',
                    cursor: 'pointer',
                    fontFamily: 'inherit'
                  }}
                >
                  重新处理
                </button>
              </div>

              <div style={{
                padding: '12px',
                borderRadius: '8px',
                background: 'rgba(103,232,249,0.06)',
                border: '1px solid rgba(103,232,249,0.15)',
                fontSize: '12px',
                color: '#73859f',
                lineHeight: 1.6
              }}>
                💡 PSD 文件包含三个图层：原始图层、主体图层（透明背景）、背景图层（AI补全），可在 Photoshop 中自由编辑。
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
