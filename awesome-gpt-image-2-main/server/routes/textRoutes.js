import { Router } from 'express';
import { lingkeClient } from '../services/lingkeClient.js';

const router = Router();

router.post('/generate', async (req, res) => {
  try {
    const { model, prompt, ...options } = req.body;
    if (!prompt) {
      return res.status(400).json({ success: false, error: '缺少prompt参数' });
    }

    const messages = [{ role: 'user', content: prompt }];
    const modelId = model || 'gpt-4o';

    const result = await lingkeClient.chatCompletion(modelId, messages, {
      temperature: options.temperature || 0.7,
      max_tokens: options.max_tokens || 2000
    });

    if (!result.success) {
      return res.status(500).json(result);
    }

    const content = result.data?.choices?.[0]?.message?.content || '';
    res.json({
      success: true,
      text: content,
      model: modelId,
      usage: result.data?.usage,
      timestamp: Date.now()
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/chat', async (req, res) => {
  try {
    const { model, messages, ...options } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ success: false, error: '缺少messages参数' });
    }

    const modelId = model || 'gpt-4o';
    const result = await lingkeClient.chatCompletion(modelId, messages, {
      temperature: options.temperature || 0.7,
      max_tokens: options.max_tokens || 2000
    });

    if (!result.success) {
      return res.status(500).json(result);
    }

    const assistantMessage = result.data?.choices?.[0]?.message || { role: 'assistant', content: '' };
    res.json({
      success: true,
      message: assistantMessage,
      model: modelId,
      usage: result.data?.usage,
      timestamp: Date.now()
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
