import * as PricingEngine from './pricingEngine.js';

class CreditsManager {
  constructor(userCreditsStore) {
    this.userCreditsStore = userCreditsStore;
    this.pendingDeductions = new Map();
    this.transactionLog = [];
  }

  async getUserCredits(userId) {
    const userCredits = await this.userCreditsStore.get(userId);
    return {
      balance: userCredits?.balance || 0,
      monthlyCredits: userCredits?.monthlyCredits || 0,
      bonusCredits: userCredits?.bonusCredits || 0,
      total: (userCredits?.balance || 0) + (userCredits?.monthlyCredits || 0) + (userCredits?.bonusCredits || 0)
    };
  }

  async preDeduct(userId, amount, reason, referenceId) {
    const userCredits = await this.userCreditsStore.get(userId);
    const currentBalance = (userCredits?.balance || 0) + (userCredits?.monthlyCredits || 0) + (userCredits?.bonusCredits || 0);

    if (currentBalance < amount) {
      return { success: false, error: '积分不足', currentBalance, requiredAmount: amount, needRecharge: true };
    }

    const deductionId = `pd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    this.pendingDeductions.set(deductionId, {
      userId, amount, reason, referenceId, createdAt: Date.now(), expiresAt: Date.now() + 300000
    });

    await this.userCreditsStore.update(userId, {
      balance: (userCredits?.balance || 0) - amount,
      pendingDeductions: [...(userCredits?.pendingDeductions || []), deductionId]
    });

    this._logTransaction({
      id: deductionId, type: 'pre_deduct', userId, amount: -amount, reason, referenceId, status: 'pending', timestamp: Date.now()
    });

    return { success: true, deductionId, amount, remainingBalance: currentBalance - amount };
  }

  async confirmDeduct(deductionId) {
    const pending = this.pendingDeductions.get(deductionId);
    if (!pending) return { success: false, error: '预扣费记录不存在' };

    if (Date.now() > pending.expiresAt) {
      await this.rollbackDeduct(deductionId);
      return { success: false, error: '预扣费已过期' };
    }

    const userCredits = await this.userCreditsStore.get(pending.userId);
    const updatedPending = (userCredits?.pendingDeductions || []).filter(id => id !== deductionId);

    await this.userCreditsStore.update(pending.userId, { pendingDeductions: updatedPending });
    this.pendingDeductions.delete(deductionId);
    this._updateTransactionStatus(deductionId, 'confirmed');

    return { success: true, amount: pending.amount };
  }

  async rollbackDeduct(deductionId) {
    const pending = this.pendingDeductions.get(deductionId);
    if (!pending) return { success: false, error: '预扣费记录不存在' };

    const userCredits = await this.userCreditsStore.get(pending.userId);
    const updatedPending = (userCredits?.pendingDeductions || []).filter(id => id !== deductionId);

    await this.userCreditsStore.update(pending.userId, {
      balance: (userCredits?.balance || 0) + pending.amount,
      pendingDeductions: updatedPending
    });

    this.pendingDeductions.delete(deductionId);
    this._updateTransactionStatus(deductionId, 'rolled_back');
    this._logTransaction({
      type: 'refund', userId: pending.userId, amount: pending.amount,
      reason: `预扣费返还: ${pending.reason}`, referenceId: pending.referenceId, status: 'completed', timestamp: Date.now()
    });

    return { success: true, amount: pending.amount };
  }

  async directDeduct(userId, amount, reason, referenceId) {
    const userCredits = await this.userCreditsStore.get(userId);
    const currentBalance = (userCredits?.balance || 0) + (userCredits?.monthlyCredits || 0) + (userCredits?.bonusCredits || 0);

    if (currentBalance < amount) {
      return { success: false, error: '积分不足', currentBalance, requiredAmount: amount, needRecharge: true };
    }

    await this.userCreditsStore.update(userId, { balance: (userCredits?.balance || 0) - amount });

    this._logTransaction({
      id: `dd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'direct_deduct', userId, amount: -amount, reason, referenceId, status: 'completed', timestamp: Date.now()
    });

    return { success: true, amount, remainingBalance: currentBalance - amount };
  }

  async addCredits(userId, amount, reason, source = 'recharge') {
    const userCredits = await this.userCreditsStore.get(userId);

    let balanceUpdate = {};
    if (source === 'monthly') {
      balanceUpdate.monthlyCredits = (userCredits?.monthlyCredits || 0) + amount;
    } else if (source === 'bonus') {
      balanceUpdate.bonusCredits = (userCredits?.bonusCredits || 0) + amount;
    } else {
      balanceUpdate.balance = (userCredits?.balance || 0) + amount;
    }

    await this.userCreditsStore.update(userId, balanceUpdate);

    this._logTransaction({
      id: `ac_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'add_credits', userId, amount, reason, source, status: 'completed', timestamp: Date.now()
    });

    return { success: true, amount };
  }

  async getTransactionHistory(userId, options = {}) {
    const { page = 1, limit = 20, type } = options;
    const allTransactions = this.transactionLog.filter(t => t.userId === userId);
    const filtered = type ? allTransactions.filter(t => t.type === type) : allTransactions;
    const sorted = filtered.sort((a, b) => b.timestamp - a.timestamp);
    const start = (page - 1) * limit;
    const paginated = sorted.slice(start, start + limit);

    return { transactions: paginated, total: sorted.length, page, limit, totalPages: Math.ceil(sorted.length / limit) };
  }

  _logTransaction(transaction) {
    this.transactionLog.push(transaction);
    if (this.transactionLog.length > 10000) {
      this.transactionLog = this.transactionLog.slice(-5000);
    }
  }

  _updateTransactionStatus(deductionId, status) {
    const transaction = this.transactionLog.find(t => t.id === deductionId);
    if (transaction) transaction.status = status;
  }

  async cleanupExpiredDeductions() {
    const now = Date.now();
    for (const [id, pending] of this.pendingDeductions.entries()) {
      if (now > pending.expiresAt) await this.rollbackDeduct(id);
    }
  }
}

export default CreditsManager;
