import express from 'express';
import * as StrategyService from '../services/strategyConfigService.js';
import * as PricingEngine from '../services/pricingEngine.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware, adminMiddleware);

router.get('/config', async (req, res) => {
  try {
    const config = StrategyService.getStrategyConfig();
    res.json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/strategies', async (req, res) => {
  try {
    const config = StrategyService.getStrategyConfig();
    const strategies = {};
    for (const [id, strategy] of Object.entries(config.strategies || {})) {
      strategies[id] = {
        ...strategy,
        modelCount: Object.keys(strategy.modelMappings || {}).length,
        providerCount: (strategy.providers || []).length
      };
    }
    res.json({ success: true, data: strategies });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/strategies/:id', async (req, res) => {
  try {
    const strategy = StrategyService.getStrategy(req.params.id);
    if (!strategy) return res.status(404).json({ success: false, error: '策略不存在' });
    res.json({ success: true, data: strategy });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/strategies/:id/providers', async (req, res) => {
  try {
    const { providers } = req.body;
    if (!Array.isArray(providers)) return res.status(400).json({ success: false, error: 'providers 必须是数组' });
    const result = StrategyService.updateStrategyProviders(req.params.id, providers);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/strategies/:id/markup', async (req, res) => {
  try {
    const { markupPercent } = req.body;
    if (typeof markupPercent !== 'number' || markupPercent < 0) {
      return res.status(400).json({ success: false, error: 'markupPercent 必须是非负数' });
    }
    const result = StrategyService.updateStrategyMarkup(req.params.id, markupPercent);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/strategies/:id/model-mapping', async (req, res) => {
  try {
    const { modelId, providerName, upstreamModelId, upstreamPrice } = req.body;
    if (!modelId || !providerName) {
      return res.status(400).json({ success: false, error: 'modelId 和 providerName 必填' });
    }
    const result = StrategyService.updateModelMapping(
      req.params.id, modelId, providerName, upstreamModelId, upstreamPrice
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/strategies/:id/model-mapping/:modelId', async (req, res) => {
  try {
    const result = StrategyService.removeModelMapping(req.params.id, req.params.modelId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/strategies/:id/sync', async (req, res) => {
  try {
    const result = await StrategyService.syncStrategyFromProviders(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/sync-all', async (req, res) => {
  try {
    const results = await StrategyService.syncAllStrategies();
    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/price/:modelId', async (req, res) => {
  try {
    const { strategy } = req.query;
    if (strategy) {
      const price = StrategyService.getStrategyPriceForModel(strategy, req.params.modelId);
      res.json({ success: true, data: price });
    } else {
      const comparisons = StrategyService.compareModelAcrossStrategies(req.params.modelId);
      res.json({ success: true, data: comparisons });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/compare/:modelId', async (req, res) => {
  try {
    const comparisons = StrategyService.compareModelAcrossStrategies(req.params.modelId);
    res.json({ success: true, data: comparisons });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/strategies/:id/apply', async (req, res) => {
  try {
    const result = StrategyService.applyStrategyPricesToEngine(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/optimal/:modelId', async (req, res) => {
  try {
    const result = StrategyService.getOptimalStrategyForModel(req.params.modelId);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/initialize', async (req, res) => {
  try {
    const config = StrategyService.initializeStrategyConfig();
    res.json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
