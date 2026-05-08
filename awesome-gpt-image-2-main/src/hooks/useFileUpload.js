import { useState, useCallback, useRef } from 'react';

export function useFileUpload({ accept = 'image/jpeg,image/png', maxCount = 10, maxSize = 10 * 1024 * 1024 } = {}) {
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const validateFile = useCallback((file) => {
    if (accept && !accept.split(',').some(type => file.type === type.trim())) {
      return `不支持的文件格式，请上传 ${accept.replace(/image\//g, '').toUpperCase()} 格式`;
    }
    if (file.size > maxSize) {
      return `文件大小超过限制（最大 ${Math.round(maxSize / 1024 / 1024)}MB）`;
    }
    return null;
  }, [accept, maxSize]);

  const createPreview = useCallback((file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.readAsDataURL(file);
    });
  }, []);

  const addFiles = useCallback(async (fileList) => {
    setError(null);
    const newFiles = Array.from(fileList);
    const remaining = maxCount - files.length;

    if (remaining <= 0) {
      setError(`最多上传 ${maxCount} 个文件`);
      return;
    }

    const toAdd = newFiles.slice(0, remaining);
    const errors = [];
    const validFiles = [];
    const validPreviews = [];

    for (const file of toAdd) {
      const err = validateFile(file);
      if (err) {
        errors.push(`${file.name}: ${err}`);
      } else {
        validFiles.push(file);
        const preview = await createPreview(file);
        validPreviews.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          name: file.name,
          url: preview,
          file,
          size: file.size
        });
      }
    }

    if (errors.length > 0) {
      setError(errors.join('\n'));
    }

    setFiles(prev => [...prev, ...validFiles]);
    setPreviews(prev => [...prev, ...validPreviews]);
  }, [files, maxCount, validateFile, createPreview]);

  const removeFile = useCallback((id) => {
    const index = previews.findIndex(p => p.id === id);
    if (index !== -1) {
      setFiles(prev => prev.filter((_, i) => i !== index));
      setPreviews(prev => prev.filter(p => p.id !== id));
    }
  }, [previews]);

  const clearFiles = useCallback(() => {
    setFiles([]);
    setPreviews([]);
    setError(null);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) {
      addFiles(e.dataTransfer.files);
    }
  }, [addFiles]);

  const handleClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleChange = useCallback((e) => {
    if (e.target.files?.length) {
      addFiles(e.target.files);
      e.target.value = '';
    }
  }, [addFiles]);

  return {
    files,
    previews,
    isDragging,
    error,
    inputRef,
    addFiles,
    removeFile,
    clearFiles,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleClick,
    handleChange,
    hasFiles: files.length > 0,
    fileCount: files.length,
    canAddMore: files.length < maxCount
  };
}
