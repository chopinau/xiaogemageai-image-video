import React from 'react';
import { Image, Video, Wand2, Layers } from 'lucide-react';
import { ModelLogo } from './ModelLogo';
import { getModelsByCategory, getModelById } from '../config/models';

const FEATURE_CARDS = [
  {
    key: 'image',
    icon: Image,
    label: '图片生成',
    desc: '文生图 / 图生图',
    color: '#42e6ff',
    gradient: 'linear-gradient(135deg, rgba(66,230,255,0.12), rgba(120,255,185,0.06))'
  },
  {
    key: 'video',
    icon: Video,
    label: '视频生成',
    desc: '文生视频 / 图生视频',
    color: '#f9ff72',
    gradient: 'linear-gradient(135deg, rgba(249,255,114,0.12), rgba(255,180,50,0.06))'
  },
  {
    key: 'retouch',
    icon: Wand2,
    label: '图片精修',
    desc: '智能编辑 / 背景替换',
    color: '#ff4aa6',
    gradient: 'linear-gradient(135deg, rgba(255,74,166,0.12), rgba(255,150,100,0.06))'
  },
  {
    key: 'psdLayer',
    icon: Layers,
    label: 'PSD分层',
    desc: 'AI抠图 + 背景补全',
    color: '#a78bfa',
    gradient: 'linear-gradient(135deg, rgba(167,139,250,0.12), rgba(139,92,246,0.06))'
  }
];

const QUICK_PROMPTS = [
  { text: '赛博朋克猫咪', category: 'image' },
  { text: '日落海滩电影感', category: 'image' },
  { text: '雪山木屋冬季', category: 'image' },
  { text: '花间少女水彩风', category: 'image' },
  { text: '城市夜景延时摄影', category: 'video' },
  { text: '海底世界探索', category: 'video' }
];

const RECOMMEND_MODELS = [
  { id: 'gpt-image-2', category: 'image' },
  { id: 'kling', category: 'video' },
  { id: 'veo3', category: 'video' }
];

export function HeroShowcase({ onSelectFeature, onQuickPrompt }) {
  return (
    <div className="heroShowcase">
      <div className="heroSection">
        <div className="heroGlowOrb cyan" />
        <div className="heroGlowOrb purple" />

        <div className="heroIcon">
          <div className="heroIconRing" />
          <div className="heroIconInner">✨</div>
        </div>

        <h2 className="heroTitle">AI 创作工作台</h2>
        <p className="heroSubtitle">一站式图片 & 视频创作，多模型自由切换</p>
      </div>

      <div className="heroFeatureGrid">
        {FEATURE_CARDS.map(card => {
          const Icon = card.icon;
          const modelCount = getModelsByCategory(card.key).length;
          return (
            <div
              key={card.key}
              className="heroFeatureCard"
              onClick={() => onSelectFeature(card.key)}
              style={{ '--card-color': card.color, '--card-gradient': card.gradient }}
            >
              <div className="heroFeatureIcon">
                <Icon size={24} />
              </div>
              <div className="heroFeatureLabel">{card.label}</div>
              <div className="heroFeatureDesc">{card.desc}</div>
              <div className="heroFeatureCount">{modelCount} 个模型</div>
              <button className="heroFeatureBtn">开始创作</button>
            </div>
          );
        })}
      </div>

      <div className="heroQuickPrompts">
        <span className="heroQuickLabel">💡 试试这些提示词：</span>
        <div className="heroQuickTags">
          {QUICK_PROMPTS.map(p => (
            <span
              key={p.text}
              className="heroQuickTag"
              onClick={() => onQuickPrompt?.(p.text, p.category)}
            >
              {p.text}
            </span>
          ))}
        </div>
      </div>

      <div className="heroModelRecommend">
        <div className="heroModelRecommendLabel">🏆 模型推荐</div>
        <div className="heroModelCards">
          {RECOMMEND_MODELS.map(rec => {
            const model = getModelById(rec.id, rec.category);
            if (!model) return null;
            const price = model.pricing.perImage
              ? `${model.pricing.perImage}积分/张`
              : model.pricing.perSecond
                ? `${model.pricing.perSecond}积分/秒`
                : '';
            return (
              <div
                key={rec.id}
                className="heroModelCard"
                onClick={() => onSelectFeature(rec.category)}
                style={{ '--brand-color': getModelBrandColor(model.provider) }}
              >
                <ModelLogo provider={model.provider} size={28} />
                <div className="heroModelCardInfo">
                  <div className="heroModelCardName">{model.name}</div>
                  <div className="heroModelCardPrice">{price}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function getModelBrandColor(provider) {
  const colors = {
    'OpenAI': '#10a37f',
    'ByteDance': '#00d4ff',
    'Black Forest Labs': '#8b5cf6',
    'Stability AI': '#f97316',
    'Google': '#4285f4',
    'Kuaishou': '#ff2c55',
    'Runway': '#a855f7',
    'MiniMax': '#3b82f6',
    'Luma': '#22d3ee',
    'DeepSeek': '#2563eb',
    'fal.ai': '#ec4899'
  };
  return colors[provider] || '#42e6ff';
}
