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
    if (file) {
      // This is just the original PDF without annotations
      const url = URL.createObjectURL(file);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="flex-grow bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-4 shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-bold text-xl truncate">{file?.name || "Document.pdf"}</h2>
        <div className="flex space-x-2">
          <button
            className="btn-teal p-2 rounded"
            title="Download Original"
            onClick={handleDownload}
          >
            <i className="fas fa-download"></i>
          </button>
          {onSaveWithAnnotations && (
            <button
              className="btn-orange p-2 rounded"
              title="Save with Annotations"
              onClick={onSaveWithAnnotations}
            >
              <i className="fas fa-file-signature"></i>
            </button>
          )}
          <button
            className="bg-benext-gray-600 hover:bg-benext-gray-500 text-white p-2 rounded"
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
        <div className="w-full h-full flex items-center justify-center overflow-auto pdf-container" style={{ maxHeight: "calc(70vh - 50px)" }}>
          <canvas ref={canvasRef} className="pdf-canvas" />
        </div>

        {/* PDF Controls (Bottom) */}
        <div className="pdf-controls flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <button
              className="text-white hover:text-benext-teal"
              title="Previous Page"
              onClick={prevPage}
              disabled={currentPage <= 1}
            >
              <i className="fas fa-chevron-left"></i>
            </button>
            <span className="text-white text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <button
              className="text-white hover:text-benext-teal"
              title="Next Page"
              onClick={nextPage}
              disabled={currentPage >= totalPages}
            >
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>
          <div className="flex items-center space-x-3">
            <button
              className="text-white hover:text-benext-teal"
              title="Zoom Out"
              onClick={() => changeZoom(scale - 0.25)}
              disabled={scale <= 0.5}
            >
              <i className="fas fa-search-minus"></i>
            </button>
            <select
              className="bg-benext-blue text-white text-sm border border-benext-gray-600 rounded px-2 py-1"
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
              className="text-white hover:text-benext-teal"
              title="Zoom In"
              onClick={() => changeZoom(scale + 0.25)}
              disabled={scale >= 2}
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
