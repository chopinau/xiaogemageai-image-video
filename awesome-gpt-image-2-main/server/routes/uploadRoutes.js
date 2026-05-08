import { Router } from 'express';
import multer from 'multer';
import { lingkeClient } from '../services/lingkeClient.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

router.post('/image', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: '缺少文件' });
    }

    const result = await lingkeClient.uploadImage(
      req.file.buffer,
      req.file.originalname || 'image.png',
      req.file.mimetype || 'image/png'
    );

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json({
      success: true,
      url: result.data?.url || result.data?.data?.url,
      timestamp: Date.now()
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
