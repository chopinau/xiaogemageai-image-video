import { API_CONFIG, API_ENDPOINTS, createAPIHeaders, buildURL } from '../config/api';
import { getModelById } from '../config/models';

export class TextGenerator {
  constructor(apiKey, modelId = 'gpt-4o') {
    this.apiKey = apiKey;
    this.modelId = modelId;
    this.model = getModelById(modelId, 'text');
  }

  setModel(modelId) {
    this.modelId = modelId;
    this.model = getModelById(modelId, 'text');
  }

  async generate(prompt, options = {}) {
    if (!this.model) {
      throw new Error(`Model ${this.modelId} not found`);
    }

    const params = {
      model: this.modelId,
      prompt,
      maxTokens: options.maxTokens || 1000,
      temperature: options.temperature || 0.7,
      ...options
    };

    try {
      const response = await fetch(buildURL(API_ENDPOINTS.text.generate), {
        method: 'POST',
        headers: createAPIHeaders(this.apiKey),
        body: JSON.stringify(params)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return {
        success: true,
        text: result.text || result.content,
        model: this.modelId,
        usage: result.usage,
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        model: this.modelId
      };
    }
  }

  async chat(messages, options = {}) {
    const params = {
      model: this.modelId,
      messages,
      maxTokens: options.maxTokens || 2000,
      temperature: options.temperature || 0.7,
      ...options
    };

    try {
      const response = await fetch(buildURL(API_ENDPOINTS.text.chat), {
        method: 'POST',
        headers: createAPIHeaders(this.apiKey),
        body: JSON.stringify(params)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return {
        success: true,
        message: result.message || result.content,
        model: this.modelId,
        usage: result.usage,
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        model: this.modelId
      };
    }
  }

  async analyze(text, analysisType = 'general', options = {}) {
    if (!this.model?.capabilities?.includes('analysis')) {
      throw new Error(`Model ${this.modelId} does not support analysis`);
    }

    const params = {
      model: this.modelId,
      text,
      analysisType,
      ...options
    };

    try {
      const response = await fetch(buildURL(API_ENDPOINTS.text.analyze), {
        method: 'POST',
        headers: createAPIHeaders(this.apiKey),
        body: JSON.stringify(params)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return {
        success: true,
        analysis: result.analysis,
        model: this.modelId,
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        model: this.modelId
      };
    }
  }

  async generateImagePrompt(description, style = 'general') {
    const systemPrompt = `You are a professional AI art prompt engineer. Create detailed, well-structured prompts for AI image generation.`;
    const userPrompt = `Create a detailed image generation prompt based on this description. Include style, lighting, composition, and technical details: ${description}`;

    const result = await this.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], { temperature: 0.8 });

    return result;
  }

  estimateCost(inputTokens, outputTokens) {
    const inputPrice = this.model?.pricing?.perInputToken || 0;
    const outputPrice = this.model?.pricing?.perOutputToken || 0;
    return (inputTokens * inputPrice) + (outputTokens * outputPrice);
  }
}

export const createTextGenerator = (apiKey, modelId) => {
  return new TextGenerator(apiKey, modelId);
};
