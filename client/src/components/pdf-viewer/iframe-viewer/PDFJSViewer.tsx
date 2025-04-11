import React, { useState, useEffect } from 'react';
import { BRAND_COLORS } from '@/lib/constants';

interface PDFJSViewerProps {
  /**
   * The PDF file to display
   */
  file: File | null;
  
  /**
   * Function called when the viewer is closed
   */
  onClose: () => void;
  
  /**
   * Initial page to display (default: 1)
   */
  initialPage?: number;
  
  /**
   * Optional page change handler
   */
  onPageChange?: (pageNumber: number) => void;
  
  /**
   * Additional class name for the container
   */
  className?: string;
}

/**
 * PDFJSViewer component
 * 
 * Uses the PDF.js pre-built viewer in an iframe to display PDFs with
 * beNext.io styling. The viewer is loaded from the official Mozilla CDN.
 */
export const PDFJSViewer: React.FC<PDFJSViewerProps> = ({
  file,
  onClose,
  initialPage = 1,
  onPageChange,
  className = ''
}) => {
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Generate viewer URL when file changes
  useEffect(() => {
    if (!file) return;
    
    try {
      // Create blob URL for the PDF
      const blobUrl = URL.createObjectURL(file);
      
      // Construct viewer URL with parameters - using our self-hosted viewer
      const baseViewerUrl = '/pdf-viewer/web/viewer.html';
      const viewerWithParams = `${baseViewerUrl}?file=${encodeURIComponent(blobUrl)}&base=${encodeURIComponent(window.location.origin)}#page=${initialPage}`;
      
      setViewerUrl(viewerWithParams);
      setIsLoading(false);
      
      return () => {
        // Clean up blob URL when component unmounts or changes
        URL.revokeObjectURL(blobUrl);
      };
    } catch (err) {
      console.error('Error creating blob URL for PDF:', err);
      setError('Failed to load PDF. Please try again.');
      setIsLoading(false);
    }
  }, [file, initialPage]);
  
  // Set up message listener for iframe communication
  useEffect(() => {
    if (!viewerUrl) return;
    
    const handleMessage = (event: MessageEvent) => {
      // Accept messages from our own origin
      if (event.origin !== window.location.origin) return;
      
      const data = event.data;
      
      // Handle various messages from the viewer
      if (typeof data === 'object' && data !== null) {
        switch (data.type) {
          case 'pagechange':
            if (onPageChange && typeof data.pageNumber === 'number') {
              onPageChange(data.pageNumber);
            }
            break;
          case 'documentloaded':
            console.log('PDF loaded successfully');
            setIsLoading(false);
            break;
          case 'error':
            console.error('PDF viewer error:', data.message);
            setError(data.message || 'Error displaying PDF');
            break;
        }
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [viewerUrl, onPageChange]);

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full w-full p-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading PDF viewer...</p>
        </div>
      </div>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-full w-full p-8 bg-white rounded-lg shadow-md">
        <div className="text-center text-red-500">
          <div className="mb-4">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor" 
              className="h-12 w-12 mx-auto"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium mb-2">Failed to load PDF</h3>
          <p>{error}</p>
          <button 
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
            style={{ backgroundColor: BRAND_COLORS.ORANGE }}
          >
            Close
          </button>
        </div>
      </div>
    );
  }
  
  // Render PDF viewer with toolbar
  if (!viewerUrl) {
    return (
      <div className="flex items-center justify-center h-full w-full p-8 bg-white rounded-lg shadow-md">
        <div className="text-center text-red-500">
          <p>No PDF file provided.</p>
          <button 
            onClick={onClose}
            className="mt-4 px-4 py-2 rounded hover:bg-gray-100"
          >
            Close
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`pdf-viewer-container flex flex-col h-full w-full ${className}`}>
      <div 
        className="pdf-viewer-toolbar flex items-center justify-between px-4 py-2"
        style={{ backgroundColor: BRAND_COLORS.NAVY }}
      >
        <div className="flex-1">
          <h3 className="text-white text-lg font-medium truncate">
            {file?.name || 'Document'}
          </h3>
        </div>
        <button 
          onClick={onClose}
          className="ml-4 px-3 py-1 rounded text-white hover:bg-white/10"
          aria-label="Close"
        >
          Close
        </button>
      </div>
      
      <div className="flex-1 relative">
        <iframe
          src={viewerUrl}
          title="PDF Viewer"
          className="pdf-viewer-iframe absolute inset-0 w-full h-full"
          style={{ border: 'none' }}
          sandbox="allow-scripts allow-same-origin allow-forms allow-downloads allow-popups"
        />
      </div>
    </div>
  );
};

export default PDFJSViewer;