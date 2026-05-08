import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import imageRoutes from './routes/imageRoutes.js';
import videoRoutes from './routes/videoRoutes.js';
import textRoutes from './routes/textRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import { rateLimitMiddleware } from './middleware/rateLimit.js';
import { errorHandler } from './utils/errorHandler.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use(rateLimitMiddleware);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'AI Generation API Server running',
    version: '2.0.0',
    lingkeAPI: process.env.LINGKE_BASE_URL,
    models: {
      image: ['gpt-image-2', 'dall-e-3', 'flux-pro', 'doubao-seedream', 'doubao-seededit', 'stable-diffusion-xl'],
      video: ['kling', 'veo3', 'sora', 'seedance-2.0', 'runway-gen3', 'hailuo', 'luma'],
      text: ['gpt-4o', 'deepseek']
    }
  });
});

app.use('/api/image', imageRoutes);
app.use('/api/video', videoRoutes);
app.use('/api/text', textRoutes);
app.use('/api/upload', uploadRoutes);

app.get('/api/models', (req, res) => {
  res.json({
    success: true,
    models: {
      image: [
        { id: 'gpt-image-2', name: 'GPT Image 2', provider: 'OpenAI', apiType: 'sync' },
        { id: 'dall-e-3', name: 'DALL-E 3', provider: 'OpenAI', apiType: 'sync' },
        { id: 'flux-pro', name: 'Flux Pro', provider: 'Black Forest Labs', apiType: 'async-queue' },
        { id: 'doubao-seedream', name: '豆包 Seedream 4.0', provider: 'ByteDance', apiType: 'sync' },
        { id: 'doubao-seededit', name: '豆包 SeedEdit 3.0', provider: 'ByteDance', apiType: 'sync' },
        { id: 'stable-diffusion-xl', name: 'Stable Diffusion XL', provider: 'Stability AI', apiType: 'sync' }
      ],
      video: [
        { id: 'kling', name: 'Kling 可灵 V1.6', provider: 'Kuaishou', apiType: 'async' },
        { id: 'veo3', name: 'Veo 3.1', provider: 'Google', apiType: 'async' },
        { id: 'sora', name: 'Sora 2', provider: 'OpenAI', apiType: 'async' },
        { id: 'seedance-2.0', name: 'Seedance 2.0', provider: 'ByteDance', apiType: 'async' },
        { id: 'runway-gen3', name: 'Runway Gen4', provider: 'Runway', apiType: 'async' },
        { id: 'hailuo', name: '海螺视频 Hailuo', provider: 'MiniMax', apiType: 'async' },
        { id: 'luma', name: 'Luma Dream Machine', provider: 'Luma', apiType: 'async' }
      ],
      text: [
        { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', apiType: 'sync' },
        { id: 'deepseek', name: 'DeepSeek', provider: 'DeepSeek', apiType: 'sync' }
      ]
    }
  });
});

app.get('/api/usage', (req, res) => {
  res.json({
    success: true,
    usage: {
      imagesGenerated: 0,
      videosGenerated: 0,
      textGenerated: 0,
      totalCost: 0,
      thisMonth: 0
    }
  });
});

app.get('/api/history', (req, res) => {
  res.json({ success: true, history: [] });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 AI Generation API Server v2.0 running on http://localhost:${PORT}`);
  console.log(`📡 LingkeAPI: ${process.env.LINGKE_BASE_URL}`);
  console.log(`📚 API docs: http://localhost:${PORT}/api/health`);
});
