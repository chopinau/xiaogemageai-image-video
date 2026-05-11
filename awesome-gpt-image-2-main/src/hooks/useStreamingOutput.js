import { useState, useCallback, useRef, useEffect } from 'react';

class StreamingBuffer {
  constructor(onUpdate, flushInterval = 50) {
    this.buffer = [];
    this.flushInterval = flushInterval;
    this.onUpdate = onUpdate;
    this.flushTimer = null;
    this.isStreaming = false;
  }

  append(chunk) {
    this.buffer.push(chunk);
    if (!this.flushTimer) {
      this.flushTimer = setInterval(() => this.flush(), this.flushInterval);
    }
  }

  flush() {
    if (this.buffer.length === 0) return;
    const content = this.buffer.join('');
    this.buffer = [];
    this.onUpdate(content);
  }

  end() {
    this.flush();
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    this.isStreaming = false;
  }

  start() {
    this.isStreaming = true;
    this.buffer = [];
  }
}

export function useStreamingOutput() {
  const [streamingContent, setStreamingContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const bufferRef = useRef(null);
  const abortRef = useRef(null);

  const startStream = useCallback(async (url, body, options = {}) => {
    setIsStreaming(true);
    setStreamingContent('');
    abortRef.current = new AbortController();

    bufferRef.current = new StreamingBuffer((content) => {
      setStreamingContent(prev => prev + content);
    }, options.flushInterval || 50);

    bufferRef.current.start();

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: abortRef.current.signal
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const lines = text.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') break;
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                bufferRef.current.append(parsed.content);
              } else if (parsed.status) {
                bufferRef.current.append(`[${parsed.status}]\n`);
              } else if (parsed.progress) {
                bufferRef.current.append(`[进度: ${parsed.progress}%]\n`);
              } else if (parsed.imageUrl) {
                bufferRef.current.flush();
                setStreamingContent(prev => prev + `\n![image](${parsed.imageUrl})`);
              }
            } catch {
              bufferRef.current.append(data);
            }
          }
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        bufferRef.current.append(`\n[错误: ${err.message}]`);
      }
    } finally {
      bufferRef.current.end();
      setIsStreaming(false);
    }
  }, []);

  const stopStream = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
    if (bufferRef.current) {
      bufferRef.current.end();
    }
    setIsStreaming(false);
  }, []);

  return { streamingContent, isStreaming, startStream, stopStream };
}

export function useImageGenerationStream() {
  const [results, setResults] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const abortRef = useRef(null);

  const generate = useCallback(async (url, body) => {
    setIsGenerating(true);
    setProgress(0);
    setStatusText('准备中...');
    abortRef.current = new AbortController();

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: abortRef.current.signal
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${response.status}`);
      }

      const contentType = response.headers.get('content-type') || '';

      if (contentType.includes('text/event-stream')) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.progress) setProgress(parsed.progress);
              if (parsed.status) setStatusText(parsed.status);
              if (parsed.imageUrl) {
                setResults(prev => [...prev, {
                  id: parsed.id || `img_${Date.now()}`,
                  imageUrl: parsed.imageUrl,
                  prompt: body.prompt,
                  model: body.model,
                  resolution: body.resolution || body.size,
                  timestamp: Date.now()
                }]);
              }
            } catch { /* ignore */ }
          }
        }
      } else {
        const data = await response.json();
        if (data.success && data.imageUrl) {
          setResults(prev => [...prev, {
            id: data.id || `img_${Date.now()}`,
            imageUrl: data.imageUrl,
            prompt: body.prompt,
            model: body.model,
            resolution: body.resolution || body.size,
            timestamp: Date.now()
          }]);
        } else if (data.success && data.images) {
          const newResults = data.images.map((img, i) => ({
            id: img.id || `img_${Date.now()}_${i}`,
            imageUrl: img.url || img.imageUrl,
            prompt: body.prompt,
            model: body.model,
            resolution: body.resolution || body.size,
            timestamp: Date.now()
          }));
          setResults(prev => [...prev, ...newResults]);
        }
        if (data.cost) {
          setResults(prev => prev.map((r, i) =>
            i === prev.length - 1 ? { ...r, cost: data.cost } : r
          ));
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setStatusText(`生成失败: ${err.message}`);
      }
    } finally {
      setIsGenerating(false);
      setProgress(100);
    }
  }, []);

  const stop = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    setIsGenerating(false);
  }, []);

  const clearResults = useCallback(() => setResults([]), []);

  return { results, isGenerating, progress, statusText, generate, stop, clearResults };
}

export default useImageGenerationStream;
