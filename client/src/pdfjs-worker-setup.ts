import * as pdfjsLib from 'pdfjs-dist';
// Import pdfjs from react-pdf to ensure we're configuring the same instance
import { pdfjs } from 'react-pdf';
// Import the worker entry point path directly
// Note: PDF.js doesn't provide a default export, so we import the path directly
import 'pdfjs-dist/build/pdf.worker.entry';

/**
 * PDF.js Worker Configuration
 * 
 * This is the single source of truth for PDF.js worker configuration.
 * Following SimplePDF.com approach of directly importing the worker file.
 */

// Version constants
// Use the version that React-PDF expects internally (4.8.69)
// This ensures compatibility between pdfjs-dist and react-pdf
export const PDFJS_VERSION = '4.8.69';

// For Vite, we need a specific approach
// Using direct worker import is more reliable than CDN URLs
// Check if we're in a browser environment
if (typeof window !== 'undefined' && 'Worker' in window) {
  try {
    console.log(`Initializing PDF.js worker (version ${PDFJS_VERSION}) with direct import`);
    
    // Set the worker path directly instead of using the import
    const workerPath = new URL(
      'pdfjs-dist/build/pdf.worker.min.js',
      import.meta.url
    ).href;
    
    // Set worker source for both pdfjsLib and pdfjs from react-pdf 
    // This ensures both libraries use the same worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerPath;
    pdfjs.GlobalWorkerOptions.workerSrc = workerPath;
    
    // Add flags to window to indicate worker is initialized
    // This helps with debugging and prevents double initialization
    (window as any).__PDFJS_WORKER_INITIALIZED = true;
    (window as any).__PDFJS_WORKER_VERSION = PDFJS_VERSION;
    (window as any).__PDFJS_WORKER_METHOD = 'direct-import';
    
    console.log('Worker initialized successfully with path:', workerPath);
  } catch (error) {
    console.error('Failed to initialize PDF.js worker:', error);
    // Don't set a fallback - better to fail clearly than with confusing symptoms
  }
} else {
  console.warn('PDF.js worker cannot be initialized: not in browser environment or Worker API not available');
}

export { pdfjsLib, pdfjs };