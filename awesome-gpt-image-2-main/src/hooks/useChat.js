import { useState, useCallback, useRef } from 'react';

export function useChat() {
  const [messages, setMessages] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentModel, setCurrentModel] = useState('gpt-image-2');
  const [currentCategory, setCurrentCategory] = useState('image');
  const messagesEndRef = useRef(null);

  const generateId = () => `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const addMessage = useCallback((message) => {
    const newMessage = {
      id: generateId(),
      timestamp: Date.now(),
      status: 'completed',
      ...message
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage.id;
  }, []);

  const addUserMessage = useCallback((content, attachments = []) => {
    return addMessage({
      role: 'user',
      type: 'text',
      content,
      attachments
    });
  }, [addMessage]);

  const addAssistantMessage = useCallback((content, type = 'text', results = []) => {
    return addMessage({
      role: 'assistant',
      type,
      content,
      results,
      model: currentModel
    });
  }, [addMessage, currentModel]);

  const addPendingMessage = useCallback((content, type = 'image') => {
    const id = generateId();
    const pendingMsg = {
      id,
      role: 'assistant',
      type,
      content: content || '生成中...',
      status: 'generating',
      timestamp: Date.now(),
      model: currentModel
    };
    setMessages(prev => [...prev, pendingMsg]);
    return id;
  }, [currentModel]);

  const updateMessage = useCallback((id, updates) => {
    setMessages(prev => prev.map(msg =>
      msg.id === id ? { ...msg, ...updates } : msg
    ));
  }, []);

  const completeMessage = useCallback((id, results, content) => {
    setMessages(prev => prev.map(msg =>
      msg.id === id
        ? { ...msg, status: 'completed', results, content: content || msg.content }
        : msg
    ));
  }, []);

  const failMessage = useCallback((id, error) => {
    setMessages(prev => prev.map(msg =>
      msg.id === id
        ? { ...msg, status: 'failed', content: error || '生成失败', type: 'error' }
        : msg
    ));
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  return {
    messages,
    isGenerating,
    setIsGenerating,
    currentModel,
    setCurrentModel,
    currentCategory,
    setCurrentCategory,
    messagesEndRef,
    addMessage,
    addUserMessage,
    addAssistantMessage,
    addPendingMessage,
    updateMessage,
    completeMessage,
    failMessage,
    clearMessages,
    scrollToBottom
  };
}
