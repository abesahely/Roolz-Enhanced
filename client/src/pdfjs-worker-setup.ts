import * as pdfjsLib from 'pdfjs-dist';
// Import pdfjs from react-pdf to ensure we're configuring the same instance
import { pdfjs } from 'react-pdf';

/**
 * PDF.js Worker Configuration
 * 
 * This is the single source of truth for PDF.js worker configuration.
 * Following SimplePDF.com approach of using a direct path to the worker.
 */

// Version constants
// Use the version that React-PDF expects internally (4.8.69)
// This ensures compatibility between pdfjs-dist and react-pdf
export const PDFJS_VERSION = '3.11.174';

// Following SimplePDF.com approach with local module pathing
// This avoids issues with CDN URLs and worker imports
if (typeof window !== 'undefined' && 'Worker' in window) {
  try {
    console.log(`Initializing PDF.js worker (version ${PDFJS_VERSION})`);
    
    // Create a direct path to the worker file
    // Using our publicly accessible worker file
    const workerSrc = `/pdf.worker.js`;
    
    // Set worker source for both pdfjsLib and pdfjs from react-pdf 
    // This ensures both libraries use the same worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;
    pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
    
    // Add flags to window to indicate worker is initialized
    // This helps with debugging and prevents double initialization
    (window as any).__PDFJS_WORKER_INITIALIZED = true;
    (window as any).__PDFJS_WORKER_VERSION = PDFJS_VERSION;
    (window as any).__PDFJS_WORKER_METHOD = 'local-path';
    
    console.log('Worker initialized successfully with path:', workerSrc);
  } catch (error) {
    console.error('Failed to initialize PDF.js worker:', error);
    // Don't set a fallback - better to fail clearly than with confusing symptoms
  }
} else {
  console.warn('PDF.js worker cannot be initialized: not in browser environment or Worker API not available');
}

export { pdfjsLib, pdfjs };