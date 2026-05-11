const FAVORITES_KEY = 'ai_favorites';
const FAVORITE_GROUPS_KEY = 'ai_favorite_groups';
const FLAGS_KEY = 'ai_flags';

class FavoritesManager {
  constructor() {
    this._cache = null;
    this._groupsCache = null;
    this._flagsCache = null;
  }

  _loadFavorites() {
    if (this._cache) return this._cache;
    try {
      const stored = localStorage.getItem(FAVORITES_KEY);
      this._cache = stored ? JSON.parse(stored) : [];
    } catch {
      this._cache = [];
    }
    return this._cache;
  }

  _saveFavorites(favorites) {
    this._cache = favorites;
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    } catch { /* ignore */ }
  }

  _loadGroups() {
    if (this._groupsCache) return this._groupsCache;
    try {
      const stored = localStorage.getItem(FAVORITE_GROUPS_KEY);
      this._groupsCache = stored ? JSON.parse(stored) : [
        { id: 'default', name: '默认收藏', icon: '❤️', createdAt: Date.now(), count: 0 }
      ];
    } catch {
      this._groupsCache = [{ id: 'default', name: '默认收藏', icon: '❤️', createdAt: Date.now(), count: 0 }];
    }
    return this._groupsCache;
  }

  _saveGroups(groups) {
    this._groupsCache = groups;
    try {
      localStorage.setItem(FAVORITE_GROUPS_KEY, JSON.stringify(groups));
    } catch { /* ignore */ }
  }

  _loadFlags() {
    if (this._flagsCache) return this._flagsCache;
    try {
      const stored = localStorage.getItem(FLAGS_KEY);
      this._flagsCache = stored ? JSON.parse(stored) : [];
    } catch {
      this._flagsCache = [];
    }
    return this._flagsCache;
  }

  _saveFlags(flags) {
    this._flagsCache = flags;
    try {
      localStorage.setItem(FLAGS_KEY, JSON.stringify(flags));
    } catch { /* ignore */ }
  }

  isFavorite(imageId) {
    const favorites = this._loadFavorites();
    return favorites.some(f => f.imageId === imageId);
  }

  addFavorite(imageId, imageData, groupId = 'default') {
    const favorites = this._loadFavorites();
    if (favorites.some(f => f.imageId === imageId)) {
      return this.moveFavorite(imageId, groupId);
    }
    const entry = {
      imageId,
      groupId,
      imageUrl: imageData.imageUrl,
      prompt: imageData.prompt,
      model: imageData.model,
      resolution: imageData.resolution,
      addedAt: Date.now()
    };
    favorites.unshift(entry);
    this._saveFavorites(favorites);
    this._updateGroupCount(groupId, 1);
    return { success: true, entry };
  }

  removeFavorite(imageId) {
    const favorites = this._loadFavorites();
    const entry = favorites.find(f => f.imageId === imageId);
    if (!entry) return { success: false };
    const updated = favorites.filter(f => f.imageId !== imageId);
    this._saveFavorites(updated);
    this._updateGroupCount(entry.groupId, -1);
    return { success: true };
  }

  moveFavorite(imageId, newGroupId) {
    const favorites = this._loadFavorites();
    const entry = favorites.find(f => f.imageId === imageId);
    if (!entry) return { success: false };
    const oldGroupId = entry.groupId;
    entry.groupId = newGroupId;
    this._saveFavorites(favorites);
    if (oldGroupId !== newGroupId) {
      this._updateGroupCount(oldGroupId, -1);
      this._updateGroupCount(newGroupId, 1);
    }
    return { success: true };
  }

  getFavorites(groupId) {
    const favorites = this._loadFavorites();
    if (groupId) return favorites.filter(f => f.groupId === groupId);
    return favorites;
  }

  getAllFavorites() {
    return this._loadFavorites();
  }

  createGroup(name, icon = '📁') {
    const groups = this._loadGroups();
    const newGroup = {
      id: `group_${Date.now()}`,
      name,
      icon,
      createdAt: Date.now(),
      count: 0
    };
    groups.push(newGroup);
    this._saveGroups(groups);
    return newGroup;
  }

  updateGroup(groupId, updates) {
    const groups = this._loadGroups();
    const group = groups.find(g => g.id === groupId);
    if (!group) return { success: false };
    Object.assign(group, updates);
    this._saveGroups(groups);
    return { success: true, group };
  }

  deleteGroup(groupId) {
    if (groupId === 'default') return { success: false, error: '不能删除默认分组' };
    const groups = this._loadGroups();
    const favorites = this._loadFavorites();
    const updatedFavorites = favorites.map(f => {
      if (f.groupId === groupId) f.groupId = 'default';
      return f;
    });
    const updatedGroups = groups.filter(g => g.id !== groupId);
    this._saveGroups(updatedGroups);
    this._saveFavorites(updatedFavorites);
    this._updateGroupCount('default', 0);
    return { success: true };
  }

  getGroups() {
    return this._loadGroups();
  }

  _updateGroupCount(groupId, delta) {
    const groups = this._loadGroups();
    const group = groups.find(g => g.id === groupId);
    if (!group) return;
    const favorites = this._loadFavorites();
    group.count = favorites.filter(f => f.groupId === groupId).length;
    this._saveGroups(groups);
  }

  isFlagged(imageId) {
    const flags = this._loadFlags();
    return flags.some(f => f.imageId === imageId);
  }

  addFlag(imageId, note = '') {
    const flags = this._loadFlags();
    if (flags.some(f => f.imageId === imageId)) {
      return this.updateFlag(imageId, { note });
    }
    flags.unshift({ imageId, note, flaggedAt: Date.now() });
    this._saveFlags(flags);
    return { success: true };
  }

  removeFlag(imageId) {
    const flags = this._loadFlags();
    const updated = flags.filter(f => f.imageId !== imageId);
    this._saveFlags(updated);
    return { success: true };
  }

  toggleFlag(imageId, note = '') {
    if (this.isFlagged(imageId)) {
      return this.removeFlag(imageId);
    }
    return this.addFlag(imageId, note);
  }

  updateFlag(imageId, updates) {
    const flags = this._loadFlags();
    const flag = flags.find(f => f.imageId === imageId);
    if (!flag) return { success: false };
    Object.assign(flag, updates);
    this._saveFlags(flags);
    return { success: true };
  }

  getFlags() {
    return this._loadFlags();
  }

  getFlag(imageId) {
    const flags = this._loadFlags();
    return flags.find(f => f.imageId === imageId) || null;
  }
}

export const favoritesManager = new FavoritesManager();
export default favoritesManager;
