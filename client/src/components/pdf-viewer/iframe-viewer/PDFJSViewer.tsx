import React, { useState, useEffect, useRef } from 'react';
import { BRAND_COLORS } from '@/lib/constants';
import { pdfjs } from 'react-pdf';

// Debug logger for PDF viewer issues
const debugPDFViewer = (message: string, data?: any) => {
  console.log(`[PDFViewer Debug] ${message}`, data || '');
};

// Set worker path for PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = '/node_modules/pdfjs-dist/build/pdf.worker.min.js';

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
 * A simple React-based PDF viewer using the installed pdfjs-dist version.
 * This approach avoids version mismatches between viewer and worker.
 */
export const PDFJSViewer: React.FC<PDFJSViewerProps> = ({
  file,
  onClose,
  initialPage = 1,
  onPageChange,
  className = ''
}) => {
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [numPages, setNumPages] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pageRendering, setPageRendering] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pdfDocRef = useRef<any>(null);

  // Generate blob URL when file changes
  useEffect(() => {
    if (!file) {
      debugPDFViewer('No file provided');
      return;
    }
    
    try {
      // Log file information for debugging
      debugPDFViewer('Processing file', {
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: new Date(file.lastModified).toISOString()
      });
      
      // Create blob URL for the PDF
      const blobUrl = URL.createObjectURL(file);
      debugPDFViewer('Created blob URL', blobUrl);
      setPdfUrl(blobUrl);
      
      return () => {
        // Clean up blob URL when component unmounts or changes
        debugPDFViewer('Cleaning up blob URL', blobUrl);
        URL.revokeObjectURL(blobUrl);
      };
    } catch (err) {
      console.error('Error creating blob URL for PDF:', err);
      debugPDFViewer('Error in URL creation', err);
      setError('Failed to load PDF. Please try again.');
      setIsLoading(false);
    }
  }, [file]);
  
  // Load PDF document when URL is available
  useEffect(() => {
    if (!pdfUrl) return;
    
    debugPDFViewer('Loading PDF document from URL', pdfUrl);
    setIsLoading(true);
    
    const loadingTask = pdfjs.getDocument(pdfUrl);
    
    loadingTask.promise
      .then(pdfDoc => {
        debugPDFViewer('PDF document loaded successfully', {
          numPages: pdfDoc.numPages
        });
        
        pdfDocRef.current = pdfDoc;
        setNumPages(pdfDoc.numPages);
        setIsLoading(false);
        
        // Render the initial page
        renderPage(initialPage);
      })
      .catch(err => {
        console.error('Error loading PDF document:', err);
        debugPDFViewer('Error loading PDF', err);
        setError('Failed to load PDF. Please try again.');
        setIsLoading(false);
      });
      
    return () => {
      // Clean up PDF document when component unmounts or URL changes
      if (pdfDocRef.current) {
        debugPDFViewer('Cleaning up PDF document');
        pdfDocRef.current.destroy();
        pdfDocRef.current = null;
      }
    };
  }, [pdfUrl, initialPage]);
  
  // Function to render a specific page
  const renderPage = (pageNum: number) => {
    if (!pdfDocRef.current || !canvasRef.current) return;
    
    const pdfDoc = pdfDocRef.current;
    if (pageNum < 1 || pageNum > pdfDoc.numPages) {
      console.warn(`Invalid page number: ${pageNum}`);
      return;
    }
    
    setPageRendering(true);
    
    // Update current page
    setCurrentPage(pageNum);
    if (onPageChange) {
      onPageChange(pageNum);
    }
    
    // Fetch the page
    pdfDoc.getPage(pageNum).then((page: any) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const context = canvas.getContext('2d');
      if (!context) return;
      
      // Determine viewport dimensions to fit container
      const viewport = page.getViewport({ scale: 1.0 });
      const containerWidth = canvas.parentElement?.clientWidth || 800;
      const scale = containerWidth / viewport.width;
      const scaledViewport = page.getViewport({ scale });
      
      // Set canvas dimensions
      canvas.height = scaledViewport.height;
      canvas.width = scaledViewport.width;
      
      // Render the page
      const renderContext = {
        canvasContext: context,
        viewport: scaledViewport
      };
      
      const renderTask = page.render(renderContext);
      
      renderTask.promise.then(() => {
        setPageRendering(false);
        debugPDFViewer('Page rendered successfully', {
          pageNum,
          scale,
          width: scaledViewport.width,
          height: scaledViewport.height
        });
      }).catch((err: any) => {
        console.error('Error rendering page:', err);
        setPageRendering(false);
        setError(`Failed to render page ${pageNum}`);
      });
    });
  };
  
  // Handle next/previous page navigation
  const goToPreviousPage = () => {
    if (currentPage > 1 && !pageRendering) {
      renderPage(currentPage - 1);
    }
  };
  
  const goToNextPage = () => {
    if (currentPage < numPages && !pageRendering) {
      renderPage(currentPage + 1);
    }
  };

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
        <div className="flex items-center space-x-2 mr-4">
          <button 
            onClick={goToPreviousPage}
            disabled={currentPage <= 1 || pageRendering}
            className="px-3 py-1 rounded text-white hover:bg-white/10 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-white">
            Page {currentPage} of {numPages}
          </span>
          <button 
            onClick={goToNextPage}
            disabled={currentPage >= numPages || pageRendering}
            className="px-3 py-1 rounded text-white hover:bg-white/10 disabled:opacity-50"
          >
            Next
          </button>
        </div>
        <button 
          onClick={onClose}
          className="px-3 py-1 rounded text-white hover:bg-white/10"
          aria-label="Close"
        >
          Close
        </button>
      </div>
      
      <div className="flex-1 overflow-auto bg-gray-100 p-4 flex justify-center">
        <canvas 
          ref={canvasRef} 
          className="shadow-lg"
        />
      </div>
    </div>
  );
};

export default PDFJSViewer;