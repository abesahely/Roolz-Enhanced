import React from 'react';
import { BRAND_COLORS } from '../../utils/constants';

interface LoadingStateProps {
  message?: string;
  className?: string;
}

/**
 * LoadingState component
 * 
 * Displays a loading indicator with an optional message
 * while PDF content is being loaded or processed.
 */
const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading PDF document...',
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
      {/* Loading spinner */}
      <div className="mb-4">
        <svg 
          className="animate-spin -ml-1 mr-3 h-10 w-10" 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24"
          style={{ color: BRAND_COLORS.ORANGE }}
        >
          <circle 
            className="opacity-25" 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="currentColor" 
            strokeWidth="4"
          />
          <path 
            className="opacity-75" 
            fill="currentColor" 
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
      
      {/* Loading message */}
      <p className="text-center text-lg" style={{ color: BRAND_COLORS.NAVY_BLUE }}>
        {message}
      </p>
      
      {/* Loading progress dots */}
      <div className="flex mt-2 space-x-2">
        <div className="loading-dot w-2 h-2 rounded-full animate-pulse" 
          style={{ backgroundColor: BRAND_COLORS.ORANGE, animationDelay: '0ms' }} />
        <div className="loading-dot w-2 h-2 rounded-full animate-pulse" 
          style={{ backgroundColor: BRAND_COLORS.ORANGE, animationDelay: '300ms' }} />
        <div className="loading-dot w-2 h-2 rounded-full animate-pulse" 
          style={{ backgroundColor: BRAND_COLORS.ORANGE, animationDelay: '600ms' }} />
      </div>
    </div>
  );
};

export default LoadingState;