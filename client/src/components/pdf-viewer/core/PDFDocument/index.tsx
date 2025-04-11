import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
// @ts-ignore - fabric.js has some issues with TS imports
import fabric from 'fabric';
import { PDFDocumentProxy } from 'pdfjs-dist';
import LoadingState from '../LoadingState';
import { usePDFContext } from '../../context/PDFContext';
import { useAnnotationContext } from '../../context/AnnotationContext';
import { BRAND_COLORS } from '@/lib/constants';
import { ensureWorkerInitialized } from '../../utils/ensureWorkerInitialized';

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
  // Verify worker initialization
  useEffect(() => {
    ensureWorkerInitialized();
  }, []);

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
      console.log('No file provided to PDFDocument');
      setFileUrl(null);
      return;
    }

    console.log('Creating URL for file:', file.name, file.type, file.size);
    
    try {
      // Create URL for the file
      const url = URL.createObjectURL(file);
      console.log('File URL created successfully:', url);
      setFileUrl(url);

      // Set initial page if provided
      if (initialPage > 0) {
        console.log('Setting initial page to:', initialPage);
        goToPage(initialPage);
      }

      // Add timeout to reset loading state if onLoadSuccess never fires
      // This is a safety mechanism in case there's an issue with the PDF.js worker
      // Increased to 20 seconds for SimplePDF.com approach testing
      const safetyTimeout = setTimeout(() => {
        if (loading) {
          console.warn('Safety timeout: PDF loading took too long, resetting loading state');
          console.warn('Worker source:', pdfjs.GlobalWorkerOptions.workerSrc);
          console.warn('Worker method:', (window as any).__PDFJS_WORKER_METHOD || 'unknown');
          console.warn('File details:', {
            name: file.name,
            type: file.type,
            size: file.size,
            url: fileUrl
          });
          
          // Try to check worker status
          try {
            // For react-pdf, we use the pdfjs object
            const workerStatus = pdfjs.GlobalWorkerOptions.workerSrc 
              ? 'Worker source set correctly' 
              : 'Worker source not set';
            console.warn('Worker status:', workerStatus);
            console.warn('Worker type:', typeof pdfjs.GlobalWorkerOptions.workerSrc);
          } catch (e) {
            console.error('Error checking worker status:', e);
          }
          
          setLoading(false);
          setError(new Error('PDF loading timed out. There may be an issue with the PDF.js worker. Please try again or use a different PDF file.'));
        }
      }, 20000); // Increase timeout to 20 seconds for testing

      // Clean up
      return () => {
        if (url) {
          console.log('Cleaning up file URL');
          URL.revokeObjectURL(url);
        }
        clearTimeout(safetyTimeout);
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error creating URL for file:', error);
      setError(new Error(`Failed to create URL for file: ${errorMessage}`));
      setLoading(false);
    }
  }, [file, initialPage, goToPage, setError, setLoading, loading]);

  // Handle document loading success
  const handleDocumentLoadSuccess = useCallback((pdf: { numPages: number }) => {
    console.log(`PDF loaded successfully:`, pdf);
    console.log(`Number of pages: ${pdf.numPages}`);
    
    // Add a small delay to ensure React state updates properly
    // This helps avoid React 18 issues with concurrent rendering
    setTimeout(() => {
      try {
        setNumPages(pdf.numPages);
        // We need to cast here because of type discrepancies between pdfjs-dist and react-pdf
        setPdfDocument(pdf as unknown as PDFDocumentProxy);
        setLoading(false);
        setError(null);
        console.log('PDF document state updated successfully');
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error('Error updating document state:', err);
        setError(new Error(`Failed to process PDF document: ${errorMessage}`));
        setLoading(false);
      }
    }, 50); // Small delay helps with React 18 concurrent mode
  }, [setPdfDocument, setLoading, setError]);

  // Handle document loading error
  const handleDocumentLoadError = useCallback((error: Error) => {
    console.error('Error loading PDF:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    
    // Try to determine if it's a worker issue
    const isWorkerIssue = error.message.includes('worker') || 
                           error.message.includes('Worker') ||
                           error.message.includes('importScripts');
    
    if (isWorkerIssue) {
      console.error('PDF.js worker issue detected. Check worker configuration.');
      setError(new Error(`PDF.js worker issue: ${error.message}. Try refreshing the page.`));
    } else {
      setError(error);
    }
    
    setLoading(false);
  }, [setError, setLoading]);

  // Handle document loading progress
  const handleDocumentLoadProgress = useCallback(({ loaded, total }: { loaded: number, total: number }) => {
    const progress = Math.round((loaded / total) * 100);
    console.log(`Loading PDF: ${progress}%`);
  }, []);

  // Handle page render success
  const handlePageRenderSuccess = useCallback((page: any) => {
    // Extract dimensions from the rendered page
    const pageWidth = page.width / (page.scale || 1);
    const pageHeight = page.height / (page.scale || 1);
    
    setPageWidth(pageWidth);
    setPageHeight(pageHeight);
    
    // Set up annotation canvas after page is rendered
    if (canvasRef.current && !annotationCanvasRef.current) {
      const fabricCanvas = new fabric.Canvas(canvasRef.current, {
        width: page.width,
        height: page.height,
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
  }, [autoScale, pageWidth, pageHeight, scale, setScale]);

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
        noData={<div className="p-4 text-red-500">No PDF data</div>}
        error={<div className="p-4 text-red-500">Failed to load PDF document. Please try again with a different file.</div>}
        className="mx-auto"
        options={{
          cMapUrl: 'https://unpkg.com/pdfjs-dist@4.8.69/cmaps/',
          cMapPacked: true,
          standardFontDataUrl: 'https://unpkg.com/pdfjs-dist@4.8.69/standard_fonts/',
          // Pass worker source explicitly - SimplePDF.com approach
          worker: pdfjs.GlobalWorkerOptions.workerSrc
        }}
      >
        {currentPage <= (numPages || 0) && (
          <Page 
            key={`page_${currentPage}`}
            pageNumber={currentPage}
            scale={scale}
            onRenderSuccess={handlePageRenderSuccess}
            loading={<LoadingState />}
            className="shadow-lg mx-auto"
            renderAnnotationLayer={false} // We'll handle annotations ourselves
            renderTextLayer={true}
            canvasRef={canvasRef}
          />
        )}
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