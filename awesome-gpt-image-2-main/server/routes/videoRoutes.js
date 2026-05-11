import { Router } from 'express';
import { videoService } from '../services/videoService.js';
import apiProtection from '../services/apiProtectionService.js';

const router = Router();

router.post('/generate', async (req, res) => {
  try {
    const { model, prompt, duration, userId, ...options } = req.body;
    if (!prompt) {
      return res.status(400).json({ success: false, error: '缺少prompt参数' });
    }

    const modelId = model || 'kling';
    const uid = userId || 'anonymous';
    const videoDuration = duration || 5;

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

    const { basePrice, bufferedPrice, bufferPercent } = apiProtection.getBufferedPrice('video', modelId, { duration: videoDuration });

    const result = await videoService.generate(modelId, prompt, { duration: videoDuration, ...options }, req.headers['x-api-key']);

    if (!result.success) {
      apiProtection.recordFailure(modelId);
      return res.status(500).json(result);
    }

    apiProtection.recordSuccess(modelId);
    apiProtection.recordUsage(uid, 'video', modelId, basePrice);

    res.json({
      ...result,
      cost: { basePrice, bufferedPrice, bufferPercent, actualCost: basePrice, duration: videoDuration }
    });
  } catch (err) {
    apiProtection.recordFailure(req.body.model || 'kling');
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/from-image', async (req, res) => {
  try {
    const { model, imageUrl, prompt, duration, userId, ...options } = req.body;
    if (!imageUrl || !prompt) {
      return res.status(400).json({ success: false, error: '缺少imageUrl或prompt参数' });
    }

    const modelId = model || 'kling';
    const uid = userId || 'anonymous';
    const videoDuration = duration || 5;

    const globalLimit = apiProtection.checkGlobalRateLimit();
    if (!globalLimit.allowed) {
      return res.status(429).json({ success: false, error: globalLimit.error, retryAfter: globalLimit.retryAfter });
    }

    const circuitCheck = apiProtection.checkCircuitBreaker(modelId);
    if (!circuitCheck.allowed) {
      return res.status(503).json({ success: false, error: circuitCheck.error, retryAfter: circuitCheck.retryAfter });
    }

    const { basePrice, bufferedPrice, bufferPercent } = apiProtection.getBufferedPrice('video', modelId, { duration: videoDuration });

    const result = await videoService.fromImage(modelId, imageUrl, prompt, { duration: videoDuration, ...options }, req.headers['x-api-key']);

    if (!result.success) {
      apiProtection.recordFailure(modelId);
      return res.status(500).json(result);
    }

    apiProtection.recordSuccess(modelId);
    apiProtection.recordUsage(uid, 'video', modelId, basePrice);

    res.json({
      ...result,
      cost: { basePrice, bufferedPrice, bufferPercent, actualCost: basePrice, duration: videoDuration }
    });
  } catch (err) {
    apiProtection.recordFailure(req.body.model || 'kling');
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/status/:taskId', (req, res) => {
  const { taskId } = req.params;
  const status = videoService.getTaskStatus(taskId);
  if (!status) {
    return res.status(404).json({ success: false, error: '任务不存在' });
  }
  res.json({ success: true, ...status });
});

router.get('/stream/:taskId', (req, res) => {
  const { taskId } = req.params;
  const added = videoService.addSSEClient(taskId, res);
  if (!added) {
    res.status(404).json({ success: false, error: '任务不存在' });
  }
});

export default router;
