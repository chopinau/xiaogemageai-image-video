import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env from server directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

import imageRoutes from './routes/imageRoutes.js';
import videoRoutes from './routes/videoRoutes.js';
import textRoutes from './routes/textRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import psdLayerRoutes from './routes/psdLayerRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import pricingAdminRoutes from './routes/pricingAdminRoutes.js';
import authRoutes from './routes/authRoutes.js';
import creditsRoutes from './routes/creditsRoutes.js';
import usageRoutes from './routes/usageRoutes.js';
import ticketRoutes from './routes/ticketRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import paymentConfigRoutes from './routes/paymentConfigRoutes.js';
import strategyRoutes from './routes/strategyRoutes.js';
import { rateLimitMiddleware } from './middleware/rateLimit.js';
import { errorHandler } from './utils/errorHandler.js';
import apiProtection from './services/apiProtectionService.js';
import * as HealthMonitor from './services/providerHealthMonitor.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use(rateLimitMiddleware);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: Date.now(),
    uptime: process.uptime(),
    version: '2.0.0',
    lingkeAPI: process.env.LINGKE_BASE_URL,
    protection: apiProtection.getProtectionStatus(),
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
app.use('/api/psd-layer', psdLayerRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/pricing-admin', pricingAdminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/credits', creditsRoutes);
app.use('/api/usage', usageRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/payment-config', paymentConfigRoutes);
app.use('/api/strategy', strategyRoutes);

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

app.get('/api/history', (req, res) => {
  res.json({ success: true, history: [] });
});

app.get('/api/pricing', async (req, res) => {
  try {
    const pricingModule = await import('./services/pricingEngine.js');
    const allPricing = pricingModule.getAllPricing();
    res.json({ success: true, ...allPricing });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/pricing/:model', async (req, res) => {
  try {
    const { model } = req.params;
    const pricingModule = await import('./services/pricingEngine.js');
    const modelPricing = pricingModule.getModelPricing(model);
    if (modelPricing) {
      res.json({ success: true, model, ...modelPricing });
    } else {
      const apiKey = req.headers['x-api-key'] || req.query.apiKey || process.env.LINGKE_API_KEY;
      const { lingkeClient } = await import('./services/lingkeClient.js');
      const result = await lingkeClient.getModelPricing(model, apiKey);
      res.json(result);
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.use(errorHandler);

const SYNC_INTERVAL = 6 * 60 * 60 * 1000;

async function autoSyncUpstreamPrices() {
  try {
    console.log('[AutoSync] Starting scheduled upstream price sync...');
    const { fetchAllProviderPrices } = await import('./services/upstreamPriceFetcher.js');
    const result = await fetchAllProviderPrices();
    const providerCount = Object.keys(result || {}).length;
    const totalModels = Object.values(result || {}).reduce((sum, p) => sum + Object.keys(p.models || {}).length, 0);
    console.log(`[AutoSync] Completed: ${providerCount} providers, ${totalModels} models synced`);
  } catch (err) {
    console.error('[AutoSync] Failed:', err.message);
  }
}

app.listen(PORT, () => {
  console.log(`🚀 AI Generation API Server v2.0 running on http://localhost:${PORT}`);
  console.log(`📡 LingkeAPI: ${process.env.LINGKE_BASE_URL}`);
  console.log(`💰 Payment routes mounted at /api/payments`);
  console.log(`📚 API docs: http://localhost:${PORT}/api/health`);
  console.log(`🔄 Auto-sync interval: every ${SYNC_INTERVAL / 3600000} hours`);

  setTimeout(() => {
    autoSyncUpstreamPrices();
    HealthMonitor.startHealthCheckLoop();
  }, 30000);

  setInterval(autoSyncUpstreamPrices, SYNC_INTERVAL);
});
