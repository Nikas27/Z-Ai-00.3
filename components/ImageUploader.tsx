import React, { useState, useRef, useCallback } from 'react';

interface ImageUploaderProps {
  onImageUpload: (fileData: { base64: string; mime: string; dataUrl: string } | null) => void;
  disabled: boolean;
  persistedPreviewUrl: string | null;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, disabled, persistedPreviewUrl }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback((file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        const base64String = dataUrl.split(',')[1];
        if (base64String) {
          onImageUpload({ base64: base64String, mime: file.type, dataUrl });
        }
      };
      reader.readAsDataURL(file);
    }
  }, [onImageUpload]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleClear = () => {
    onImageUpload(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled) return;
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  if (persistedPreviewUrl) {
    return (
      <div className="relative">
        <img src={persistedPreviewUrl} alt="Preview" className="w-full h-auto rounded-lg" />
        <button
          onClick={handleClear}
          disabled={disabled}
          className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-2 hover:bg-black/80 transition-colors disabled:opacity-50"
          aria-label="Remove image"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
        </button>
      </div>
    );
  }

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`relative flex flex-col items-center justify-center w-full h-full p-4 text-center border-2 border-dashed rounded-lg transition-colors duration-200
        ${disabled ? 'cursor-not-allowed bg-gray-200/50 dark:bg-gray-800/50 border-gray-300 dark:border-gray-700' : 'cursor-pointer'}
        ${isDragging ? 'border-cyan-400 bg-cyan-50 dark:bg-cyan-900/20' : 'border-gray-400 dark:border-gray-600 hover:border-gray-500 dark:hover:border-gray-500 bg-gray-100 dark:bg-gray-800/50'}`}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="sr-only"
        id="image-upload"
        disabled={disabled}
      />
      <label htmlFor="image-upload" className={`flex flex-col items-center justify-center ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-10 w-10 mb-2 ${isDragging ? 'text-cyan-400' : 'text-gray-400 dark:text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
        <p className={`font-semibold ${isDragging ? 'text-cyan-600 dark:text-cyan-300' : 'text-gray-700 dark:text-gray-300'}`}>
          Click to upload or drag & drop
        </p>
        <p className="text-xs text-gray-500">PNG, JPG, WEBP, etc.</p>
      </label>
    </div>
  );
};

export default ImageUploader;