import React from 'react';
import { PDFProvider } from '../../context/PDFContext';
import { AnnotationProvider } from '../../context/AnnotationContext';
import { MobileProvider } from '../../context/MobileContext';
import ErrorBoundary from '../ErrorBoundary';
import PDFDocument from '../PDFDocument';
import PDFControlBar from '../PDFControlBar';
import AnnotationLayerContainer from '../../annotations/AnnotationLayerContainer';

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