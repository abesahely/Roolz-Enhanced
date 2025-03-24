import React, { useEffect, useRef, useState } from "react";
import * as pdfjs from "pdfjs-dist";

// Don't set the worker source - let PDF.js use a fallback implementation
// This will run in the main thread and is fine for our use case

interface PDFCanvasProps {
  pdfData: ArrayBuffer | null;
  pageNumber: number;
  scale: number;
  onPageLoaded?: (totalPages: number) => void;
}

const PDFCanvas: React.FC<PDFCanvasProps> = ({ 
  pdfData, 
  pageNumber, 
  scale,
  onPageLoaded 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdf, setPdf] = useState<pdfjs.PDFDocumentProxy | null>(null);

  // Load the PDF document when the component mounts or pdfData changes
  useEffect(() => {
    if (!pdfData) return;

    const loadPDF = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load the PDF
        const data = new Uint8Array(pdfData);
        const loadingTask = pdfjs.getDocument(data);
        
        const document = await loadingTask.promise;
        setPdf(document);
        
        if (onPageLoaded) {
          onPageLoaded(document.numPages);
        }
      } catch (err) {
        console.error("Error loading PDF:", err);
        setError("Failed to load PDF. Please try a different file.");
      } finally {
        setLoading(false);
      }
    };

    loadPDF();

    // Cleanup function
    return () => {
      if (pdf) {
        pdf.destroy().catch(console.error);
      }
    };
  }, [pdfData, onPageLoaded]);

  // Render the page when pageNumber or scale changes
  useEffect(() => {
    if (!pdf || !canvasRef.current) return;

    const renderPage = async () => {
      try {
        // Get the page
        const page = await pdf.getPage(pageNumber);
        
        // Get the canvas and context
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const context = canvas.getContext("2d");
        if (!context) return;
        
        // Calculate the viewport based on the scale
        const viewport = page.getViewport({ scale });
        
        // Set canvas dimensions
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        // Render the page
        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };
        
        await page.render(renderContext).promise;
      } catch (err) {
        console.error("Error rendering PDF page:", err);
        setError("Failed to render PDF page.");
      }
    };

    renderPage();
  }, [pdf, pageNumber, scale]);

  return (
    <div className="relative flex items-center justify-center">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-benext-gray-800 bg-opacity-50">
          <div className="text-benext-blue animate-pulse">Loading...</div>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-benext-gray-800 bg-opacity-50">
          <div className="text-red-500">{error}</div>
        </div>
      )}
      
      <canvas ref={canvasRef} className="max-w-full max-h-full" />
    </div>
  );
};

export default PDFCanvas;