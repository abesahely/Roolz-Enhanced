import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { fabric } from 'fabric';
import { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
import LoadingState from '../LoadingState';
import { usePDFContext } from '../../context/PDFContext';
import { useAnnotationContext } from '../../context/AnnotationContext';
import { initPdfWorker, pdfjsLib } from '../../utils/pdfWorkerLoader';
import { BRAND_COLORS } from '@/lib/constants';

// Initialize PDF.js worker
initPdfWorker();

interface PDFDocumentProps {
  initialPage?: number;
  onPageChange?: (pageNumber: number) => void;
  className?: string;
}

/**
 * PDFDocument component for rendering the PDF
 * 
 * This component handles the rendering of the PDF document using React-PDF.
 */
const PDFDocument: React.FC<PDFDocumentProps> = ({
  initialPage = 1,
  onPageChange,
  className = ''
}) => {
  // Contexts
  const { 
    file, 
    pdfDocument, 
    setPdfDocument,
    currentPage, 
    setScale, 
    scale, 
    autoScale, 
    goToPage,
    loading,
    setLoading,
    error,
    setError
  } = usePDFContext();
  
  const { setCanvas } = useAnnotationContext();

  // Local state
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageWidth, setPageWidth] = useState<number | null>(null);
  const [pageHeight, setPageHeight] = useState<number | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);

  // Refs for canvas and container
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const annotationCanvasRef = useRef<fabric.Canvas | null>(null);

  // Convert File to URL for React-PDF
  useEffect(() => {
    if (!file) {
      setFileUrl(null);
      return;
    }

    // Create URL for the file
    const url = URL.createObjectURL(file);
    setFileUrl(url);

    // Set initial page if provided
    if (initialPage > 0) {
      goToPage(initialPage);
    }

    // Clean up
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [file, initialPage, goToPage]);

  // Handle document loading success
  const handleDocumentLoadSuccess = useCallback(async (pdf: PDFDocumentProxy) => {
    console.log(`PDF loaded successfully: ${pdf.numPages} pages`);
    setNumPages(pdf.numPages);
    setPdfDocument(pdf);
    setLoading(false);
    setError(null);
  }, [setPdfDocument, setLoading, setError]);

  // Handle document loading error
  const handleDocumentLoadError = useCallback((error: Error) => {
    console.error('Error loading PDF:', error);
    setError(error);
    setLoading(false);
  }, [setError, setLoading]);

  // Handle document loading progress
  const handleDocumentLoadProgress = useCallback(({ loaded, total }: { loaded: number, total: number }) => {
    const progress = Math.round((loaded / total) * 100);
    console.log(`Loading PDF: ${progress}%`);
  }, []);

  // Handle page render success
  const handlePageRenderSuccess = useCallback((page: PDFPageProxy) => {
    const viewport = page.getViewport({ scale: 1 });
    setPageWidth(viewport.width);
    setPageHeight(viewport.height);
    
    // Set up annotation canvas after page is rendered
    if (canvasRef.current && !annotationCanvasRef.current) {
      const fabricCanvas = new fabric.Canvas(canvasRef.current, {
        width: viewport.width * scale,
        height: viewport.height * scale,
        backgroundColor: 'transparent',
        selection: true,
        renderOnAddRemove: true,
      });
      
      annotationCanvasRef.current = fabricCanvas;
      setCanvas(fabricCanvas);
      
      console.log('Annotation canvas initialized');
    }
  }, [scale, setCanvas]);

  // Notify parent of page changes
  useEffect(() => {
    if (onPageChange) {
      onPageChange(currentPage);
    }
  }, [currentPage, onPageChange]);

  // Handle auto-scaling when container size changes
  useEffect(() => {
    if (!autoScale || !containerRef.current || !pageWidth) return;
    
    const handleResize = () => {
      if (!containerRef.current || !pageWidth) return;
      
      // Calculate the scale factor based on the container width
      // Add padding for container margins
      const containerWidth = containerRef.current.clientWidth - 40; // 20px padding on each side
      const newScale = containerWidth / pageWidth;
      
      // Apply the new scale if it's different
      if (Math.abs(newScale - scale) > 0.01) {
        setScale(newScale);
        console.log(`Auto-scaling PDF to fit container: scale=${newScale.toFixed(2)}`);
        
        // Update annotation canvas dimensions if it exists
        if (annotationCanvasRef.current && pageHeight) {
          annotationCanvasRef.current.setWidth(pageWidth * newScale);
          annotationCanvasRef.current.setHeight(pageHeight * newScale);
          annotationCanvasRef.current.setZoom(newScale);
          annotationCanvasRef.current.renderAll();
        }
      }
    };
    
    // Listen for resize events
    window.addEventListener('resize', handleResize);
    
    // Initial calculation
    handleResize();
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [autoScale, containerRef, pageWidth, pageHeight, scale, setScale]);

  // Clean up annotation canvas on unmount
  useEffect(() => {
    return () => {
      if (annotationCanvasRef.current) {
        annotationCanvasRef.current.dispose();
        annotationCanvasRef.current = null;
      }
    };
  }, []);

  // Loading state
  if (loading) {
    return <LoadingState />;
  }

  // Error state
  if (error) {
    return (
      <div className="p-4 rounded-md bg-red-500 bg-opacity-10 text-red-500">
        Error loading PDF: {error.message}
      </div>
    );
  }

  // Empty state
  if (!file || !fileUrl) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-400">No PDF document loaded</p>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`pdf-document-container relative overflow-auto ${className}`}
      style={{ height: '100%', backgroundColor: `${BRAND_COLORS.NAVY}15` }}
    >
      <Document
        file={fileUrl}
        onLoadSuccess={handleDocumentLoadSuccess}
        onLoadError={handleDocumentLoadError}
        onLoadProgress={handleDocumentLoadProgress}
        loading={<LoadingState />}
        error={<div className="p-4 text-red-500">Failed to load PDF document</div>}
        className="mx-auto"
      >
        <Page 
          pageNumber={currentPage}
          scale={scale}
          onRenderSuccess={handlePageRenderSuccess}
          loading={<LoadingState />}
          className="shadow-lg mx-auto"
          renderAnnotationLayer={false} // We'll handle annotations ourselves
          renderTextLayer={true}
          canvasRef={canvasRef}
        />
      </Document>
      
      {numPages && currentPage > numPages && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-4 rounded shadow-lg">
            <p className="text-red-500">Page {currentPage} does not exist. The document has {numPages} pages.</p>
            <button 
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
              onClick={() => goToPage(numPages)}
            >
              Go to last page
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PDFDocument;