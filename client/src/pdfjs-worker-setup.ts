import * as pdfjsLib from 'pdfjs-dist';

/**
 * PDF.js Worker Configuration
 * 
 * This is the single source of truth for PDF.js worker configuration.
 * We set this up once and early in the application lifecycle.
 */

// Version constants
// Use the version that React-PDF expects internally (4.8.69)
// This ensures compatibility between pdfjs-dist and react-pdf
export const PDFJS_VERSION = '4.8.69';

// For Vite, we need a specific approach
// Using a CDN URL is the most reliable approach across all environments
// Check if we're in a browser environment
if (typeof window !== 'undefined' && 'Worker' in window) {
  try {
    // Use a consistent worker source that matches the version React-PDF expects
    const workerSrc = `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.js`;
    
    console.log(`Initializing PDF.js worker (version ${PDFJS_VERSION})`);
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;
    
    // Add a flag to window to indicate worker is initialized
    // This helps with debugging and prevents double initialization
    (window as any).__PDFJS_WORKER_INITIALIZED = true;
    (window as any).__PDFJS_WORKER_VERSION = PDFJS_VERSION;
  } catch (error) {
    console.error('Failed to initialize PDF.js worker:', error);
    // Don't set a fallback - better to fail clearly than with confusing symptoms
  }
} else {
  console.warn('PDF.js worker cannot be initialized: not in browser environment or Worker API not available');
}

export { pdfjsLib };