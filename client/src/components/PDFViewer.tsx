import React, { useEffect, useRef, useState } from "react";
import { pdfjsLib } from "../pdfjs-worker-setup";
import { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";

interface PDFViewerProps {
  file: File | null;
  onClose: () => void;
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
  onSaveWithAnnotations?: () => void;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ file, onClose, onCanvasReady, onSaveWithAnnotations }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.0);

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
        
        // Render the first page
        await renderPage(pdfDoc, 1);
        
        // Notify parent component that canvas is ready
        if (onCanvasReady && canvasRef.current) {
          onCanvasReady(canvasRef.current);
        }
      } catch (error) {
        console.error("Error loading PDF:", error);
      }
    };

    loadPDF();
  }, [file, onCanvasReady]);

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
    setCurrentPage(currentPage - 1);
    await renderPage(pdfDoc, currentPage - 1);
  };

  const nextPage = async () => {
    if (!pdfDoc || currentPage >= totalPages) return;
    setCurrentPage(currentPage + 1);
    await renderPage(pdfDoc, currentPage + 1);
  };

  const changeZoom = async (newScale: number) => {
    setScale(newScale);
    if (pdfDoc) {
      await renderPage(pdfDoc, currentPage, newScale);
    }
  };

  const handleDownload = () => {
    if (!file) {
      console.error("No file available to download");
      return;
    }
    
    console.log("Starting download process for original PDF...");
    
    // This is a direct approach that works on most browsers including mobile
    const downloadUrl = URL.createObjectURL(new Blob([file], { type: 'application/pdf' }));
    
    // Create a visible button element which the user can directly interact with
    // This helps on iOS where automatic clicks are often blocked
    const downloadArea = document.createElement('div');
    downloadArea.style.position = 'fixed';
    downloadArea.style.top = '50%';
    downloadArea.style.left = '50%';
    downloadArea.style.transform = 'translate(-50%, -50%)';
    downloadArea.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    downloadArea.style.color = 'white';
    downloadArea.style.padding = '20px';
    downloadArea.style.borderRadius = '8px';
    downloadArea.style.zIndex = '10000';
    downloadArea.style.textAlign = 'center';
    
    // Add explanation text
    const message = document.createElement('p');
    message.textContent = 'Your PDF is ready. Tap the button below to download or view it.';
    message.style.marginBottom = '15px';
    downloadArea.appendChild(message);
    
    // Create the download button
    const downloadButton = document.createElement('a');
    downloadButton.href = downloadUrl;
    downloadButton.download = file.name || 'document.pdf';
    downloadButton.textContent = 'Download PDF';
    downloadButton.style.display = 'inline-block';
    downloadButton.style.backgroundColor = '#F4871F';
    downloadButton.style.color = 'white';
    downloadButton.style.padding = '10px 15px';
    downloadButton.style.borderRadius = '4px';
    downloadButton.style.textDecoration = 'none';
    downloadButton.style.fontWeight = 'bold';
    downloadButton.style.cursor = 'pointer';
    downloadButton.style.marginBottom = '10px';
    downloadArea.appendChild(downloadButton);
    
    // Add a close button
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.style.display = 'block';
    closeButton.style.backgroundColor = '#666';
    closeButton.style.color = 'white';
    closeButton.style.border = 'none';
    closeButton.style.padding = '8px 15px';
    closeButton.style.borderRadius = '4px';
    closeButton.style.margin = '10px auto 0';
    closeButton.style.cursor = 'pointer';
    closeButton.onclick = () => {
      document.body.removeChild(downloadArea);
      URL.revokeObjectURL(downloadUrl);
    };
    downloadArea.appendChild(closeButton);
    
    // Add note for iOS users
    const iOSNote = document.createElement('p');
    iOSNote.textContent = 'On iOS: If download doesn\'t start, tap and hold the button, then choose "Download Linked File" or "Open in New Tab".';
    iOSNote.style.fontSize = '12px';
    iOSNote.style.marginTop = '10px';
    iOSNote.style.opacity = '0.8';
    downloadArea.appendChild(iOSNote);
    
    // Add to body
    document.body.appendChild(downloadArea);
    
    // Auto-cleanup after 60 seconds if user doesn't close manually
    setTimeout(() => {
      if (document.body.contains(downloadArea)) {
        document.body.removeChild(downloadArea);
        URL.revokeObjectURL(downloadUrl);
      }
    }, 60000);
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
        <div className="w-full h-full overflow-auto pdf-container" style={{ maxHeight: "calc(70vh - 50px)" }}>
          <div className="pdf-wrapper relative flex items-center justify-center min-h-full" id="pdf-wrapper">
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFViewer;
