import React, { Component, ErrorInfo, ReactNode } from 'react';
import { BRAND_COLORS, ERROR_MESSAGES } from '../../utils/constants';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
}

/**
 * ErrorBoundary component for catching errors in the PDF Viewer
 * 
 * This component catches errors in its child components and displays
 * a user-friendly error message instead of crashing the entire app.
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  // Define max retries as a class constant
  private readonly MAX_RETRIES = 3;
  
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      retryCount: 0
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to an error reporting service
    console.error('PDF Viewer error:', error);
    console.error('Error info:', errorInfo);
    
    // Categorize the error for better user feedback
    let errorMessage = ERROR_MESSAGES.GENERAL_ERROR;
    
    if (error.message.includes('PDF')) {
      errorMessage = ERROR_MESSAGES.FILE_LOAD_ERROR;
    } else if (error.message.includes('annotation') || error.message.includes('canvas')) {
      errorMessage = ERROR_MESSAGES.ANNOTATION_ERROR;
    }
    
    // Update state with the categorized error message
    this.setState({
      hasError: true,
      error: new Error(errorMessage),
      retryCount: 0 // Reset retry count on new errors
    });
  }
  
  // Use arrow function to avoid binding issues
  handleRetry = (): void => {
    const { retryCount } = this.state;
    
    if (retryCount < this.MAX_RETRIES) {
      // Reset error state and increment retry counter
      this.setState({
        hasError: false,
        error: null,
        retryCount: retryCount + 1
      });
      
      console.log(`Retry attempt ${retryCount + 1} of ${this.MAX_RETRIES}`);
    } else {
      console.error('Maximum retry attempts reached');
      // On max retries reached, just refresh the page
      window.location.reload();
    }
  };

  render() {
    const { hasError, error, retryCount } = this.state;
    const { children, fallback } = this.props;
    
    if (hasError) {
      // Custom fallback UI
      if (fallback) {
        return fallback;
      }

      // Default error UI
      return (
        <div className="flex flex-col items-center justify-center p-8 h-full bg-white bg-opacity-5 backdrop-blur-sm rounded-lg shadow-lg" 
             style={{ color: BRAND_COLORS.WHITE, backgroundColor: `${BRAND_COLORS.NAVY_BLUE}88` }}>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="w-16 h-16 text-orange-500 mb-4" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <h3 className="text-xl font-bold mb-2">Something went wrong</h3>
          <p className="text-center mb-4 opacity-80">
            {error?.message || ERROR_MESSAGES.GENERAL_ERROR}
          </p>
          
          {/* Retry attempt message if we've tried before */}
          {retryCount > 0 && (
            <p className="text-sm text-center mb-2 opacity-60">
              Retry attempt {retryCount} of {this.MAX_RETRIES}
            </p>
          )}
          
          <div className="flex flex-row space-x-3">
            {/* Try Again button - uses our retry handler */}
            <button 
              className="px-4 py-2 rounded-lg transition-colors" 
              style={{ 
                backgroundColor: BRAND_COLORS.ORANGE,
                color: BRAND_COLORS.WHITE
              }}
              onClick={this.handleRetry}
              disabled={retryCount >= this.MAX_RETRIES}
            >
              Try Again
            </button>
            
            {/* Reload Page button - hard reload */}
            <button 
              className="px-4 py-2 rounded-lg border border-white border-opacity-30 transition-colors hover:bg-white hover:bg-opacity-10" 
              style={{ 
                color: BRAND_COLORS.WHITE
              }}
              onClick={() => window.location.reload()}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return children;
  }
}

export default ErrorBoundary;