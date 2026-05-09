import React from 'react';
import { Image, Video, Wand2, Layers } from 'lucide-react';
import { getModelsByCategory } from '../config/models';

const FEATURE_CARDS = [
  {
    key: 'image',
    icon: Image,
    label: '图片生成',
    desc: '文生图 / 图生图',
    color: '#42e6ff',
    gradient: 'linear-gradient(135deg, rgba(66,230,255,0.15), rgba(120,255,185,0.08))'
  },
  {
    key: 'video',
    icon: Video,
    label: '视频生成',
    desc: '文生视频 / 图生视频',
    color: '#f9ff72',
    gradient: 'linear-gradient(135deg, rgba(249,255,114,0.15), rgba(255,180,50,0.08))'
  },
  {
    key: 'retouch',
    icon: Wand2,
    label: '图片精修',
    desc: '智能编辑 / 背景替换',
    color: '#ff4aa6',
    gradient: 'linear-gradient(135deg, rgba(255,74,166,0.15), rgba(255,150,100,0.08))'
  },
  {
    key: 'psdLayer',
    icon: Layers,
    label: 'PSD分层',
    desc: 'AI抠图 + 背景补全',
    color: '#a78bfa',
    gradient: 'linear-gradient(135deg, rgba(167,139,250,0.15), rgba(139,92,246,0.08))'
  }
];

const QUICK_PROMPTS = [
  '赛博朋克猫咪',
  '日落海滩电影感',
  '雪山木屋冬季',
  '花间少女水彩风'
];

export function WelcomeCard({ onSelectFeature }) {
  return (
    <div className="welcomeCardFinal">
      <div className="welcomeHero">
        <div className="welcomeHeroIcon">
          <span className="welcomeHeroGlow" />
          <span className="welcomeHeroEmoji">✨</span>
        </div>
        <h2>AI 创作工作台</h2>
        <p>一站式图片 & 视频创作，选择功能开始</p>
      </div>

      <div className="welcomeFeatureGrid">
        {FEATURE_CARDS.map(card => {
          const Icon = card.icon;
          const modelCount = getModelsByCategory(card.key).length;
          return (
            <div
              key={card.key}
              className="welcomeFeatureCard"
              onClick={() => onSelectFeature(card.key)}
              style={{ '--card-color': card.color, '--card-gradient': card.gradient }}
            >
              <div className="welcomeFeatureIcon">
                <Icon size={24} />
              </div>
              <div className="welcomeFeatureLabel">{card.label}</div>
              <div className="welcomeFeatureDesc">{card.desc}</div>
              <div className="welcomeFeatureCount">{modelCount} 个模型</div>
              <button className="welcomeFeatureBtn">开始创作</button>
            </div>
          );
        })}
      </div>

      <div className="welcomeQuickPrompts">
        <span className="welcomeQuickLabel">💡 试试这些提示词：</span>
        <div className="welcomeQuickTags">
          {QUICK_PROMPTS.map(p => (
            <span key={p} className="welcomeQuickTag">{p}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
