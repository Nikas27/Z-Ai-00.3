
import React from 'react';

interface SpinnerProps {
  className?: string;
}

const Spinner: React.FC<SpinnerProps> = ({ className = 'w-16 h-16 text-cyan-400' }) => {
  return (
    <svg 
      className={className} 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 100 100" 
      preserveAspectRatio="xMidYMid"
      fill="none"
      stroke="currentColor"
    >
      <circle cx="50" cy="50" r="40" strokeWidth="8" strokeDasharray="160 80" strokeLinecap="round">
        <animateTransform 
          attributeName="transform" 
          type="rotate" 
          repeatCount="indefinite" 
          dur="1.5s" 
          values="0 50 50;360 50 50" 
          keyTimes="0;1"
        ></animateTransform>
      </circle>
    </svg>
  );
};

export default Spinner;
