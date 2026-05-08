# AI Generation Features Extension Guide

This guide explains how to use the newly added multi-model AI generation features including image, video, and text generation.

## Architecture Overview

```
src/
├── config/
│   ├── models.js          # AI model configurations
│   └── api.js             # API configuration
├── services/
│   ├── imageGenerator.js  # Image generation service
│   ├── videoGenerator.js  # Video generation service
│   ├── textGenerator.js   # Text generation service
│   └── historyManager.js  # History and storage management
└── hooks/
    └── useAI.js           # React hooks for easy integration
```

## Quick Start

### 1. Setup API Key

First, you need to set up your API key:

```jsx
import { useAI } from '../hooks/useAI';

function ApiSetup() {
  const { apiKey, setApiKey, validateKey } = useAI();
  
  const handleSave = (newKey) => {
    setApiKey(newKey);
    const validation = validateKey();
    if (validation.valid) {
      console.log('API key saved!');
    }
  };
  
  // ...
}
```

### 2. Generate Images

```jsx
import { useAI } from '../hooks/useAI';

function ImageGenerator() {
  const { generateImage, currentImageModel, setCurrentImageModel } = useAI();
  
  const handleGenerate = async (prompt) => {
    const result = await generateImage(prompt, {
      size: '1024x1024',
      numImages: 1
    });
    
    if (result.success) {
      console.log('Generated images:', result.images);
    }
  };
  
  // ...
}
```

### 3. Generate Videos

```jsx
import { useAI } from '../hooks/useAI';

function VideoGenerator() {
  const { generateVideo, currentVideoModel } = useAI();
  
  const handleGenerate = async (prompt) => {
    const result = await generateVideo(prompt, {
      duration: 10,
      resolution: '1080p'
    });
    
    if (result.success) {
      console.log('Video generation started:', result);
    }
  };
  
  // ...
}
```

### 4. Generate Text

```jsx
import { useAI } from '../hooks/useAI';

function TextGenerator() {
  const { generateText, chat } = useAI();
  
  const handleGenerate = async (prompt) => {
    const result = await generateText(prompt, {
      maxTokens: 1000,
      temperature: 0.7
    });
    
    if (result.success) {
      console.log('Generated text:', result.text);
    }
  };
  
  const handleChat = async (messages) => {
    const result = await chat(messages);
    // ...
  };
}
```

## Available Models

### Image Generation Models
- `gpt-image-2` - GPT Image 2 (default)
- `dall-e-3` - DALL-E 3
- `midjourney-v6` - Midjourney V6
- `stable-diffusion-xl` - Stable Diffusion XL
- `flux-pro` - Flux Pro

### Video Generation Models
- `sora` - Sora (default)
- `runway-gen3` - Runway Gen3
- `pika-labs` - Pika Labs
- `stable-video` - Stable Video

### Text Generation Models
- `gpt-4` - GPT-4
- `gpt-4o` - GPT-4o (default)
- `claude-3` - Claude 3

## History Management

```jsx
import { useHistory, useUsageStats } from '../hooks/useAI';

function HistoryView() {
  const { history, deleteEntry, search } = useHistory('image');
  const { stats } = useUsageStats();
  
  return (
    <div>
      <div>Total images: {stats.imagesGenerated}</div>
      <div>Total cost: ${stats.totalCost.toFixed(2)}</div>
      
      {history.map((item) => (
        <div key={item.id}>
          <p>{item.prompt}</p>
          <button onClick={() => deleteEntry(item.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}
```

## Direct Service Usage

If you prefer not to use the React hooks, you can use the services directly:

```jsx
import { createImageGenerator } from './services/imageGenerator';
import { getModelsByCategory } from './config/models';

// Create generator instance
const generator = createImageGenerator('your-api-key', 'gpt-image-2');

// Generate image
const result = await generator.generate('A beautiful sunset', {
  size: '1024x1024'
});

// Estimate cost
const cost = generator.estimateCost({ numImages: 1 });
console.log(`Estimated cost: $${cost}`);
```

## API Configuration

Create a `.env` file based on `.env.example`:

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

## Wrapping Your App

To use the AI features, wrap your application with `AIProvider`:

```jsx
import { AIProvider } from './hooks/useAI';

function App() {
  return (
    <AIProvider>
      <YourComponents />
    </AIProvider>
  );
}
```

## Best Practices

1. **Error Handling**: Always check the `success` field in results
2. **API Key Security**: Never commit API keys to version control
3. **Cost Estimation**: Use `estimateCost()` before generating
4. **History Management**: Regularly clean up old history if needed
5. **Model Selection**: Choose the right model for your use case

## Next Steps

- Create UI components for image/video/text generation
- Implement backend API endpoints
- Add user authentication
- Implement payment processing
- Add more models as needed
