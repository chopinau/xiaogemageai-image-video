import { Router } from 'express';
import multer from 'multer';
import { imageService } from '../services/imageService.js';
import { taskManager } from '../utils/taskManager.js';
import apiProtection from '../services/apiProtectionService.js';
import * as PricingEngine from '../services/pricingEngine.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

router.post('/generate', optionalAuth, upload.array('images', 10), async (req, res) => {
  try {
    const { model, prompt, userId, ...options } = req.body;
    if (!prompt) {
      return res.status(400).json({ success: false, error: '缺少prompt参数' });
    }

    const modelId = model || 'gpt-image-2';
    const uid = userId || 'anonymous';
    const resolution = options.resolution || options.size || '1k';
    const count = options.n || options.count || 1;

    const globalLimit = apiProtection.checkGlobalRateLimit();
    if (!globalLimit.allowed) {
      return res.status(429).json({ success: false, error: globalLimit.error, retryAfter: globalLimit.retryAfter });
    }

    const userLimit = apiProtection.checkUserRateLimit(uid);
    if (!userLimit.allowed) {
      return res.status(429).json({ success: false, error: userLimit.error, retryAfter: userLimit.retryAfter });
    }

    const circuitCheck = apiProtection.checkCircuitBreaker(modelId);
    if (!circuitCheck.allowed) {
      return res.status(503).json({ success: false, error: circuitCheck.error, retryAfter: circuitCheck.retryAfter });
    }

    const { basePrice, bufferedPrice, bufferPercent } = apiProtection.getBufferedPrice('image', modelId, { resolution, count });

    const result = await imageService.generate(modelId, prompt, options, req.headers['x-api-key']);

    if (!result.success) {
      apiProtection.recordFailure(modelId);
      return res.status(500).json(result);
    }

    apiProtection.recordSuccess(modelId);
    apiProtection.recordUsage(uid, 'image', modelId, basePrice);

    res.json({
      ...result,
      cost: { basePrice, bufferedPrice, bufferPercent, actualCost: basePrice }
    });
  } catch (err) {
    apiProtection.recordFailure(req.body.model || 'gpt-image-2');
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/edit', optionalAuth, upload.array('images', 10), async (req, res) => {
  try {
    const { model, prompt, imageUrl, userId, ...options } = req.body;
    if (!prompt) {
      return res.status(400).json({ success: false, error: '缺少prompt参数' });
    }

    const modelId = model || 'gpt-image-2';
    const uid = userId || 'anonymous';
    const resolution = options.resolution || '1k';

    const globalLimit = apiProtection.checkGlobalRateLimit();
    if (!globalLimit.allowed) {
      return res.status(429).json({ success: false, error: globalLimit.error, retryAfter: globalLimit.retryAfter });
    }

    const circuitCheck = apiProtection.checkCircuitBreaker(modelId);
    if (!circuitCheck.allowed) {
      return res.status(503).json({ success: false, error: circuitCheck.error, retryAfter: circuitCheck.retryAfter });
    }

    const { basePrice, bufferedPrice, bufferPercent } = apiProtection.getBufferedPrice('edit', modelId, { resolution });

    let imageData = imageUrl;
    if (req.files && req.files.length > 0) {
      imageData = req.files[0].buffer;
    }
    if (!imageData) {
      return res.status(400).json({ success: false, error: '缺少图片数据' });
    }

    const result = await imageService.edit(modelId, prompt, imageData, options, req.headers['x-api-key']);

    if (!result.success) {
      apiProtection.recordFailure(modelId);
      return res.status(500).json(result);
    }

    apiProtection.recordSuccess(modelId);
    apiProtection.recordUsage(uid, 'edit', modelId, basePrice);

    res.json({
      ...result,
      cost: { basePrice, bufferedPrice, bufferPercent, actualCost: basePrice }
    });
  } catch (err) {
    apiProtection.recordFailure(req.body.model || 'gpt-image-2');
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/inpaint', optionalAuth, upload.array('images', 2), async (req, res) => {
  try {
    const { model, prompt, userId, ...options } = req.body;
    if (!prompt) {
      return res.status(400).json({ success: false, error: '缺少prompt参数' });
    }

    const modelId = model || 'gpt-image-2';
    const uid = userId || 'anonymous';

    const globalLimit = apiProtection.checkGlobalRateLimit();
    if (!globalLimit.allowed) {
      return res.status(429).json({ success: false, error: globalLimit.error, retryAfter: globalLimit.retryAfter });
    }

    const image = req.files?.[0]?.buffer;
    const mask = req.files?.[1]?.buffer;
    if (!image) {
      return res.status(400).json({ success: false, error: '缺少图片数据' });
    }

    const { basePrice, bufferedPrice, bufferPercent } = apiProtection.getBufferedPrice('edit', modelId, { resolution: '1k' });

    const result = await imageService.inpaint(modelId, prompt, image, mask, options, req.headers['x-api-key']);

    if (!result.success) {
      apiProtection.recordFailure(modelId);
      return res.status(500).json(result);
    }

    apiProtection.recordSuccess(modelId);
    apiProtection.recordUsage(uid, 'edit', modelId, basePrice);

    res.json({
      ...result,
      cost: { basePrice, bufferedPrice, bufferPercent, actualCost: basePrice }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/task/:taskId', async (req, res) => {
  const { taskId } = req.params;
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;
  const result = await imageService.getTaskResult(taskId, apiKey);
  res.json(result);
});

router.get('/pricing/:model', async (req, res) => {
  try {
    const { model } = req.params;
    const apiKey = req.headers['x-api-key'] || req.query.apiKey;
    const result = await imageService.getPricing(model, apiKey);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/task/:taskId/stream', (req, res) => {
  const { taskId } = req.params;
  const added = taskManager.addSSEClient(taskId, res);
  if (!added) {
    res.status(404).json({ success: false, error: 'Task not found' });
  }
});

export default router;
