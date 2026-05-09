import { Router } from 'express';
import multer from 'multer';
import { psdLayerService } from '../services/psdLayerService.js';
import { taskManager } from '../utils/taskManager.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

const uploadMulti = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 10 }
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

function createTask() {
  const taskId = `psd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  psdResults.set(taskId, {
    status: 'processing',
    sseClients: new Set(),
    result: null,
    createdAt: Date.now()
  });
  return taskId;
}

function completeTask(taskId, result) {
  const task = psdResults.get(taskId);
  if (!task) return;
  task.status = result.success ? 'completed' : 'failed';
  task.result = result;
  task.completedAt = Date.now();

  const payload = {
    step: 'done',
    status: task.status,
    success: result.success,
    error: result.error
  };

  if (result.foregroundUrl) payload.foregroundUrl = result.foregroundUrl;
  if (result.backgroundUrl) payload.backgroundUrl = result.backgroundUrl;
  if (result.layers) payload.layers = result.layers;
  if (result.layerCount) payload.layerCount = result.layerCount;

  for (const client of task.sseClients) {
    try {
      client.write(`data: ${JSON.stringify(payload)}\n\n`);
      client.end();
    } catch { /* ignore */ }
  }
  task.sseClients.clear();
}

router.post('/process', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: '请上传图片文件' });
    }

    const taskId = createTask();

    res.json({
      success: true,
      taskId,
      status: 'processing',
      message: 'PSD分层任务已创建',
      timestamp: Date.now()
    });

    psdLayerService.processImage(req.file.buffer, req.body)
      .then(result => completeTask(taskId, result))
      .catch(err => completeTask(taskId, { success: false, error: err.message }));
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/split-colors', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: '请上传图片文件' });
    }

    const taskId = createTask();
    const options = {
      numColors: parseInt(req.body.numColors) || 5,
      ignoreColor: req.body.ignoreColor || null
    };

    res.json({
      success: true,
      taskId,
      status: 'processing',
      message: '颜色拆层任务已创建',
      timestamp: Date.now()
    });

    psdLayerService.splitByColors(req.file.buffer, options)
      .then(result => completeTask(taskId, result))
      .catch(err => completeTask(taskId, { success: false, error: err.message }));
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/assemble', uploadMulti.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length < 2) {
      return res.status(400).json({ success: false, error: '请上传至少2张图片' });
    }

    const taskId = createTask();
    const options = {
      layerNames: req.body.layerNames ? JSON.parse(req.body.layerNames) : [],
      firstIsBackground: req.body.firstIsBackground !== 'false',
      fit: req.body.fit || 'cover',
      width: req.body.width ? parseInt(req.body.width) : undefined,
      height: req.body.height ? parseInt(req.body.height) : undefined
    };

    res.json({
      success: true,
      taskId,
      status: 'processing',
      message: '多图组装任务已创建',
      timestamp: Date.now()
    });

    const imageBuffers = req.files.map(f => f.buffer);
    psdLayerService.assembleImages(imageBuffers, options)
      .then(result => completeTask(taskId, result))
      .catch(err => completeTask(taskId, { success: false, error: err.message }));
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

  const response = {
    success: true,
    taskId,
    status: task.status,
    createdAt: task.createdAt,
    completedAt: task.completedAt
  };

  if (task.status === 'completed' && task.result) {
    response.foregroundUrl = task.result.foregroundUrl;
    response.backgroundUrl = task.result.backgroundUrl;
    response.layers = task.result.layers;
    response.layerCount = task.result.layerCount;
    response.filename = task.result.filename;
  }

  if (task.result?.error) {
    response.error = task.result.error;
  }

  res.json(response);
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
    const payload = {
      step: 'done',
      status: task.status,
      success: task.result?.success,
      error: task.result?.error
    };
    if (task.result?.foregroundUrl) payload.foregroundUrl = task.result.foregroundUrl;
    if (task.result?.backgroundUrl) payload.backgroundUrl = task.result.backgroundUrl;
    if (task.result?.layers) payload.layers = task.result.layers;
    if (task.result?.layerCount) payload.layerCount = task.result.layerCount;

    res.write(`data: ${JSON.stringify(payload)}\n\n`);
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
