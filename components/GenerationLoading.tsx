import React from 'react';

interface GenerationLoadingProps {
  prompt: string;
}

const GenerationLoading: React.FC<GenerationLoadingProps> = ({ prompt }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 bg-gray-100 dark:bg-gray-800/50 rounded-lg min-h-[400px] animate-[fadeIn_0.5s_ease-in-out] overflow-hidden">
      
      <div className="relative w-48 h-48">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-full animate-morph animation-delay-2000 opacity-30"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-full animate-morph opacity-30"></div>
      </div>
      
      <h3 className="text-xl font-bold mt-8 text-gray-800 dark:text-gray-200 z-10">
        Generating your vision...
      </h3>
      {prompt && (
        <blockquote className="mt-4 p-3 max-w-lg bg-gray-200 dark:bg-gray-900/50 border-l-4 border-cyan-500 text-left text-sm text-gray-600 dark:text-gray-300 rounded-r-lg z-10">
          {prompt}
        </blockquote>
      )}
    </div>
  );
};

export default GenerationLoading;