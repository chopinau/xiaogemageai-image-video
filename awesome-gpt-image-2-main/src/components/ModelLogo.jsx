import React from 'react';

const BRAND_CONFIG = {
  'OpenAI': {
    color: '#10a37f',
    bgColor: 'rgba(16, 163, 127, 0.15)',
    svg: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM2.59 19.208a4.47 4.47 0 0 1-.535-3.014l.145.087 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L8.29 21.97A4.5 4.5 0 0 1 2.59 19.207zm-1.017-8.236a4.483 4.483 0 0 1 2.377-1.967v.166l-4.78 2.758a.766.766 0 0 1-.78 0L.305 8.45V5.79a4.5 4.5 0 0 1 1.27-5.257zm16.596-3.855L12.33 3.74a.776.776 0 0 0-.78 0L5.71 7.11a.805.805 0 0 0-.388.69v6.73a.81.81 0 0 0 .388.686l5.84 3.37a.776.776 0 0 0 .78 0l5.84-3.37a.805.805 0 0 0 .388-.686V7.8a.796.796 0 0 0-.388-.686zM8.306 14.31l-2.02-1.164a.088.088 0 0 1-.038-.057V6.506a.076.076 0 0 1 .038-.053l2.02-1.165a.074.074 0 0 1 .076 0l2.02 1.167a.076.076 0 0 1 .038.053v6.583a.09.09 0 0 1-.038.057l-2.02 1.164a.076.076 0 0 1-.076 0zm14.885-3.817A4.485 4.485 0 0 1 20.41 16.46l-4.82-2.78a.776.776 0 0 1-.388-.674V6.273a.795.795 0 0 1 .388-.682l4.83-2.782a.771.771 0 0 1 .78 0 4.485 4.485 0 0 1 2.386 1.965z" fill="currentColor"/>
      </svg>
    )
  },
  'ByteDance': {
    color: '#00d4ff',
    bgColor: 'rgba(0, 212, 255, 0.15)',
    svg: (
      <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 2C8.268 2 2 8.268 2 16s6.268 14 14 14 14-6.268 14-14S23.732 2 16 2z" fill="currentColor" opacity="0.15"/>
        <path d="M10 11c0-1.105.895-2 2-2h8c1.105 0 2 .895 2 2v10c0 1.105-.895 2-2 2h-8c-1.105 0-2-.895-2-2V11z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
        <path d="M14 9V7a2 2 0 114 0v2M16 15v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="20" cy="9" r="1.5" fill="currentColor"/>
      </svg>
    )
  },
  'Black Forest Labs': {
    color: '#8b5cf6',
    bgColor: 'rgba(139, 92, 246, 0.15)',
    svg: (
      <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="fluxGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6"/>
            <stop offset="100%" stopColor="#d946ef"/>
          </linearGradient>
        </defs>
        <path d="M16 4c-1.5 0-2.9.4-4.1 1.1C10.7 4.4 9.6 4 8.4 4c-2.2 0-4 1.8-4 4 0 1.2.4 2.3 1.1 3.1C4.4 12.1 4 13.2 4 14.4c0 2.2 1.8 4 4 4 1.2 0 2.3-.4 3.1-1.1.8.7 1.9 1.1 3.1 1.1 2.2 0 4-1.8 4-4 0-1.2-.4-2.3-1.1-3.1.7-.8 1.1-1.9 1.1-3.1 0-2.2-1.8-4-4-4-1.5 0-2.9.4-4.1 1.1" stroke="url(#fluxGrad)" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
        <circle cx="16" cy="16" r="3" fill="url(#fluxGrad)"/>
      </svg>
    )
  },
  'Stability AI': {
    color: '#f97316',
    bgColor: 'rgba(249, 115, 22, 0.15)',
    svg: (
      <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="stabilityGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f97316"/>
            <stop offset="33%" stopColor="#eab308"/>
            <stop offset="66%" stopColor="#22c55e"/>
            <stop offset="100%" stopColor="#3b82f6"/>
          </linearGradient>
        </defs>
        <path d="M16 4L4 12l12 8 12-8L16 4z" fill="url(#stabilityGrad)" opacity="0.3"/>
        <path d="M16 10L8 15l8 5 8-5-8-5z" fill="url(#stabilityGrad)" opacity="0.6"/>
        <path d="M16 14l-4 3 4 2 4-2-4-3z" fill="url(#stabilityGrad)"/>
      </svg>
    )
  },
  'Google': {
    color: '#4285f4',
    bgColor: 'rgba(66, 133, 244, 0.15)',
    svg: (
      <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 4c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12S22.627 4 16 4z" fill="currentColor" opacity="0.1"/>
        <text x="16" y="21" textAnchor="middle" fontSize="14" fontWeight="bold" fill="currentColor">G</text>
      </svg>
    )
  },
  'Kuaishou': {
    color: '#ff2c55',
    bgColor: 'rgba(255, 44, 85, 0.15)',
    svg: (
      <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="32" height="32" rx="8" fill="currentColor" opacity="0.12"/>
        <polygon points="12,10 12,22 20,16" fill="currentColor"/>
      </svg>
    )
  },
  'Runway': {
    color: '#a855f7',
    bgColor: 'rgba(168, 85, 247, 0.15)',
    svg: (
      <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="runwayGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a855f7"/>
            <stop offset="100%" stopColor="#7c3aed"/>
          </linearGradient>
        </defs>
        <rect x="4" y="8" width="24" height="4" rx="2" fill="url(#runwayGrad)"/>
        <rect x="4" y="14" width="20" height="4" rx="2" fill="url(#runwayGrad)" opacity="0.7"/>
        <rect x="4" y="20" width="16" height="4" rx="2" fill="url(#runwayGrad)" opacity="0.4"/>
      </svg>
    )
  },
  'MiniMax': {
    color: '#3b82f6',
    bgColor: 'rgba(59, 130, 246, 0.15)',
    svg: (
      <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="12" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.3"/>
        <path d="M16 8c0 4.418-3.582 8-8 8" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        <path d="M16 24c0-4.418 3.582-8 8-8" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        <circle cx="16" cy="16" r="2" fill="currentColor"/>
      </svg>
    )
  },
  'Luma': {
    color: '#22d3ee',
    bgColor: 'rgba(34, 211, 238, 0.15)',
    svg: (
      <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="lumaGlow" cx="50%" cy="50%">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.4"/>
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0"/>
          </radialGradient>
        </defs>
        <circle cx="16" cy="16" r="12" fill="url(#lumaGlow)"/>
        <circle cx="16" cy="16" r="6" stroke="currentColor" strokeWidth="1.5" fill="none"/>
        <circle cx="16" cy="16" r="2" fill="currentColor"/>
        <line x1="16" y1="4" x2="16" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="16" y1="24" x2="16" y2="28" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="4" y1="16" x2="8" y2="16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="24" y1="16" x2="28" y2="16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    )
  },
  'DeepSeek': {
    color: '#2563eb',
    bgColor: 'rgba(37, 99, 235, 0.15)',
    svg: (
      <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="32" height="32" rx="6" fill="currentColor" opacity="0.1"/>
        <text x="16" y="21" textAnchor="middle" fontSize="15" fontWeight="800" fill="currentColor">DS</text>
      </svg>
    )
  },
  'fal.ai': {
    color: '#ec4899',
    bgColor: 'rgba(236, 72, 153, 0.15)',
    svg: (
      <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="falGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ec4899"/>
            <stop offset="100%" stopColor="#db2777"/>
          </linearGradient>
        </defs>
        <path d="M16 4L4 16l12 12 12-12L16 4z" fill="url(#falGrad)" opacity="0.2"/>
        <path d="M16 8l-6 8h12l-6-8z" fill="url(#falGrad)" opacity="0.6"/>
        <path d="M16 12l-3 4h6l-3-4z" fill="url(#falGrad)"/>
        <line x1="16" y1="4" x2="16" y2="8" stroke="url(#falGrad)" strokeWidth="1.5"/>
      </svg>
    )
  },
  'default': {
    color: '#42e6ff',
    bgColor: 'rgba(66, 230, 255, 0.15)',
    svg: (
      <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="12" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.3"/>
        <path d="M16 10v12M10 16h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    )
  }
};

function getBrandConfig(provider) {
  return BRAND_CONFIG[provider] || BRAND_CONFIG['default'];
}

export function ModelLogo({ provider, size = 24 }) {
  const config = getBrandConfig(provider);
  return (
    <div
      className="modelLogo"
      style={{
        width: size,
        height: size,
        minWidth: size,
        color: config.color
      }}
      title={provider}
    >
      {config.svg}
    </div>
  );
}

export { BRAND_CONFIG };
