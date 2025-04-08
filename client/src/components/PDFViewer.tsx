import React, { useEffect, useRef, useState, useCallback } from "react";
import { pdfjsLib } from "../pdfjs-worker-setup";
import { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";
import { saveAs } from 'file-saver';

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

  // Effect to handle page changes
  useEffect(() => {
    if (onPageChange) {
      onPageChange(currentPage);
    }
  }, [currentPage, onPageChange]);


  
  // Calculate optimal scale based on container size
  const calculateOptimalScale = useCallback((pdfWidth: number) => {
    if (!containerRef.current || !pdfWidth) return 1;
    
    // Get the container width
    const containerWidth = containerRef.current.clientWidth;
    // Apply a small margin for aesthetics
    const availableWidth = containerWidth - 40; // 20px padding on each side
    
    // Calculate optimal scale and round to 2 decimal places
    const optimalScale = Math.max(0.5, Math.min(2, availableWidth / pdfWidth));
    return Math.round(optimalScale * 100) / 100;
  }, []);

  // Effect to handle window resize and adjust scale
  useEffect(() => {
    if (!originalPdfWidth || !autoScale) return;

    const handleResize = () => {
      const newScale = calculateOptimalScale(originalPdfWidth);
      if (newScale !== scale) {
        setScale(newScale);
        if (pdfDoc) {
          renderPage(pdfDoc, currentPage, newScale);
        }
      }
    };

    // Initial calculation
    handleResize();

    // Add resize event listener
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
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
  
  // Effect to handle initialPage changes
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
  }, [initialPage, pdfDoc, totalPages]);

  const renderPage = async (
    pdf: PDFDocumentProxy,
    pageNumber: number,
    newScale?: number
  ) => {
    if (!canvasRef.current) return;

    try {
      const page: PDFPageProxy = await pdf.getPage(pageNumber);
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      
      if (!context) {
        console.error("Unable to get canvas context");
        return;
      }

      const currentScale = newScale || scale;
      const viewport = page.getViewport({ scale: currentScale });

      // Set canvas dimensions to match the viewport
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      // Render the PDF page
      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      await page.render(renderContext).promise;
      
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
    const newPage = currentPage - 1;
    setCurrentPage(newPage);
    await renderPage(pdfDoc, newPage);
  };

  const nextPage = async () => {
    if (!pdfDoc || currentPage >= totalPages) return;
    const newPage = currentPage + 1;
    setCurrentPage(newPage);
    await renderPage(pdfDoc, newPage);
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
    notification.style.backgroundColor = '#0A1E45';
    notification.style.color = 'white';
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
    icon.style.color = '#F4871F';
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
            WebkitOverflowScrolling: "touch" // Smoother scrolling on iOS
          }}
        >
          <div 
            className="pdf-wrapper relative min-h-full" 
            id="pdf-wrapper" 
            style={{ 
              margin: '0 auto'
            }}
          >
            <canvas ref={canvasRef} className="pdf-canvas" style={{ position: 'relative', zIndex: 1 }} />
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
            <button
              className="text-white hover:text-benext-orange focus:outline-none transition-colors duration-150"
              title="Zoom Out"
              onClick={() => changeZoom(scale - 0.25)}
              disabled={scale <= 0.5}
              style={{ opacity: scale <= 0.5 ? 0.5 : 1 }}
            >
              <i className="fas fa-search-minus"></i>
            </button>
            <select
              className="bg-benext-blue text-white text-sm border border-benext-gray-500 rounded px-2 py-1 focus:outline-none focus:border-benext-orange"
              value={scale}
              onChange={(e) => changeZoom(parseFloat(e.target.value))}
            >
              <option value="0.5">50%</option>
              <option value="0.75">75%</option>
              <option value="1">100%</option>
              <option value="1.25">125%</option>
              <option value="1.5">150%</option>
              <option value="2">200%</option>
            </select>
            <button
              className="text-white hover:text-benext-orange focus:outline-none transition-colors duration-150"
              title="Zoom In"
              onClick={() => changeZoom(scale + 0.25)}
              disabled={scale >= 2}
              style={{ opacity: scale >= 2 ? 0.5 : 1 }}
            >
              <i className="fas fa-search-plus"></i>
            </button>
            
            {/* Auto-scale toggle button */}
            <button
              className={`text-white hover:text-benext-orange focus:outline-none transition-colors duration-150 ml-2 ${autoScale ? 'text-benext-orange' : ''}`}
              title={autoScale ? "Auto-scale is ON" : "Auto-scale is OFF"}
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
