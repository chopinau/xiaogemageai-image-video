# Quick Start Guide

## 1. Frontend Setup

The frontend development server is already running! You should be able to access it at:

```
http://localhost:5173/
```

## 2. Backend Setup (Optional for Testing)

To test the API endpoints, you can start the mock backend server:

```bash
cd server
npm install
npm run dev
```

The server will run at `http://localhost:3000`

## 3. Environment Configuration

Create a `.env` file in the project root:

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

## 4. Project Structure Overview

### New Files Added:

**Configuration:**
- `src/config/models.js` - AI model configurations
- `src/config/api.js` - API endpoint configurations

**Services:**
- `src/services/imageGenerator.js` - Image generation service
- `src/services/videoGenerator.js` - Video generation service
- `src/services/textGenerator.js` - Text generation service
- `src/services/historyManager.js` - History and storage management

**Hooks:**
- `src/hooks/useAI.js` - React hooks for AI features

**Backend:**
- `server/server.js` - Mock API server
- `server/package.json` - Server dependencies

**Documentation:**
- `docs/EXTENSIONS_GUIDE.md` - Complete feature guide
- `QUICKSTART.md` - This file
- `.env.example` - Environment variables template

## 5. Next Steps

To integrate the new features:

1. **Wrap your app** with `AIProvider` (see `docs/EXTENSIONS_GUIDE.md`)
2. **Create UI components** for image/video/text generation
3. **Implement real API integrations** with your chosen AI providers
4. **Add user authentication** if needed
5. **Implement payment processing** for paid features

## 6. Running Both Servers

For full functionality:

**Terminal 1 (Frontend):**
```bash
npm run dev
```

**Terminal 2 (Backend):**
```bash
cd server
npm install
npm run dev
```

## 7. Available AI Models

### Image Models
- GPT Image 2
- DALL-E 3
- Midjourney V6
- Stable Diffusion XL
- Flux Pro

### Video Models
- Sora
- Runway Gen3
- Pika Labs
- Stable Video

### Text Models
- GPT-4
- GPT-4o
- Claude 3

## Need Help?

Check the detailed documentation in `docs/EXTENSIONS_GUIDE.md`
