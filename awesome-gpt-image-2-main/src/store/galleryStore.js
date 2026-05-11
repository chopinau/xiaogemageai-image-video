import { useState, useCallback, useEffect } from 'react';

const FAVORITES_KEY = 'gallery_favorites';
const FLAGGED_KEY = 'gallery_flagged';

let listeners = [];

function notifyListeners() {
  listeners.forEach(fn => fn());
}

function getStored(key) {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); }
  catch { return []; }
}

function setStored(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
  notifyListeners();
}

export function useGalleryStore() {
  const [, setTick] = useState(0);
  const refresh = useCallback(() => setTick(t => t + 1), []);

  useEffect(() => {
    listeners.push(refresh);
    return () => { listeners = listeners.filter(f => f !== refresh); };
  }, [refresh]);

  const favorites = getStored(FAVORITES_KEY);
  const flagged = getStored(FLAGGED_KEY);

  const isFavorited = useCallback((id) => {
    return favorites.some(f => f.id === id);
  }, [favorites]);

  const isFlagged = useCallback((id) => {
    return flagged.some(f => f.id === id);
  }, [flagged]);

  const getFlagReason = useCallback((id) => {
    const item = flagged.find(f => f.id === id);
    return item?.reason || '';
  }, [flagged]);

  const toggleFavorite = useCallback((item) => {
    const current = getStored(FAVORITES_KEY);
    const idx = current.findIndex(f => f.id === item.id);
    if (idx >= 0) {
      current.splice(idx, 1);
    } else {
      current.unshift({
        id: item.id,
        url: item.url,
        prompt: item.prompt || '',
        type: item.type || 'image',
        model: item.model || '',
        credits: item.credits || 0,
        favoritedAt: Date.now()
      });
    }
    setStored(FAVORITES_KEY, current);
  }, []);

  const toggleFlag = useCallback((item, reason) => {
    const current = getStored(FLAGGED_KEY);
    const idx = current.findIndex(f => f.id === item.id);
    if (idx >= 0) {
      current.splice(idx, 1);
    } else {
      current.unshift({
        id: item.id,
        url: item.url,
        prompt: item.prompt || '',
        type: item.type || 'image',
        model: item.model || '',
        reason: reason || '',
        flaggedAt: Date.now()
      });
    }
    setStored(FLAGGED_KEY, current);
  }, []);

  const removeFlag = useCallback((id) => {
    const current = getStored(FLAGGED_KEY);
    const filtered = current.filter(f => f.id !== id);
    setStored(FLAGGED_KEY, filtered);
  }, []);

  const removeFavorite = useCallback((id) => {
    const current = getStored(FAVORITES_KEY);
    const filtered = current.filter(f => f.id !== id);
    setStored(FAVORITES_KEY, filtered);
  }, []);

  return {
    favorites,
    flagged,
    isFavorited,
    isFlagged,
    getFlagReason,
    toggleFavorite,
    toggleFlag,
    removeFavorite,
    removeFlag
  };
}