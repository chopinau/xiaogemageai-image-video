import { useState, useCallback, useContext, createContext } from 'react';
import { createImageGenerator } from '../services/imageGenerator';
import { createVideoGenerator } from '../services/videoGenerator';
import { createTextGenerator } from '../services/textGenerator';
import { historyManager } from '../services/historyManager';
import { validateAPIKey } from '../config/api';

const AIContext = createContext(null);

export function AIProvider({ children }) {
  const [apiKey, setApiKeyState] = useState(() => {
    return localStorage.getItem('ai_api_key') || '';
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentImageModel, setCurrentImageModel] = useState('gpt-image-2');
  const [currentVideoModel, setCurrentVideoModel] = useState('sora');
  const [currentTextModel, setCurrentTextModel] = useState('gpt-4o');

  const setApiKey = useCallback((key) => {
    setApiKeyState(key);
    if (key) {
      localStorage.setItem('ai_api_key', key);
    } else {
      localStorage.removeItem('ai_api_key');
    }
  }, []);

  const validateKey = useCallback(() => {
    return validateAPIKey(apiKey);
  }, [apiKey]);

  const generateImage = useCallback(async (prompt, options = {}) => {
    if (!apiKey) {
      setError('Please set your API key first');
      return { success: false, error: 'API key required' };
    }

    setIsLoading(true);
    setError(null);

    try {
      const generator = createImageGenerator(apiKey, currentImageModel);
      const result = await generator.generate(prompt, options);
      
      if (result.success) {
        historyManager.addEntry('image', {
          type: 'image',
          model: currentImageModel,
          prompt,
          images: result.images,
          options
        });
        historyManager.recordUsage('image', currentImageModel, generator.estimateCost(options));
      }
      
      return result;
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, [apiKey, currentImageModel]);

  const generateVideo = useCallback(async (prompt, options = {}) => {
    if (!apiKey) {
      setError('Please set your API key first');
      return { success: false, error: 'API key required' };
    }

    setIsLoading(true);
    setError(null);

    try {
      const generator = createVideoGenerator(apiKey, currentVideoModel);
      const result = await generator.generate(prompt, options);
      
      if (result.success) {
        historyManager.addEntry('video', {
          type: 'video',
          model: currentVideoModel,
          prompt,
          videos: result.videos,
          duration: result.duration,
          options
        });
        historyManager.recordUsage('video', currentVideoModel, generator.estimateCost(options));
      }
      
      return result;
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, [apiKey, currentVideoModel]);

  const generateText = useCallback(async (prompt, options = {}) => {
    if (!apiKey) {
      setError('Please set your API key first');
      return { success: false, error: 'API key required' };
    }

    setIsLoading(true);
    setError(null);

    try {
      const generator = createTextGenerator(apiKey, currentTextModel);
      const result = await generator.generate(prompt, options);
      
      if (result.success) {
        historyManager.addEntry('text', {
          type: 'text',
          model: currentTextModel,
          prompt,
          text: result.text,
          options
        });
        if (result.usage) {
          const cost = generator.estimateCost(
            result.usage.inputTokens || 0,
            result.usage.outputTokens || 0
          );
          historyManager.recordUsage('text', currentTextModel, cost);
        }
      }
      
      return result;
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, [apiKey, currentTextModel]);

  const chat = useCallback(async (messages, options = {}) => {
    if (!apiKey) {
      setError('Please set your API key first');
      return { success: false, error: 'API key required' };
    }

    setIsLoading(true);
    setError(null);

    try {
      const generator = createTextGenerator(apiKey, currentTextModel);
      const result = await generator.chat(messages, options);
      return result;
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, [apiKey, currentTextModel]);

  const clearError = useCallback(() => setError(null), []);

  const value = {
    apiKey,
    setApiKey,
    validateKey,
    isLoading,
    error,
    clearError,
    currentImageModel,
    setCurrentImageModel,
    currentVideoModel,
    setCurrentVideoModel,
    currentTextModel,
    setCurrentTextModel,
    generateImage,
    generateVideo,
    generateText,
    chat,
    historyManager
  };

  return (
    <AIContext.Provider value={value}>
      {children}
    </AIContext.Provider>
  );
}

export function useAI() {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error('useAI must be used within an AIProvider');
  }
  return context;
}

export function useHistory(type) {
  const [history, setHistory] = useState(() => historyManager.getHistory(type));
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(() => {
    setHistory(historyManager.getHistory(type));
  }, [type]);

  const addEntry = useCallback((entry) => {
    historyManager.addEntry(type, entry);
    refresh();
  }, [type, refresh]);

  const deleteEntry = useCallback((id) => {
    historyManager.deleteEntry(type, id);
    refresh();
  }, [type, refresh]);

  const search = useCallback((query) => {
    return historyManager.searchHistory(type, query);
  }, [type]);

  return {
    history,
    isLoading,
    refresh,
    addEntry,
    deleteEntry,
    search
  };
}

export function useUsageStats() {
  const [stats, setStats] = useState(() => historyManager.getUsageStats());

  const refresh = useCallback(() => {
    setStats(historyManager.getUsageStats());
  }, []);

  return { stats, refresh };
}
