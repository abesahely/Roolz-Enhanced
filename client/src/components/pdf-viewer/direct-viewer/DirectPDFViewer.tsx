import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BRAND_COLORS } from '@/lib/constants';

// Import PDF.js directly from node_modules WITHOUT using react-pdf
// This ensures we're using the version that's actually installed (3.11.174)
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';

// Add global type declaration for PDF.js application
declare global {
  interface Window {
    PDFViewerApplication?: {
      pdfViewer: {
        currentPageNumber: number;
        annotationEditorUIManager?: {
          updateMode: (mode: number) => void;
          updateParams: (params: any) => void;
        };
      };
    };
  }
}

// Import annotation utilities
import { getAnnotationMode, PDFRenderContextOptions, AnnotationMode } from '../utils/annotationConfig';
import { useAnnotationState } from '../hooks/useAnnotationState';
import AnnotationToolbar from '../annotations/AnnotationToolbar';

// Import annotation system
import { pdfEventBus } from '../utils/EventBus';
import { SimpleLinkService } from '../utils/LinkService';
import { 
  initializeAnnotationSystem, 
  updateAnnotationEditorMode,
  updateAnnotationPage,
  cleanupAnnotationSystem,
  isAnnotationSystemInitialized
} from '../utils/AnnotationManager';
import NativeAnnotationLayer from '../annotations/NativeAnnotationLayer';

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
  
  // Zoom controls
  type ZoomMode = 'fit-width' | 'fit-page' | 'custom';
  const [zoomMode, setZoomMode] = useState<ZoomMode>('fit-width');
  const [customScale, setCustomScale] = useState<number>(1.0);
  const MIN_SCALE = 0.25;
  const MAX_SCALE = 3.0;
  const SCALE_STEP = 0.1;
  
  // Annotation state using our custom hook
  const {
    annotationMode,
    isAnnotating,
    annotationsModified,
    toggleAnnotationMode: baseToggleAnnotationMode,
    getAnnotationEditorType,
    markAnnotationsModified,
    resetAnnotationsModified
  } = useAnnotationState();
  
  // Enhanced toggle function that updates PDF.js annotation editor
  const toggleAnnotationMode = useCallback((mode: AnnotationMode) => {
    // Call the base toggle function from the hook
    baseToggleAnnotationMode(mode);
    
    // If we have access to the PDF.js annotation editor, update the mode
    if (window.PDFViewerApplication?.pdfViewer?.annotationEditorUIManager) {
      try {
        const editorType = mode === null ? 0 : getAnnotationMode(mode);
        debugPDFViewer('Updating PDF.js annotation editor mode', { mode, editorType });
        window.PDFViewerApplication.pdfViewer.annotationEditorUIManager.updateMode(editorType);
      } catch (err) {
        console.error('Error updating annotation editor mode:', err);
      }
    }
  }, [baseToggleAnnotationMode, getAnnotationEditorType]);
  
  // Reference to annotation manager for PDF.js
  const annotationEditorUIManagerRef = useRef<any>(null);
  
  // Track annotation styles that needs to be applied
  const activeAnnotationStyleRef = useRef<Record<string, any>>({});
  
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

  // We're now handling zoom mode changes directly in the change handlers,
  // so we don't need to trigger re-renders in a useEffect, which can cause race conditions
  
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
  
  // Function to render a specific page with the current zoom or a forced zoom mode
  const renderPage = (pageNum: number, forceZoomMode?: ZoomMode) => {
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
    
    // Track which zoom mode we'll use for rendering
    const zoomModeToUse = forceZoomMode || zoomMode;
    
    // If we're forcing a zoom mode, update it right away (before starting the render)
    // This ensures the state is in sync when we start rendering
    if (forceZoomMode && forceZoomMode !== zoomMode) {
      setZoomMode(forceZoomMode);
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
      
      // Calculate padding-adjusted container dimensions
      const paddingX = 40; // 20px padding on each side
      const paddingY = 40; // 20px padding on top and bottom
      const availableWidth = containerWidth - paddingX;
      const availableHeight = containerHeight - paddingY;
      
      // Calculate scales
      const horizontalScale = availableWidth / viewport.width;
      const verticalScale = availableHeight / viewport.height;
      
      // Determine scale based on zoom mode - using our tracked zoom mode for consistency
      let scale: number;
      switch (zoomModeToUse) {
        case 'fit-width':
          // Use the horizontal scale to fit the width
          scale = horizontalScale;
          debugPDFViewer('Using fit-width scale', { scale });
          break;
        case 'fit-page':
          // Use the smaller scale to ensure the entire page fits
          scale = Math.min(horizontalScale, verticalScale);
          debugPDFViewer('Using fit-page scale', { scale });
          break;
        case 'custom':
          // Use the custom scale
          scale = customScale;
          debugPDFViewer('Using custom scale', { scale });
          break;
      }
      
      // We already applied the zoom mode change earlier if needed
      
      // Enforce scale limits for safety
      scale = Math.max(Math.min(scale, MAX_SCALE), MIN_SCALE);
      
      const scaledViewport = page.getViewport({ scale });
      
      // Set canvas dimensions
      canvas.height = scaledViewport.height;
      canvas.width = scaledViewport.width;
      
      // Render the page with annotation support
      const renderContext: PDFRenderContextOptions = {
        canvasContext: context,
        viewport: scaledViewport,
        // Enable interactive forms for better user interaction
        renderInteractiveForms: true,
        // Enable enhanced text selection for highlight annotations
        enhanceTextSelection: true,
        // Enable annotation editor layer (correct parameter name)
        renderAnnotationEditorLayer: true
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
            
            // Initialize annotation editor if we're in annotation mode
            if (annotationMode && window.PDFViewerApplication?.pdfViewer) {
              try {
                debugPDFViewer('Setting PDF.js annotation editor type', { 
                  type: getAnnotationEditorType() 
                });
                
                // Attempt to access the PDF.js annotation layer
                const pdfViewer = window.PDFViewerApplication.pdfViewer;
                
                // If the editor exists, set the mode
                if (pdfViewer.annotationEditorUIManager) {
                  // Store reference to the editor manager
                  annotationEditorUIManagerRef.current = pdfViewer.annotationEditorUIManager;
                  
                  // Set the current editor type (text, highlight, etc.)
                  pdfViewer.annotationEditorUIManager.updateMode(getAnnotationEditorType());
                  
                  // Mark annotations as modifiable
                  markAnnotationsModified();
                }
              } catch (err) {
                console.error('Error initializing annotation editor:', err);
              }
            }
            
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
      // Pass the current zoom mode to maintain it during navigation
      renderPage(currentPage - 1, zoomMode);
    }
  };
  
  const goToNextPage = () => {
    if (currentPage < numPages && !pageRendering) {
      // Pass the current zoom mode to maintain it during navigation
      renderPage(currentPage + 1, zoomMode);
    }
  };
  
  // Zoom control handlers
  const zoomIn = () => {
    let newScale: number;
    
    if (zoomMode !== 'custom') {
      // If not already in custom mode, start with current scale
      // We need to calculate the current scale
      const canvas = canvasRef.current;
      if (!canvas) return;
      newScale = canvas.width / (canvas.width / customScale) * (1 + SCALE_STEP);
    } else {
      // Already in custom mode, just increase the scale
      newScale = Math.min(customScale * (1 + SCALE_STEP), MAX_SCALE);
    }
    
    setCustomScale(newScale);
    // Set zoom mode first, then render with that mode explicitly
    setZoomMode('custom');
    renderPage(currentPage, 'custom');
  };
  
  const zoomOut = () => {
    let newScale: number;
    
    if (zoomMode !== 'custom') {
      // If not already in custom mode, start with current scale
      const canvas = canvasRef.current;
      if (!canvas) return;
      newScale = canvas.width / (canvas.width / customScale) * (1 - SCALE_STEP);
    } else {
      // Already in custom mode, just decrease the scale
      newScale = Math.max(customScale * (1 - SCALE_STEP), MIN_SCALE);
    }
    
    setCustomScale(newScale);
    // Set zoom mode first, then render with that mode explicitly
    setZoomMode('custom');
    renderPage(currentPage, 'custom');
  };
  
  const setFitWidth = () => {
    setZoomMode('fit-width');
    renderPage(currentPage, 'fit-width');
  };
  
  const setFitPage = () => {
    setZoomMode('fit-page');
    renderPage(currentPage, 'fit-page');
  };
  
  // Function to handle saving annotations
  const handleSaveAnnotations = () => {
    debugPDFViewer('Saving annotations');
    
    if (onSaveWithAnnotations) {
      onSaveWithAnnotations();
      resetAnnotationsModified();
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
        className="pdf-viewer-toolbar flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 py-2 gap-2"
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
        
        {/* Zoom controls */}
        <div className="flex items-center justify-between w-full sm:w-auto sm:mr-4 mb-2 sm:mb-0">
          <div className="flex border border-white/20 rounded overflow-hidden">
            <button
              onClick={zoomOut}
              disabled={pageRendering || (zoomMode === 'custom' && customScale <= MIN_SCALE)}
              className="px-2 py-1 text-white hover:bg-white/10 disabled:opacity-50 text-sm"
              title="Zoom out"
            >
              −
            </button>
            <div className="relative">
              <select
                value={zoomMode}
                onChange={(e) => {
                  const newMode = e.target.value as ZoomMode;
                  // Force immediate re-render with the new mode
                  if (newMode === 'fit-width') {
                    setFitWidth();
                  } else if (newMode === 'fit-page') {
                    setFitPage();
                  } else {
                    setZoomMode('custom');
                    renderPage(currentPage, 'custom');
                  }
                }}
                className="appearance-none bg-transparent text-white px-2 py-1 pr-6 border-x border-white/20 cursor-pointer text-sm"
                disabled={pageRendering}
              >
                <option value="fit-width" className="bg-gray-800">Fit Width</option>
                <option value="fit-page" className="bg-gray-800">Fit Page</option>
                <option value="custom" className="bg-gray-800">
                  {Math.round(customScale * 100)}%
                </option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-1 pointer-events-none">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            <button
              onClick={zoomIn}
              disabled={pageRendering || (zoomMode === 'custom' && customScale >= MAX_SCALE)}
              className="px-2 py-1 text-white hover:bg-white/10 disabled:opacity-50 text-sm"
              title="Zoom in"
            >
              +
            </button>
          </div>
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
      
      {/* Annotation toolbar */}
      <AnnotationToolbar 
        currentMode={annotationMode}
        onModeChange={toggleAnnotationMode}
        onSave={handleSaveAnnotations}
        hasModifications={annotationsModified}
        isVisible={!pageRendering && pdfDocRef.current !== null}
      />
      
      {/* PDF canvas container - maximize the available space */}
      <div 
        id="pdf-wrapper" 
        className="flex-1 overflow-auto bg-gray-100 p-2 md:p-4 flex justify-center pdf-container"
      >
        <div className="relative">
          <canvas 
            ref={canvasRef} 
            className="shadow-lg max-w-full"
            id="pdf-canvas"
          />
          

        </div>
      </div>
    </div>
  );
};

export default DirectPDFViewer;