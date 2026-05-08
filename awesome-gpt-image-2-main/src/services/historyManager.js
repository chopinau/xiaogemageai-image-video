const STORAGE_KEYS = {
  IMAGE_HISTORY: 'ai_image_history',
  VIDEO_HISTORY: 'ai_video_history',
  TEXT_HISTORY: 'ai_text_history',
  USAGE_STATS: 'ai_usage_stats',
  SETTINGS: 'ai_settings'
};

export class HistoryManager {
  constructor() {
    this.history = {
      image: this.loadHistory(STORAGE_KEYS.IMAGE_HISTORY),
      video: this.loadHistory(STORAGE_KEYS.VIDEO_HISTORY),
      text: this.loadHistory(STORAGE_KEYS.TEXT_HISTORY)
    };
    this.usageStats = this.loadUsageStats();
  }

  loadHistory(key) {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  saveHistory(type, items) {
    const key = this.getStorageKey(type);
    try {
      localStorage.setItem(key, JSON.stringify(items));
    } catch (error) {
      console.error('Failed to save history:', error);
    }
  }

  getStorageKey(type) {
    switch (type) {
      case 'image': return STORAGE_KEYS.IMAGE_HISTORY;
      case 'video': return STORAGE_KEYS.VIDEO_HISTORY;
      case 'text': return STORAGE_KEYS.TEXT_HISTORY;
      default: return STORAGE_KEYS.IMAGE_HISTORY;
    }
  }

  addEntry(type, entry) {
    const newEntry = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      ...entry
    };
    this.history[type].unshift(newEntry);
    if (this.history[type].length > 100) {
      this.history[type].pop();
    }
    this.saveHistory(type, this.history[type]);
    return newEntry;
  }

  getHistory(type, limit = 50) {
    return this.history[type].slice(0, limit);
  }

  getEntry(type, id) {
    return this.history[type].find(entry => entry.id === id);
  }

  deleteEntry(type, id) {
    const index = this.history[type].findIndex(entry => entry.id === id);
    if (index !== -1) {
      this.history[type].splice(index, 1);
      this.saveHistory(type, this.history[type]);
      return true;
    }
    return false;
  }

  clearHistory(type) {
    this.history[type] = [];
    this.saveHistory(type, []);
  }

  searchHistory(type, query) {
    const lowerQuery = query.toLowerCase();
    return this.history[type].filter(entry => {
      return entry.prompt?.toLowerCase().includes(lowerQuery) ||
             entry.title?.toLowerCase().includes(lowerQuery);
    });
  }

  loadUsageStats() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.USAGE_STATS);
      return stored ? JSON.parse(stored) : {
        imagesGenerated: 0,
        videosGenerated: 0,
        textGenerated: 0,
        totalCost: 0,
        modelUsage: {},
        dailyUsage: {}
      };
    } catch {
      return {
        imagesGenerated: 0,
        videosGenerated: 0,
        textGenerated: 0,
        totalCost: 0,
        modelUsage: {},
        dailyUsage: {}
      };
    }
  }

  saveUsageStats() {
    try {
      localStorage.setItem(STORAGE_KEYS.USAGE_STATS, JSON.stringify(this.usageStats));
    } catch (error) {
      console.error('Failed to save usage stats:', error);
    }
  }

  recordUsage(type, modelId, cost = 0) {
    const today = new Date().toISOString().split('T')[0];
    
    if (type === 'image') this.usageStats.imagesGenerated++;
    if (type === 'video') this.usageStats.videosGenerated++;
    if (type === 'text') this.usageStats.textGenerated++;
    
    this.usageStats.totalCost += cost;
    this.usageStats.modelUsage[modelId] = (this.usageStats.modelUsage[modelId] || 0) + 1;
    this.usageStats.dailyUsage[today] = (this.usageStats.dailyUsage[today] || 0) + 1;
    
    this.saveUsageStats();
  }

  getUsageStats() {
    return { ...this.usageStats };
  }

  getSettings() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return stored ? JSON.parse(stored) : {
          defaultImageModel: 'gpt-image-2',
          defaultVideoModel: 'sora',
          defaultTextModel: 'gpt-4o',
          language: 'en',
          autoSave: true,
          notifications: true
        };
    } catch {
      return {
        defaultImageModel: 'gpt-image-2',
        defaultVideoModel: 'sora',
        defaultTextModel: 'gpt-4o',
        language: 'en',
        autoSave: true,
        notifications: true
      };
    }
  }

  saveSettings(settings) {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }
}

export const historyManager = new HistoryManager();
