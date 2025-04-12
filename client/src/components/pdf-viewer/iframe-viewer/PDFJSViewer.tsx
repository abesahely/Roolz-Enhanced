import React, { useState, useEffect, useRef } from 'react';
import { BRAND_COLORS } from '@/lib/constants';
import { pdfjs } from 'react-pdf';

// Debug logger for PDF viewer issues
const debugPDFViewer = (message: string, data?: any) => {
  console.log(`[PDFViewer Debug] ${message}`, data || '');
};

// Set worker path for PDF.js - use public file that we copied from node_modules
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.js';

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

  // Generate blob URL or ArrayBuffer when file changes
  useEffect(() => {
    if (!file) {
      debugPDFViewer('No file provided');
      return;
    }
    
    // Track URLs to clean up
    let currentBlobUrl: string | null = null;
    
    try {
      // Log file information for debugging
      debugPDFViewer('Processing file', {
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: new Date(file.lastModified).toISOString()
      });
      
      // Validate file type
      if (file.type !== 'application/pdf') {
        setError(`Invalid file type: ${file.type || 'unknown'}. Please upload a PDF file.`);
        setIsLoading(false);
        return;
      }
      
      // Instead of using a blob URL, read the file as an ArrayBuffer
      const reader = new FileReader();
      
      reader.onload = function(e) {
        if (e.target && e.target.result) {
          try {
            // Create blob URL for the PDF from the ArrayBuffer
            debugPDFViewer('File read successfully as ArrayBuffer');
            const arrayBuffer = e.target.result;
            const blob = new Blob([arrayBuffer as ArrayBuffer], { type: 'application/pdf' });
            
            // Clean up any previous URL first
            if (pdfUrl) {
              debugPDFViewer('Cleaning up existing URL before creating new one', pdfUrl);
              URL.revokeObjectURL(pdfUrl);
            }
            
            // Create new URL
            const blobUrl = URL.createObjectURL(blob);
            debugPDFViewer('Created new blob URL from ArrayBuffer', blobUrl);
            currentBlobUrl = blobUrl;
            
            // Set the URL state
            setPdfUrl(blobUrl);
          } catch (blobErr) {
            console.error('Error creating blob from ArrayBuffer:', blobErr);
            setError(`Error preparing PDF: ${blobErr instanceof Error ? blobErr.message : 'Unknown error'}`);
            setIsLoading(false);
          }
        } else {
          setError('Failed to read file content. The file may be corrupted.');
          setIsLoading(false);
        }
      };
      
      reader.onerror = function(e) {
        console.error('Error reading file:', e);
        debugPDFViewer('Error reading file', e);
        setError('Failed to read PDF file. Please try again with a different file.');
        setIsLoading(false);
      };
      
      // Add timeout for large files
      const timeoutId = setTimeout(() => {
        if (isLoading) {
          debugPDFViewer('File reading operation timed out');
          setError('File processing took too long. The file may be too large or corrupted.');
          setIsLoading(false);
        }
      }, 30000); // 30 second timeout
      
      // Read the file as an ArrayBuffer
      reader.readAsArrayBuffer(file);
      
      // Return cleanup function
      return () => {
        clearTimeout(timeoutId);
        if (currentBlobUrl) {
          debugPDFViewer('Cleaning up blob URL on unmount', currentBlobUrl);
          URL.revokeObjectURL(currentBlobUrl);
        }
      };
    } catch (err) {
      console.error('Error processing PDF file:', err);
      debugPDFViewer('Error in file processing', err);
      setError(`Failed to process PDF: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setIsLoading(false);
    }
  }, [file, pdfUrl]);
  
  // Load PDF document when URL is available
  useEffect(() => {
    if (!pdfUrl) return;
    
    debugPDFViewer('Loading PDF document from URL', pdfUrl);
    setIsLoading(true);
    
    console.log('Ensuring worker is configured correctly');
    console.log('Current worker path:', pdfjs.GlobalWorkerOptions.workerSrc);
    
    // Set worker configuration - force override with static file
    // This eliminates dependency on properly configured global worker
    const workerSrc = '/pdf.worker.js';
    debugPDFViewer('Explicitly setting worker source to:', workerSrc);
    pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
    
    // Create cleanup function for effect
    const cleanup = () => {
      // Clean up PDF document when component unmounts or URL changes
      if (pdfDocRef.current) {
        debugPDFViewer('Cleaning up PDF document');
        pdfDocRef.current.destroy();
        pdfDocRef.current = null;
      }
    };
    
    // Fallback function for URL-based loading
    const fallbackToUrlLoading = () => {
      // Only proceed if pdfUrl is still valid
      if (!pdfUrl) {
        setError('PDF URL is no longer valid');
        setIsLoading(false);
        return;
      }
      
      debugPDFViewer('Using URL-based loading fallback');
      try {
        // Type assertion to ensure pdfUrl is treated as string
        const url = pdfUrl as string;
        const loadingTask = pdfjs.getDocument({
          url,
          useWorkerFetch: false
        });
        
        loadingTask.promise
          .then(pdfDoc => {
            debugPDFViewer('PDF document loaded successfully via fallback', {
              numPages: pdfDoc.numPages
            });
            
            pdfDocRef.current = pdfDoc;
            setNumPages(pdfDoc.numPages);
            setIsLoading(false);
            
            // Render the initial page
            renderPage(initialPage);
          })
          .catch(err => {
            console.error('Error loading PDF document (fallback):', err);
            debugPDFViewer('Error loading PDF (fallback)', err.message || err);
            setError(`Failed to load PDF: ${err.message || 'Unknown error'}`);
            setIsLoading(false);
          });
      } catch (err) {
        console.error('Error in fallback loading:', err);
        setError(`Failed to initialize PDF loading: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setIsLoading(false);
      }
    };
    
    // Try to use direct ArrayBuffer data loading instead of URL
    // This often resolves issues with cross-origin restrictions
    try {
      fetch(pdfUrl)
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => {
          // Load the document with explicit type safety and data buffer
          debugPDFViewer('Got array buffer, loading PDF directly');
          return pdfjs.getDocument({
            data: arrayBuffer,
            // Disable worker to use main thread if worker fails
            useWorkerFetch: false,
            // Add additional options for improved parsing
            enableXfa: true
          }).promise;
        })
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
          console.error('Error fetching/loading PDF:', err);
          debugPDFViewer('Error fetching/loading PDF:', err.message || err);
          
          // Fall back to URL-based loading
          debugPDFViewer('Falling back to URL-based loading');
          fallbackToUrlLoading();
        });
    } catch (err) {
      console.error('Error in fetch approach:', err);
      fallbackToUrlLoading();
    }
    
    // Return cleanup function
    return cleanup;
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