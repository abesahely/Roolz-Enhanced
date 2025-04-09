import React, { useEffect, useRef, useState, useCallback } from "react";
import { pdfjsLib } from "../pdfjs-worker-setup";
import { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";
import { saveAs } from 'file-saver';
import { BRAND_COLORS } from "@/lib/constants";

interface PDFViewerProps {
  file: File | null;
  onClose: () => void;
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
  onSaveWithAnnotations?: () => void;
  initialPage?: number;
  onPageChange?: (pageNumber: number) => void;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ 
  file, 
  onClose, 
  onCanvasReady, 
  onSaveWithAnnotations,
  initialPage = 1,
  onPageChange
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [autoScale, setAutoScale] = useState(true);
  const [originalPdfWidth, setOriginalPdfWidth] = useState(0);

  // Notify parent component when page changes
  useEffect(() => {
    if (onPageChange) {
      onPageChange(currentPage);
    }
  }, [currentPage, onPageChange]);

  // Calculate optimal scale based on container size - optimized for mobile and desktop
  const calculateOptimalScale = useCallback((pdfWidth: number) => {
    if (!containerRef.current || !pdfWidth) return 1;
    
    // Get the container dimensions
    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;
    
    // Detect mobile device
    const isMobile = window.innerWidth < 768;
    
    // Apply a smaller margin on mobile, larger on desktop
    const margin = isMobile ? 16 : 40;
    const availableWidth = Math.max(280, containerWidth - margin); // Smaller minimum width for mobile
    
    // On very small screens, we want the whole PDF to be visible
    // This helps with the erratic scrolling issue
    if (isMobile && containerWidth < 400) {
      // For mobile portrait, prioritize fitting width while preserving aspect ratio
      return Math.max(0.3, Math.min(1, availableWidth / pdfWidth));
    }
    
    // Regular scaling calculation
    const calculatedScale = availableWidth / pdfWidth;
    
    // Adjust scale range based on device - allow smaller scale on mobile for complete viewing
    const minScale = isMobile ? 0.3 : 0.5;
    const maxScale = isMobile ? 1.5 : 2.0;
    const optimalScale = Math.max(minScale, Math.min(maxScale, calculatedScale));
    
    // Round to 2 decimal places for stability 
    return Math.round(optimalScale * 100) / 100;
  }, []);

  // Effect to handle window resize and adjust scale
  useEffect(() => {
    if (!originalPdfWidth || !autoScale) return;

    // Create debounced resize handler to prevent too many recalculations
    let resizeTimeout: ReturnType<typeof setTimeout> | null = null;
    
    const handleResize = () => {
      // Clear any existing timeout
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
      
      // Set a new timeout to delay scale recalculation
      resizeTimeout = setTimeout(() => {
        const newScale = calculateOptimalScale(originalPdfWidth);
        if (newScale !== scale) {
          console.log(`Resizing based on container width: new scale ${newScale}`);
          setScale(newScale);
          if (pdfDoc) {
            renderPage(pdfDoc, currentPage, newScale);
          }
        }
      }, 100); // 100ms debounce
    };

    // Initial calculation
    handleResize();

    // Add resize event listener
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
    };
  }, [originalPdfWidth, autoScale, calculateOptimalScale, pdfDoc, currentPage, scale]);

  // Effect to load PDF
  useEffect(() => {
    if (!file) return;

    const loadPDF = async () => {
      try {
        // Read the file
        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        
        // Load the PDF
        const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
        const pdfDoc = await loadingTask.promise;
        
        setPdfDoc(pdfDoc);
        setTotalPages(pdfDoc.numPages);
        
        // Get the first page to determine PDF dimensions
        const firstPage = await pdfDoc.getPage(1);
        const viewport = firstPage.getViewport({ scale: 1.0 });
        
        // Store the original PDF width for responsive calculations
        setOriginalPdfWidth(viewport.width);
        
        // Render the initial page (which might be different from 1)
        const pageToRender = initialPage > 0 && initialPage <= pdfDoc.numPages 
          ? initialPage 
          : 1;
        
        // Set current page state to the initial page
        setCurrentPage(pageToRender);
        
        // Calculate optimal scale based on container size (if autoScale is enabled)
        if (autoScale && containerRef.current) {
          const newScale = calculateOptimalScale(viewport.width);
          setScale(newScale);
          await renderPage(pdfDoc, pageToRender, newScale);
        } else {
          // Use current scale
          await renderPage(pdfDoc, pageToRender);
        }
        
        // Notify parent component that canvas is ready
        if (onCanvasReady && canvasRef.current) {
          onCanvasReady(canvasRef.current);
        }
      } catch (error) {
        console.error("Error loading PDF:", error);
      }
    };

    loadPDF();
  }, [file, onCanvasReady, autoScale, calculateOptimalScale]);
  
  // Effect to handle initialPage changes - run only when initialPage, pdfDoc, or totalPages change
  useEffect(() => {
    if (!pdfDoc) return;
    
    const goToInitialPage = async () => {
      // Only navigate if initialPage is valid and different from current page
      if (initialPage > 0 && initialPage <= totalPages && initialPage !== currentPage) {
        setCurrentPage(initialPage);
        await renderPage(pdfDoc, initialPage);
      }
    };
    
    goToInitialPage();
  }, [initialPage, pdfDoc, totalPages]); // Removed currentPage to prevent infinite loops

  const renderPage = async (
    pdf: PDFDocumentProxy,
    pageNumber: number,
    newScale?: number
  ) => {
    if (!canvasRef.current) return;

    try {
      // Catch any errors that might occur during page navigation
      if (pageNumber < 1 || pageNumber > pdf.numPages) {
        console.error(`Invalid page number: ${pageNumber}. Range is 1-${pdf.numPages}`);
        return;
      }

      // Show a loading indicator for mobile
      const isMobile = window.innerWidth < 768;
      let loadingIndicator: HTMLDivElement | null = null;
      
      if (isMobile) {
        // Create a simple loading indicator specifically for mobile
        loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'pdf-page-loading';
        loadingIndicator.style.cssText = `
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background-color: rgba(0, 0, 0, 0.7);
          color: white;
          padding: 10px 20px;
          border-radius: 4px;
          z-index: 1000;
        `;
        loadingIndicator.textContent = 'Loading page...';
        document.body.appendChild(loadingIndicator);
      }

      const page: PDFPageProxy = await pdf.getPage(pageNumber);
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      
      if (!context) {
        console.error("Unable to get canvas context");
        if (loadingIndicator) document.body.removeChild(loadingIndicator);
        return;
      }

      // Ensure we have a valid scale (prevent negative values)
      const currentScale = Math.abs(newScale || scale);
      
      // Get viewport with explicit rotation to prevent flipping
      const viewport = page.getViewport({ 
        scale: currentScale,
        rotation: 0 // Force rotation to 0 to prevent flipping
      });

      // Set canvas dimensions to match the viewport
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      // Clear the canvas before rendering to prevent artifacts
      context.clearRect(0, 0, canvas.width, canvas.height);

      // Render the PDF page
      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      try {
        await page.render(renderContext).promise;
      } catch (renderError) {
        console.error("Error rendering PDF page:", renderError);
        
        // Recover from render error - try with a smaller scale for problematic pages
        if (currentScale > 0.5) {
          const fallbackScale = 0.5;
          const fallbackViewport = page.getViewport({ scale: fallbackScale, rotation: 0 });
          canvas.height = fallbackViewport.height;
          canvas.width = fallbackViewport.width;
          context.clearRect(0, 0, canvas.width, canvas.height);
          await page.render({
            canvasContext: context,
            viewport: fallbackViewport,
          }).promise;
        }
      }
      
      // Remove loading indicator if it exists
      if (loadingIndicator) {
        document.body.removeChild(loadingIndicator);
      }
      
      // Resize the annotation canvas if it exists
      const annotationCanvas = document.getElementById('annotation-canvas') as HTMLCanvasElement;
      if (annotationCanvas) {
        console.log(`Resizing annotation canvas to match PDF: ${viewport.width}x${viewport.height} at scale ${currentScale}`);
        
        // Find the fabric canvas instance
        const fabricCanvasElement = document.querySelector('.canvas-container') as HTMLElement;
        if (fabricCanvasElement) {
          // Set the container size
          fabricCanvasElement.style.width = `${viewport.width}px`;
          fabricCanvasElement.style.height = `${viewport.height}px`;
          
          // Get the fabric canvas from the window object if available
          const fabricCanvas = (window as any).fabricCanvas;
          
          if (fabricCanvas) {
            // Update canvas dimensions
            fabricCanvas.setWidth(viewport.width);
            fabricCanvas.setHeight(viewport.height);
            
            // If we're changing the scale, update the zoom level of the fabric canvas
            if (newScale && newScale !== scale) {
              // Save current objects' positions
              const objects = fabricCanvas.getObjects();
              const oldScale = scale;
              const scaleRatio = newScale / oldScale;
              
              if (scaleRatio !== 1) {
                // Scale all objects
                objects.forEach((obj: any) => {
                  const oldLeft = obj.left;
                  const oldTop = obj.top;
                  const oldScaleX = obj.scaleX;
                  const oldScaleY = obj.scaleY;
                  
                  // Calculate new position based on scale ratio
                  obj.left = oldLeft * scaleRatio;
                  obj.top = oldTop * scaleRatio;
                  
                  // If it's not a group (which scales internally)
                  if (!obj.isType('group')) {
                    obj.scaleX = oldScaleX * scaleRatio;
                    obj.scaleY = oldScaleY * scaleRatio;
                  }
                  
                  obj.setCoords();
                });
              }
            }
            
            // Render the changes
            fabricCanvas.renderAll();
          }
        }
      }
    } catch (error) {
      console.error("Error rendering page:", error);
    }
  };

  const prevPage = async () => {
    if (!pdfDoc || currentPage <= 1) return;
    
    try {
      // Scroll to top for better mobile experience
      if (window.innerWidth < 768 && containerRef.current) {
        containerRef.current.scrollTop = 0;
      }
      
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      
      // Add a small delay to ensure state updates before rendering (helps on mobile)
      await new Promise(resolve => setTimeout(resolve, 50));
      await renderPage(pdfDoc, newPage);
    } catch (error) {
      console.error("Error navigating to previous page:", error);
    }
  };

  const nextPage = async () => {
    if (!pdfDoc || currentPage >= totalPages) return;
    
    try {
      // Scroll to top for better mobile experience
      if (window.innerWidth < 768 && containerRef.current) {
        containerRef.current.scrollTop = 0;
      }
      
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      
      // Add a small delay to ensure state updates before rendering (helps on mobile)
      await new Promise(resolve => setTimeout(resolve, 50));
      await renderPage(pdfDoc, newPage);
    } catch (error) {
      console.error("Error navigating to next page:", error);
    }
  };

  const changeZoom = async (newScale: number) => {
    // When manually changing zoom, disable auto-scaling
    setAutoScale(false);
    setScale(newScale);
    if (pdfDoc) {
      await renderPage(pdfDoc, currentPage, newScale);
    }
  };
  
  // Toggle auto-scaling on/off
  const toggleAutoScale = async () => {
    const newAutoScale = !autoScale;
    setAutoScale(newAutoScale);
    
    // If turning on auto-scaling, recalculate scale based on container width
    if (newAutoScale && originalPdfWidth && containerRef.current) {
      const newScale = calculateOptimalScale(originalPdfWidth);
      setScale(newScale);
      if (pdfDoc) {
        await renderPage(pdfDoc, currentPage, newScale);
      }
    }
  };

  const handleDownload = async () => {
    if (!file) {
      console.error("No file available to download");
      return;
    }
    
    console.log("Starting download process for original PDF...");
    
    // Create a blob from the file for consistent behavior
    const pdfBlob = new Blob([await file.arrayBuffer()], { type: 'application/pdf' });
    const filename = file.name || "document.pdf";
    
    // Create a download link element (similar to SimplePDF approach)
    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(pdfBlob);
    downloadLink.download = filename;
    
    // Add to DOM temporarily
    document.body.appendChild(downloadLink);
    
    // Display a notification to guide the user
    const notification = document.createElement('div');
    notification.style.position = 'fixed';
    notification.style.bottom = '20px';
    notification.style.left = '50%';
    notification.style.transform = 'translateX(-50%)';
    notification.style.backgroundColor = BRAND_COLORS.BLUE;
    notification.style.color = BRAND_COLORS.WHITE;
    notification.style.padding = '12px 20px';
    notification.style.borderRadius = '4px';
    notification.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
    notification.style.zIndex = '9999';
    notification.style.display = 'flex';
    notification.style.alignItems = 'center';
    notification.style.gap = '10px';
    
    // Add download icon
    const icon = document.createElement('i');
    icon.className = 'fas fa-file-download';
    icon.style.color = BRAND_COLORS.ORANGE;
    notification.appendChild(icon);
    
    // Add text message
    const message = document.createElement('span');
    message.textContent = 'Click the "Save PDF" button to download';
    notification.appendChild(message);
    
    document.body.appendChild(notification);
    
    // Show the download notification briefly before triggering click
    setTimeout(() => {
      // Simulate a user click on the download link
      downloadLink.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(downloadLink.href);
        
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 100);
    }, 500);
    
    // Try FileSaver as a backup approach
    try {
      setTimeout(() => {
        saveAs(pdfBlob, filename);
        console.log("FileSaver.js initiated download as backup");
      }, 1000);
    } catch (error) {
      console.error("Error with FileSaver download:", error);
      // Main approach with download link should still work
    }
  };

  return (
    <div className="flex-grow bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-4 shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-bold text-xl truncate">{file?.name || "Document.pdf"}</h2>
        <div className="flex space-x-3">
          <button
            className="btn-teal px-3 py-2 rounded flex items-center shadow-md hover:shadow-lg transition-shadow"
            title="Download Original"
            onClick={handleDownload}
          >
            <i className="fas fa-download mr-2"></i>
            <span className="hidden sm:inline">Download</span>
          </button>
          {onSaveWithAnnotations && (
            <button
              className="btn-orange px-3 py-2 rounded flex items-center shadow-md hover:shadow-lg transition-shadow"
              title="Save with Annotations"
              onClick={onSaveWithAnnotations}
            >
              <i className="fas fa-file-signature mr-2"></i>
              <span className="hidden sm:inline">Save Annotated</span>
            </button>
          )}
          <button
            className="bg-benext-gray-600 hover:bg-benext-gray-500 text-white px-3 py-2 rounded shadow-md hover:shadow-lg transition-shadow"
            title="Close"
            onClick={onClose}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
      </div>

      {/* PDF Viewer Area */}
      <div className="relative bg-benext-gray-100 rounded-lg overflow-hidden" style={{ height: "70vh" }}>
        {/* PDF Render Canvas */}
        <div 
          ref={containerRef}
          className="w-full h-full overflow-auto pdf-container" 
          style={{ 
            maxHeight: "calc(70vh - 50px)",
            WebkitOverflowScrolling: "touch", // Smoother scrolling on iOS
            touchAction: "pan-y pinch-zoom", // Enable native touch gestures on mobile
            msOverflowStyle: "none", // IE and Edge
            scrollbarWidth: "thin" // Firefox
          }}
        >
          <div 
            className="pdf-wrapper relative min-h-full flex justify-center" 
            id="pdf-wrapper" 
            style={{ 
              margin: '0 auto',
              minWidth: '100%', // Ensure PDF wrapper is at least as wide as container
              paddingBottom: '20px' // Add padding at bottom for better mobile scrolling
            }}
          >
            <canvas 
              ref={canvasRef} 
              className="pdf-canvas" 
              style={{ 
                position: 'relative', 
                zIndex: 1,
                touchAction: "pan-y pinch-zoom", // Enable native touch handling
                maxWidth: '100%' // Ensure the canvas doesn't overflow on small screens
              }} 
            />
            {/* Annotation canvas will be placed here by PDFEditor */}
          </div>
        </div>

        {/* PDF Controls (Bottom) */}
        <div className="pdf-controls flex justify-between items-center bg-benext-blue py-2 px-4 rounded-b-lg border-t border-benext-gray-600">
          <div className="flex items-center space-x-3">
            <button
              className="text-white hover:text-benext-orange focus:outline-none transition-colors duration-150"
              title="Previous Page"
              onClick={prevPage}
              disabled={currentPage <= 1}
              style={{ opacity: currentPage <= 1 ? 0.5 : 1 }}
            >
              <i className="fas fa-chevron-left"></i>
            </button>
            <span className="text-white text-sm font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <button
              className="text-white hover:text-benext-orange focus:outline-none transition-colors duration-150"
              title="Next Page"
              onClick={nextPage}
              disabled={currentPage >= totalPages}
              style={{ opacity: currentPage >= totalPages ? 0.5 : 1 }}
            >
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              <button
                className="text-white hover:text-benext-orange focus:outline-none transition-colors duration-150"
                title="Zoom Out"
                onClick={() => changeZoom(Math.max(0.5, scale - 0.1))}
              >
                <i className="fas fa-search-minus"></i>
              </button>
              <span className="text-white text-sm font-medium whitespace-nowrap">
                {Math.round(scale * 100)}%
              </span>
              <button
                className="text-white hover:text-benext-orange focus:outline-none transition-colors duration-150"
                title="Zoom In"
                onClick={() => changeZoom(Math.min(3, scale + 0.1))}
              >
                <i className="fas fa-search-plus"></i>
              </button>
            </div>
            
            <button
              className={`text-white hover:text-benext-orange focus:outline-none transition-colors duration-150 ${autoScale ? 'text-benext-orange' : ''}`}
              title={autoScale ? "Auto-scale Enabled" : "Auto-scale Disabled"}
              onClick={toggleAutoScale}
            >
              <i className="fas fa-expand-arrows-alt"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFViewer;