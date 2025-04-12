import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BRAND_COLORS } from '@/lib/constants';

// Import PDF.js directly from node_modules WITHOUT using react-pdf
// This ensures we're using the version that's actually installed (3.11.174)
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';

// For TypeScript, we'll use 'any' types to avoid type conflicts
// The specific PDF.js types can cause issues with different versions
interface SimplePDFDocumentProxy {
  numPages: number;
  getPage: (pageNumber: number) => Promise<any>;
  destroy: () => Promise<void>;
}

// Debug logger for PDF viewer issues
const debugPDFViewer = (message: string, data?: any) => {
  console.log(`[DirectPDFViewer] ${message}`, data || '');
};

// Set worker path to our copied worker file from node_modules
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.js';

interface DirectPDFViewerProps {
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
   * Optional canvas ready handler for annotation support
   */
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
  
  /**
   * Optional handler for saving annotations
   */
  onSaveWithAnnotations?: () => void;
  
  /**
   * Additional class name for the container
   */
  className?: string;
}

/**
 * DirectPDFViewer component
 * 
 * A direct PDF.js implementation that doesn't rely on react-pdf
 * to avoid version conflicts between packages.
 */
export const DirectPDFViewer: React.FC<DirectPDFViewerProps> = ({
  file,
  onClose,
  initialPage = 1,
  onPageChange,
  onCanvasReady,
  onSaveWithAnnotations,
  className = ''
}) => {
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [numPages, setNumPages] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pageRendering, setPageRendering] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pdfDocRef = useRef<any>(null);
  const pdfArrayBufferRef = useRef<ArrayBuffer | null>(null);
  // Store the current render task to cancel it if needed
  const renderTaskRef = useRef<any>(null);
  // Keep track of the file ID to prevent unnecessary reprocessing
  const previousFileIdRef = useRef<string | null>(null);
  
  // Cleanup function for component unmount
  useEffect(() => {
    return () => {
      // Cancel any ongoing render tasks
      if (renderTaskRef.current) {
        debugPDFViewer('Cancelling render task on cleanup');
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }
      
      // Destroy any loaded PDF documents
      if (pdfDocRef.current) {
        debugPDFViewer('Destroying PDF document on cleanup');
        pdfDocRef.current.destroy().catch((err: Error) => {
          console.error("Error destroying PDF:", err);
        });
        pdfDocRef.current = null;
      }
    };
  }, []);
  
  // Handle window resize to re-render the current page with the correct scale
  useEffect(() => {
    if (!pdfDocRef.current || currentPage <= 0) return;
    
    // Debounced resize handler function
    const resizeTimeoutRef = {current: null as number | null};
    
    const handleResize = () => {
      // Cancel previous timeout if it exists
      if (resizeTimeoutRef.current !== null) {
        window.clearTimeout(resizeTimeoutRef.current);
      }
      
      // Set new timeout
      resizeTimeoutRef.current = window.setTimeout(() => {
        debugPDFViewer('Window resized, re-rendering current page');
        if (currentPage > 0) {
          renderPage(currentPage);
        }
      }, 100);
    };
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeTimeoutRef.current !== null) {
        window.clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, [currentPage]);

  // Step 1: Load the File as an ArrayBuffer and store it in a ref
  useEffect(() => {
    if (!file) {
      debugPDFViewer('No file provided');
      return;
    }
    
    // Prevent reprocessing the same file unnecessarily
    const fileId = `${file.name}-${file.size}-${file.lastModified}`;
    
    if (previousFileIdRef.current === fileId) {
      debugPDFViewer('Same file detected, skipping reprocessing');
      return;
    }
    
    previousFileIdRef.current = fileId;
    
    debugPDFViewer('Processing new file', {
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: new Date(file.lastModified).toISOString()
    });
    
    // Clear any existing document
    if (pdfDocRef.current) {
      pdfDocRef.current.destroy().catch((err: Error) => {
        console.error("Error destroying PDF:", err);
      });
      pdfDocRef.current = null;
    }
    
    // Cancel any ongoing render tasks
    if (renderTaskRef.current) {
      renderTaskRef.current.cancel();
      renderTaskRef.current = null;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Validate file type
      if (file.type !== 'application/pdf') {
        setError(`Invalid file type: ${file.type || 'unknown'}. Please upload a PDF file.`);
        setIsLoading(false);
        return;
      }
      
      // Read the file as an ArrayBuffer
      const reader = new FileReader();
      
      reader.onload = function(e) {
        if (e.target && e.target.result) {
          try {
            debugPDFViewer('File read successfully as ArrayBuffer');
            // Store ArrayBuffer reference directly
            pdfArrayBufferRef.current = e.target.result as ArrayBuffer;
            
            // Immediately load the PDF from this array buffer
            loadPdfFromArrayBuffer();
          } catch (err) {
            console.error('Error processing array buffer:', err);
            setError(`Error processing PDF: ${err instanceof Error ? err.message : 'Unknown error'}`);
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
      
      // We don't need a timeout since we handle loading states properly
      // and the FileReader API already has error handling
      
      // Read the file as an ArrayBuffer
      reader.readAsArrayBuffer(file);
    } catch (err) {
      console.error('Error processing PDF file:', err);
      debugPDFViewer('Error in file processing', err);
      setError(`Failed to process PDF: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setIsLoading(false);
    }
  }, [file]); 
  
  // Function to load PDF from ArrayBuffer
  const loadPdfFromArrayBuffer = () => {
    if (!pdfArrayBufferRef.current) {
      setError('No PDF data available');
      setIsLoading(false);
      return;
    }
    
    debugPDFViewer('Loading PDF from ArrayBuffer');
    
    try {
      // Load the document directly from the array buffer
      pdfjsLib.getDocument({ data: pdfArrayBufferRef.current }).promise
        .then((pdfDoc: any) => {
          debugPDFViewer('PDF document loaded successfully', {
            numPages: pdfDoc.numPages
          });
          
          pdfDocRef.current = pdfDoc;
          setNumPages(pdfDoc.numPages);
          setIsLoading(false);
          
          // Add a small delay before rendering the initial page
          // This gives React time to update the DOM with components
          // from the non-loading state before we attempt to render
          setTimeout(() => {
            // Force render the initial page
            if (pdfDocRef.current && canvasRef.current) {
              debugPDFViewer(`Rendering initial page ${initialPage}`);
              renderPage(initialPage);
            }
          }, 50);
        })
        .catch((err: Error) => {
          console.error('Error loading PDF document:', err);
          debugPDFViewer('Error loading PDF', err.message);
          setError(`Failed to load PDF: ${err.message}`);
          setIsLoading(false);
        });
    } catch (err) {
      console.error('Error initializing PDF loading:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to initialize PDF: ${errorMessage}`);
      setIsLoading(false);
    }
  };
  
  // Function to render a specific page
  const renderPage = (pageNum: number) => {
    if (!pdfDocRef.current || !canvasRef.current) return;
    
    const pdfDoc = pdfDocRef.current;
    if (pageNum < 1 || pageNum > pdfDoc.numPages) {
      console.warn(`Invalid page number: ${pageNum}`);
      return;
    }
    
    // If there's an ongoing render task, cancel it
    if (renderTaskRef.current) {
      debugPDFViewer('Cancelling previous render task');
      renderTaskRef.current.cancel();
      renderTaskRef.current = null;
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
      
      // Clear the canvas to prevent artifacts
      context.clearRect(0, 0, canvas.width, canvas.height);
      
      // Determine viewport dimensions to fit container
      const viewport = page.getViewport({ scale: 1.0 });
      
      // Calculate available width and height in the container
      const containerWidth = canvas.parentElement?.clientWidth || 800;
      const containerHeight = canvas.parentElement?.clientHeight || 600;
      
      // Determine scale to fit in the container (account for padding)
      const horizontalScale = (containerWidth - 40) / viewport.width;
      const verticalScale = (containerHeight - 40) / viewport.height;
      
      // Calculate appropriate scale based on device width
      let scale;
      
      // On wider screens (like desktops), prioritize using more width
      if (window.innerWidth > 1024) {
        // For larger screens, prefer horizontal scale with a max of 1.5
        scale = Math.min(horizontalScale, Math.max(verticalScale, 1.0), 1.5);
      } else if (window.innerWidth > 768) {
        // For medium screens, balance both dimensions but still favor width
        scale = Math.min(horizontalScale, verticalScale * 1.1, 1.2);
      } else {
        // For mobile, ensure it fits in both dimensions
        scale = Math.min(horizontalScale, verticalScale, 1.0);
      }
      
      // Enforce minimum scale to prevent tiny rendering
      scale = Math.max(scale, 0.4);
      
      const scaledViewport = page.getViewport({ scale });
      
      // Set canvas dimensions
      canvas.height = scaledViewport.height;
      canvas.width = scaledViewport.width;
      
      // Render the page
      const renderContext = {
        canvasContext: context,
        viewport: scaledViewport
      };
      
      try {
        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;
        
        renderTask.promise.then(() => {
          // Only proceed if this is still the current render task
          if (renderTaskRef.current === renderTask) {
            setPageRendering(false);
            debugPDFViewer('Page rendered successfully', {
              pageNum,
              scale,
              width: scaledViewport.width,
              height: scaledViewport.height
            });
            
            // Notify parent when canvas is ready for annotations
            if (onCanvasReady && canvas) {
              debugPDFViewer('Notifying parent component that canvas is ready');
              onCanvasReady(canvas);
            }
            
            renderTaskRef.current = null;
          }
        }).catch((err: Error) => {
          // Only process error if not cancelled
          if (err.message !== 'Rendering cancelled') {
            console.error('Error rendering page:', err);
            setPageRendering(false);
            setError(`Failed to render page ${pageNum}: ${err.message}`);
          }
        });
      } catch (err) {
        console.error('Error initiating render:', err);
        setPageRendering(false);
        setError(`Failed to initialize page rendering: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }).catch((err: Error) => {
      console.error(`Error getting page ${pageNum}:`, err);
      setPageRendering(false);
      setError(`Failed to get page ${pageNum}: ${err.message}`);
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
      {/* Mobile-responsive toolbar */}
      <div 
        className="pdf-viewer-toolbar flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 py-2"
        style={{ backgroundColor: BRAND_COLORS.NAVY }}
      >
        {/* Document title */}
        <div className="flex-1 w-full sm:w-auto mb-2 sm:mb-0">
          <h3 className="text-white text-lg font-medium truncate">
            {file?.name || 'Document'}
          </h3>
        </div>
        
        {/* Navigation controls - full width on mobile, normal on desktop */}
        <div className="flex items-center justify-between w-full sm:w-auto sm:mr-4 mb-2 sm:mb-0">
          <button 
            onClick={goToPreviousPage}
            disabled={currentPage <= 1 || pageRendering}
            className="px-3 py-1 rounded text-white hover:bg-white/10 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-white mx-2">
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
        
        {/* Action buttons */}
        <div className="flex justify-between w-full sm:w-auto sm:space-x-2">
          {onSaveWithAnnotations && (
            <button
              onClick={onSaveWithAnnotations}
              className="px-3 py-1 rounded text-white hover:bg-benext-orange/90"
              style={{ backgroundColor: BRAND_COLORS.ORANGE }}
            >
              Save
            </button>
          )}
          <button 
            onClick={onClose}
            className="px-3 py-1 rounded text-white hover:bg-white/10 ml-auto sm:ml-0"
            aria-label="Close"
          >
            Close
          </button>
        </div>
      </div>
      
      {/* PDF canvas container - maximize the available space */}
      <div 
        id="pdf-wrapper" 
        className="flex-1 overflow-auto bg-gray-100 p-2 md:p-4 flex justify-center pdf-container"
      >
        <canvas 
          ref={canvasRef} 
          className="shadow-lg max-w-full"
          id="pdf-canvas"
        />
      </div>
    </div>
  );
};

export default DirectPDFViewer;