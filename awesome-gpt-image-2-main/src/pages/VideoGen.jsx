import React, { useState, useCallback } from 'react';
import { Image, Film, Settings, Video, Sparkles, FolderOpen, Clock } from 'lucide-react';
import { TabGroup } from '../components/TabGroup';
import { FileUpload } from '../components/FileUpload';
import { SelectDropdown } from '../components/SelectDropdown';
import { RadioGroup } from '../components/RadioGroup';
import { GenerateButton } from '../components/GenerateButton';
import { VideoPlayer } from '../components/VideoPlayer';
import { ProgressBar } from '../components/ProgressBar';
import { useFileUpload } from '../hooks/useFileUpload';
import { VIDEO_DURATIONS, VIDEO_RESOLUTIONS, AUDIO_OPTIONS, VIDEO_TABS, CREDITS } from '../config/constants';
import { getModelOptions } from '../config/models';

export function VideoGen({ language }) {
  const [activeTab, setActiveTab] = useState('one-click');
  const [aiModel, setAiModel] = useState('seedance-2.0');
  const [duration, setDuration] = useState(8);
  const [videoResolution, setVideoResolution] = useState('1080p');
  const [audioOption, setAudioOption] = useState('none');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [videoResult, setVideoResult] = useState(null);
  const [analyzeDone, setAnalyzeDone] = useState(false);

  const imageUpload = useFileUpload({ accept: 'image/jpeg,image/png', maxCount: 1 });
  const videoUpload = useFileUpload({ accept: 'video/mp4,video/quicktime', maxCount: 1 });

  const canAnalyze = imageUpload.hasFiles || videoUpload.hasFiles;
  const canGenerate = analyzeDone;

  const handleAnalyze = useCallback(async () => {
    if (!canAnalyze) return;
    setIsAnalyzing(true);
    setProgress(0);
    setTimeout(() => setProgress(60), 1000);
    setTimeout(() => {
      setProgress(100);
      setIsAnalyzing(false);
      setAnalyzeDone(true);
    }, 2000);
  }, [canAnalyze]);

  const handleGenerate = useCallback(async () => {
    if (!canGenerate) return;
    setIsGenerating(true);
    setProgress(0);
    setTimeout(() => setProgress(30), 1000);
    setTimeout(() => setProgress(60), 3000);
    setTimeout(() => setProgress(90), 5000);
    setTimeout(() => {
      setProgress(100);
      setIsGenerating(false);
      setVideoResult({
        url: 'https://www.w3schools.com/html/mov_bbb.mp4',
        duration: duration
      });
    }, 7000);
  }, [canGenerate, duration]);

  const handleDownload = useCallback(() => {
    if (!videoResult) return;
    const a = document.createElement('a');
    a.href = videoResult.url;
    a.download = 'generated-video.mp4';
    a.click();
  }, [videoResult]);

  const handleRegenerate = useCallback(() => {
    setVideoResult(null);
    setProgress(0);
  }, []);

  const modelOptions = getModelOptions('video');

  return (
    <div className="sharedSection">
      <div className="pageHeader">
        <h1>上传素材，生成你自己的视频</h1>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginTop: '16px', flexWrap: 'wrap' }}>
          <TabGroup tabs={VIDEO_TABS} activeTab={activeTab} onChange={setActiveTab} />
          <button style={{
            padding: '8px 16px',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '8px',
            background: 'rgba(255,255,255,0.04)',
            color: '#aebcd0',
            fontSize: '14px',
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'inherit'
          }}>
            <Sparkles size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
            看模板
          </button>
          <button style={{
            padding: '8px 20px',
            border: 'none',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #42e6ff, #78ffb9)',
            color: '#06101a',
            fontSize: '14px',
            fontWeight: 800,
            cursor: 'pointer',
            fontFamily: 'inherit'
          }}>
            Cn 视频生成
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div className="dualUpload" style={{ marginBottom: '20px' }}>
          <FileUpload
            label="新主体/产品图"
            icon={Image}
            previews={imageUpload.previews}
            isDragging={imageUpload.isDragging}
            error={imageUpload.error}
            inputRef={imageUpload.inputRef}
            maxCount={1}
            accept="image/jpeg,image/png"
            onDragOver={imageUpload.handleDragOver}
            onDragLeave={imageUpload.handleDragLeave}
            onDrop={imageUpload.handleDrop}
            onClick={imageUpload.handleClick}
            onChange={imageUpload.handleChange}
            onRemove={imageUpload.removeFile}
            hint="支持 JPG/PNG，限 1 张"
          />
          <FileUpload
            label="原视频"
            icon={Film}
            previews={videoUpload.previews}
            isDragging={videoUpload.isDragging}
            error={videoUpload.error}
            inputRef={videoUpload.inputRef}
            maxCount={1}
            accept="video/mp4,video/quicktime"
            onDragOver={videoUpload.handleDragOver}
            onDragLeave={videoUpload.handleDragLeave}
            onDrop={videoUpload.handleDrop}
            onClick={videoUpload.handleClick}
            onChange={videoUpload.handleChange}
            onRemove={videoUpload.removeFile}
            hint="支持 MP4/MOV，时长 4-15 秒"
          />
        </div>

        <GenerateButton
          onClick={handleAnalyze}
          disabled={!canAnalyze}
          loading={isAnalyzing}
          label={canAnalyze ? '开始分析' : '开始分析（请先上传素材）'}
          loadingLabel="分析中..."
          credits={CREDITS.videoAnalyze.perAnalyze}
        />

        <div style={{
          marginTop: '24px',
          padding: '20px',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '12px',
          background: 'rgba(9,15,32,0.68)'
        }}>
          <div className="paramLabel" style={{ marginBottom: '12px' }}><Settings size={16} />参数配置</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <SelectDropdown value={aiModel} onChange={setAiModel} options={modelOptions} label="AI 模型" />
            <SelectDropdown value={duration} onChange={(v) => setDuration(Number(v))} options={VIDEO_DURATIONS} label="视频时长" />
            <SelectDropdown value={videoResolution} onChange={setVideoResolution} options={VIDEO_RESOLUTIONS} label="视频分辨率" />
            <RadioGroup value={audioOption} onChange={setAudioOption} options={AUDIO_OPTIONS} label="音频设置" />
          </div>

          {analyzeDone && !videoResult && (
            <div style={{ marginTop: '16px' }}>
              <GenerateButton
                onClick={handleGenerate}
                disabled={false}
                loading={isGenerating}
                label="生成视频"
                loadingLabel="生成中..."
                credits={CREDITS.videoGenerate.perSecond * duration}
              />
            </div>
          )}
        </div>

        <div style={{
          marginTop: '24px',
          padding: '20px',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '12px',
          background: 'rgba(9,15,32,0.5)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', color: '#eef5ff' }}>Cn 生成结果</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button style={{
                padding: '6px 12px',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '6px',
                background: 'rgba(255,255,255,0.04)',
                color: '#aebcd0',
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontFamily: 'inherit'
              }}>
                <Clock size={14} />后台看最近
              </button>
              <button style={{
                padding: '6px 12px',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '6px',
                background: 'rgba(255,255,255,0.04)',
                color: '#aebcd0',
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontFamily: 'inherit'
              }}>
                <FolderOpen size={14} />素材库
              </button>
            </div>
          </div>

          {isGenerating && (
            <div className="resultLoading">
              <div className="loadingSpinner" />
              <ProgressBar progress={progress} />
              <div className="loadingText">AI 正在生成视频，请稍候...</div>
              <div style={{ fontSize: '12px', color: '#5a6a80', marginTop: '8px' }}>
                步骤：素材分析 → 场景规划 → 视频合成 → 后处理
              </div>
            </div>
          )}

          {!isGenerating && !videoResult && (
            <div className="resultEmpty">
              <Video size={48} />
              <p>上传素材并分析后<br />点击「生成视频」开始制作</p>
            </div>
          )}

          {videoResult && (
            <VideoPlayer
              src={videoResult.url}
              onDownload={handleDownload}
              onRegenerate={handleRegenerate}
              onShare={() => console.log('share video')}
            />
          )}
        </div>
      </div>
    </div>
  );
}
