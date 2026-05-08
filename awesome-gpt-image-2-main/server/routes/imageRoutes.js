import { Router } from 'express';
import multer from 'multer';
import { imageService } from '../services/imageService.js';
import { taskManager } from '../utils/taskManager.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

router.post('/generate', upload.array('images', 10), async (req, res) => {
  try {
    const { model, prompt, ...options } = req.body;
    if (!prompt) {
      return res.status(400).json({ success: false, error: '缺少prompt参数' });
    }

    const modelId = model || 'gpt-image-2';
    const result = await imageService.generate(modelId, prompt, options);

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/edit', upload.array('images', 10), async (req, res) => {
  try {
    const { model, prompt, imageUrl, ...options } = req.body;
    if (!prompt) {
      return res.status(400).json({ success: false, error: '缺少prompt参数' });
    }

    const modelId = model || 'gpt-image-2';
    let imageData = imageUrl;

    if (req.files && req.files.length > 0) {
      imageData = req.files[0].buffer;
    }

    if (!imageData) {
      return res.status(400).json({ success: false, error: '缺少图片数据' });
    }

    const result = await imageService.edit(modelId, prompt, imageData, options);

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/inpaint', upload.array('images', 2), async (req, res) => {
  try {
    const { model, prompt, ...options } = req.body;
    if (!prompt) {
      return res.status(400).json({ success: false, error: '缺少prompt参数' });
    }

    const modelId = model || 'gpt-image-2';
    const image = req.files?.[0]?.buffer;
    const mask = req.files?.[1]?.buffer;

    if (!image) {
      return res.status(400).json({ success: false, error: '缺少图片数据' });
    }

    const result = await imageService.inpaint(modelId, prompt, image, mask, options);

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/task/:taskId', (req, res) => {
  const { taskId } = req.params;
  const result = imageService.getTaskResult(taskId);
  res.json(result);
});

router.get('/task/:taskId/stream', (req, res) => {
  const { taskId } = req.params;
  const added = taskManager.addSSEClient(taskId, res);
  if (!added) {
    res.status(404).json({ success: false, error: 'Task not found' });
  }
});

export default router;
