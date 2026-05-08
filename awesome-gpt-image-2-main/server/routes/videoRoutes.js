import { Router } from 'express';
import { videoService } from '../services/videoService.js';

const router = Router();

router.post('/generate', async (req, res) => {
  try {
    const { model, prompt, duration, ...options } = req.body;
    if (!prompt) {
      return res.status(400).json({ success: false, error: '缺少prompt参数' });
    }

    const modelId = model || 'kling';
    const result = await videoService.generate(modelId, prompt, { duration, ...options });

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/from-image', async (req, res) => {
  try {
    const { model, imageUrl, prompt, duration, ...options } = req.body;
    if (!imageUrl || !prompt) {
      return res.status(400).json({ success: false, error: '缺少imageUrl或prompt参数' });
    }

    const modelId = model || 'kling';
    const result = await videoService.fromImage(modelId, imageUrl, prompt, { duration, ...options });

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json(result);
  } catch (err) {
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
