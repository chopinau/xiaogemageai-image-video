export const API_KEY_PROFILES = {
  economy: {
    id: 'economy',
    label: '经济优先',
    icon: '💰',
    description: '自动选择最低价格渠道，适合批量生成',
    strategy: '价格优先',
    key: import.meta.env.VITE_API_KEY_ECONOMY || '',
    color: '#34d399'
  },
  balanced: {
    id: 'balanced',
    label: '均衡模式',
    icon: '⚖️',
    description: '自动选择成功率最高渠道，性价比最优',
    strategy: '成功率优先',
    key: import.meta.env.VITE_API_KEY_BALANCED || '',
    color: '#42e6ff'
  },
  premium: {
    id: 'premium',
    label: '品质优先',
    icon: '⚡',
    description: '自动选择最快响应渠道，适合急需场景',
    strategy: '速度优先',
    key: import.meta.env.VITE_API_KEY_PREMIUM || '',
    color: '#fbbf24'
  }
};

export function getActiveProfile() {
  const saved = localStorage.getItem('api_key_profile');
  if (saved && API_KEY_PROFILES[saved]) return API_KEY_PROFILES[saved];
  return API_KEY_PROFILES.balanced;
}

export function setActiveProfile(profileId) {
  if (API_KEY_PROFILES[profileId]) {
    localStorage.setItem('api_key_profile', profileId);
  }
}

export function getApiKeyForProfile(profileId) {
  const profile = API_KEY_PROFILES[profileId];
  return profile?.key || '';
}