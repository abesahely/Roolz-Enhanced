import React, { useEffect, useState } from 'react';
import { PDFProvider } from '../../context/PDFContext';
import { AnnotationProvider } from '../../context/AnnotationContext';
import { MobileProvider } from '../../context/MobileContext';
import ErrorBoundary from '../ErrorBoundary';
import PDFDocument from '../PDFDocument';
import PDFControlBar from '../PDFControlBar';
import AnnotationLayerContainer from '../../annotations/AnnotationLayerContainer';
import { initializeWorker, isWorkerInitialized, isWorkerInitializing } from '../../utils/pdfWorkerLoader';

export interface PDFViewerContainerProps {
  /**
   * PDF file to display
   */
  file: File | null;
  
  /**
   * Callback when the viewer is closed
   */
  onClose: () => void;
  
  /**
   * Enable annotations (default: true)
   */
  enableAnnotations?: boolean;
  
  /**
   * Initial page to display (default: 1)
   */
  initialPage?: number;
  
  /**
   * Callback when the page changes
   */
  onPageChange?: (pageNumber: number) => void;
  
  /**
   * Callback when the PDF is saved with annotations
   */
  onSaveWithAnnotations?: () => void;
  
  /**
   * Custom error fallback component
   */
  errorFallback?: React.ReactNode;
  
  /**
   * Additional class names
   */
  className?: string;
}

/**
 * Main container component for the PDF viewer
 * 
 * This component sets up all required context providers and
 * renders the core PDF viewing experience with annotation capabilities.
 */
const PDFViewerContainer: React.FC<PDFViewerContainerProps> = ({
  file,
  onClose,
  enableAnnotations = true,
  initialPage = 1,
  onPageChange,
  onSaveWithAnnotations,
  errorFallback,
  className = ''
}) => {
  // State to track worker initialization
  const [workerReady, setWorkerReady] = useState<boolean>(isWorkerInitialized());
  const [workerError, setWorkerError] = useState<Error | null>(null);
  
  // Initialize PDF.js worker when the component mounts
  // This ensures the worker is available before any PDF operations
  useEffect(() => {
    const checkAndInitializeWorker = async () => {
      // Skip if already ready or initializing
      if (workerReady || isWorkerInitializing()) {
        return;
      }
      
      try {
        console.log('Initializing PDF.js worker from PDFViewerContainer...');
        const success = await initializeWorker();
        setWorkerReady(success);
        
        if (!success) {
          setWorkerError(new Error('Failed to initialize PDF.js worker'));
        }
      } catch (error) {
        console.error('Worker initialization failed in PDFViewerContainer:', error);
        setWorkerError(error instanceof Error ? error : new Error('Unknown worker initialization error'));
        setWorkerReady(false);
      }
    };
    
    checkAndInitializeWorker();
  }, []);
  
  // Show loading state if worker is not ready
  if (!workerReady && !isWorkerInitialized()) {
    return (
      <div className="flex items-center justify-center h-64 bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-4">
        <div className="text-center">
          <p className="mb-2">Initializing PDF viewer...</p>
          <div className="w-8 h-8 border-t-2 border-blue-500 rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }
  
  // Show error state if initialization failed
  if (workerError) {
    return (
      <div className="p-4 bg-red-500 bg-opacity-10 text-red-500 rounded-lg">
        <p className="font-bold">PDF Viewer Error</p>
        <p>{workerError.message}</p>
        <button 
          className="mt-2 px-3 py-1 bg-red-500 text-white rounded"
          onClick={() => window.location.reload()}
        >
          Reload Page
        </button>
      </div>
    );
  }

  return (
    <ErrorBoundary fallback={errorFallback}>
      <PDFProvider initialFile={file}>
        <MobileProvider>
          <AnnotationProvider>
            <div className={`pdf-viewer-container flex flex-col bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-4 shadow-lg ${className}`}>
              {/* Control Bar */}
              <PDFControlBar onClose={onClose} onSave={onSaveWithAnnotations} />
              
              {/* PDF Document & Annotation Layer */}
              <div className="relative flex-grow">
                <PDFDocument initialPage={initialPage} onPageChange={onPageChange} />
                
                {enableAnnotations && (
                  <AnnotationLayerContainer />
                )}
              </div>
            </div>
          </AnnotationProvider>
        </MobileProvider>
      </PDFProvider>
    </ErrorBoundary>
  );
};

export default PDFViewerContainer;