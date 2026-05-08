import { Router } from 'express';
import multer from 'multer';
import { psdLayerService } from '../services/psdLayerService.js';
import { taskManager } from '../utils/taskManager.js';
import { randomUUID } from 'crypto';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

const psdResults = new Map();

taskManager.on('psd-progress', (progress) => {
  for (const [taskId, data] of psdResults.entries()) {
    if (data.sseClients) {
      for (const client of data.sseClients) {
        try {
          client.write(`data: ${JSON.stringify(progress)}\n\n`);
        } catch { /* ignore */ }
      }
    }
  }
});

router.post('/process', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: '请上传图片文件' });
    }

    const taskId = `psd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    psdResults.set(taskId, {
      status: 'processing',
      sseClients: new Set(),
      result: null,
      createdAt: Date.now()
    });

    res.json({
      success: true,
      taskId,
      status: 'processing',
      message: 'PSD分层任务已创建',
      timestamp: Date.now()
    });

    psdLayerService.processImage(req.file.buffer, req.body).then(result => {
      const task = psdResults.get(taskId);
      if (task) {
        task.status = result.success ? 'completed' : 'failed';
        task.result = result;
        task.completedAt = Date.now();

        for (const client of task.sseClients) {
          try {
            client.write(`data: ${JSON.stringify({
              step: 'done',
              status: task.status,
              success: result.success,
              foregroundUrl: result.foregroundUrl,
              backgroundUrl: result.backgroundUrl,
              error: result.error
            })}\n\n`);
            client.end();
          } catch { /* ignore */ }
        }
        task.sseClients.clear();
      }
    }).catch(err => {
      const task = psdResults.get(taskId);
      if (task) {
        task.status = 'failed';
        task.result = { success: false, error: err.message };

        for (const client of task.sseClients) {
          try {
            client.write(`data: ${JSON.stringify({
              step: 'done',
              status: 'failed',
              success: false,
              error: err.message
            })}\n\n`);
            client.end();
          } catch { /* ignore */ }
        }
        task.sseClients.clear();
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/task/:taskId', (req, res) => {
  const { taskId } = req.params;
  const task = psdResults.get(taskId);

  if (!task) {
    return res.status(404).json({ success: false, error: '任务不存在' });
  }

  res.json({
    success: true,
    taskId,
    status: task.status,
    result: task.status === 'completed' ? {
      foregroundUrl: task.result?.foregroundUrl,
      backgroundUrl: task.result?.backgroundUrl,
      filename: task.result?.filename
    } : null,
    error: task.result?.error,
    createdAt: task.createdAt,
    completedAt: task.completedAt
  });
});

router.get('/task/:taskId/stream', (req, res) => {
  const { taskId } = req.params;
  const task = psdResults.get(taskId);

  if (!task) {
    return res.status(404).json({ success: false, error: '任务不存在' });
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  if (task.status === 'completed' || task.status === 'failed') {
    res.write(`data: ${JSON.stringify({
      step: 'done',
      status: task.status,
      success: task.result?.success,
      foregroundUrl: task.result?.foregroundUrl,
      backgroundUrl: task.result?.backgroundUrl,
      error: task.result?.error
    })}\n\n`);
    res.end();
    return;
  }

  task.sseClients.add(res);

  req.on('close', () => {
    task.sseClients.delete(res);
  });
});

router.get('/download/:taskId', (req, res) => {
  const { taskId } = req.params;
  const task = psdResults.get(taskId);

  if (!task || task.status !== 'completed' || !task.result?.psdBuffer) {
    return res.status(404).json({ success: false, error: 'PSD文件不存在或任务未完成' });
  }

  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Disposition', `attachment; filename="${task.result.filename || 'layered.psd'}"`);
  res.setHeader('Content-Length', task.result.psdBuffer.length);
  res.send(task.result.psdBuffer);
});

setInterval(() => {
  const now = Date.now();
  for (const [taskId, task] of psdResults.entries()) {
    if (task.status === 'completed' || task.status === 'failed') {
      if (now - (task.completedAt || task.createdAt) > 30 * 60 * 1000) {
        psdResults.delete(taskId);
      }
    }
  }
}, 5 * 60 * 1000);

export default router;
