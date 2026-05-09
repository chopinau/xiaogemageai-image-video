import React from 'react';
import { User, Bot, AlertCircle } from 'lucide-react';
import { ModelLogo } from './ModelLogo';
import { ImageResultCard } from './ImageResultCard';
import { VideoResultCard } from './VideoResultCard';
import { GenerationSkeleton } from './GenerationSkeleton';

export function ChatMessage({ message, onDownload, onCollect, onRegenerate, onEdit, onSendToVideo, onSendToPsd }) {
  const isUser = message.role === 'user';
  const isGenerating = message.status === 'generating';

  return (
    <div className={`chatMsgV2 ${isUser ? 'user' : 'assistant'} ${message.type}`}>
      <div className="chatMsgV2Avatar">
        {isUser ? (
          <div className="avatarUser">
            <User size={16} />
          </div>
        ) : message.model ? (
          <ModelLogo provider={getModelProvider(message.model)} size={32} />
        ) : (
          <div className="avatarBot">
            <Bot size={16} />
          </div>
        )}
      </div>

      <div className="chatMsgV2Body">
        {isUser ? (
          <div className="chatMsgV2Bubble userBubble">{message.content}</div>
        ) : (
          <>
            {message.type === 'error' && (
              <div className="chatMsgV2Error">
                <AlertCircle size={14} />
                <span>{message.content}</span>
              </div>
            )}

            {message.type === 'text' && !isGenerating && (
              <div className="chatMsgV2Bubble assistantBubble">{message.content}</div>
            )}

            {isGenerating && (
              <div className="chatMsgV2Typing">
                <span className="typingDot" />
                <span className="typingDot" />
                <span className="typingDot" />
              </div>
            )}

            {isGenerating && message.type !== 'text' && (
              <GenerationSkeleton type={message.type} count={4} />
            )}

            {message.results && message.results.length > 0 && (
              <div className="chatMsgV2Results">
                <div className="chatMsgV2ResultHeader">
                  <ModelLogo provider={getModelProvider(message.model)} size={18} />
                  <span className="chatMsgV2ResultModel">{getModelName(message.model)}</span>
                  <span className="chatMsgV2ResultCount">
                    {message.results.length} {message.type === 'video' ? '个视频' : '张图片'}
                  </span>
                </div>
                <div className="chatMsgV2ResultGrid">
                  {message.results.map((result, idx) => {
                    if (result.type === 'video' || message.type === 'video') {
                      return (
                        <VideoResultCard
                          key={result.id || idx}
                          result={{ ...result, modelName: getModelName(message.model) }}
                          onDownload={onDownload}
                        />
                      );
                    }
                    return (
                      <ImageResultCard
                        key={result.id || idx}
                        result={result}
                        onDownload={() => onDownload?.(result)}
                        onCollect={() => onCollect?.(result)}
                        onRegenerate={() => onRegenerate?.(result)}
                        onEdit={() => onEdit?.(result)}
                        onSendToVideo={onSendToVideo}
                        onSendToPsd={onSendToPsd}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {message.attachments && message.attachments.length > 0 && (
          <div className="chatMsgV2Attachments">
            {message.attachments.map((att, idx) => (
              <div key={idx} className="chatMsgV2Attach">
                <img src={att.preview || att.url} alt="参考图" />
                <div className="chatMsgV2AttachBadge">参考图</div>
              </div>
            ))}
          </div>
        )}

        <div className="chatMsgV2Time">
          {new Date(message.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
}

function getModelProvider(modelId) {
  const map = {
    'gpt-image-2': 'OpenAI', 'dall-e-3': 'OpenAI',
    'flux-pro': 'Black Forest Labs',
    'doubao-seedream': 'ByteDance', 'doubao-seededit': 'ByteDance',
    'doubao-seededit-retouch': 'ByteDance',
    'stable-diffusion-xl': 'Stability AI',
    'kling': 'Kuaishou', 'veo3': 'Google', 'sora': 'OpenAI',
    'seedance-2.0': 'ByteDance', 'runway-gen3': 'Runway',
    'hailuo': 'MiniMax', 'luma': 'Luma',
    'gpt-4o': 'OpenAI', 'deepseek': 'DeepSeek',
    'bria-rmbg-inpainting': 'fal.ai',
    'gpt-image-2-retouch': 'OpenAI'
  };
  return map[modelId] || 'default';
}

function getModelName(modelId) {
  const map = {
    'gpt-image-2': 'GPT Image 2', 'dall-e-3': 'DALL-E 3',
    'flux-pro': 'Flux Pro',
    'doubao-seedream': '豆包 Seedream', 'doubao-seededit': '豆包 SeedEdit',
    'doubao-seededit-retouch': '豆包 SeedEdit 精修',
    'stable-diffusion-xl': 'SD XL',
    'kling': 'Kling 可灵', 'veo3': 'Veo 3.1', 'sora': 'Sora 2',
    'seedance-2.0': 'Seedance 2.0', 'runway-gen3': 'Runway Gen4',
    'hailuo': '海螺视频', 'luma': 'Luma',
    'gpt-4o': 'GPT-4o', 'deepseek': 'DeepSeek',
    'bria-rmbg-inpainting': 'PSD 智能分层',
    'gpt-image-2-retouch': 'GPT Image 2 精修'
  };
  return map[modelId] || modelId;
}
