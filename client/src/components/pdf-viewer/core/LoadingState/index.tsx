import React from 'react';
import { BRAND_COLORS } from '@/lib/constants';

interface LoadingStateProps {
  message?: string;
  className?: string;
}

/**
 * LoadingState component for PDF loading operations
 * 
 * Displays a spinner and optional message when the PDF is loading
 */
const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading PDF document...',
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 h-full ${className}`}>
      <div className="relative w-16 h-16 mb-4">
        {/* Outer ring */}
        <div 
          className="absolute inset-0 rounded-full animate-spin"
          style={{ 
            borderWidth: '3px',
            borderStyle: 'solid',
            borderColor: `${BRAND_COLORS.ORANGE} transparent transparent transparent`,
            animationDuration: '1.5s'
          }}
        />
        
        {/* Inner ring */}
        <div 
          className="absolute inset-0 rounded-full animate-spin"
          style={{ 
            margin: '8px',
            borderWidth: '3px',
            borderStyle: 'solid',
            borderColor: `${BRAND_COLORS.ORANGE} transparent transparent transparent`,
            animationDuration: '1.2s',
            animationDirection: 'reverse'
          }}
        />
      </div>
      
      <p 
        className="text-center font-medium"
        style={{ color: BRAND_COLORS.WHITE }}
      >
        {message}
      </p>
    </div>
  );
};

export default LoadingState;