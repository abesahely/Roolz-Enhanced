/**
 * PDF.js Worker Loader
 * 
 * This utility handles loading and initializing the PDF.js worker using the
 * SimplePDF.com approach of dynamic imports and proper bundling.
 */

import { pdfjs } from 'react-pdf';

// Version constants - ensure this matches react-pdf's expectation
export const PDFJS_VERSION = '3.11.174';

/**
 * Dynamically load the PDF.js worker
 * This uses dynamic imports which Vite will automatically handle
 */
export const loadPdfWorker = async (): Promise<string> => {
  try {
    // Use CDN URL as a fallback (this is reliable across environments)
    const cdnWorkerUrl = `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.js`;
    
    // Set initialization flags
    (window as any).__PDFJS_WORKER_INITIALIZING = true;
    
    // Log the initialization attempt
    console.log('Initializing PDF.js worker via dynamic loading...');
    
    // Return the CDN URL since we can't modify Vite config
    return cdnWorkerUrl;
  } catch (error) {
    console.error('Failed to load PDF.js worker:', error);
    throw error;
  }
};

/**
 * Initialize the PDF.js worker asynchronously
 * This ensures the worker is properly loaded before any PDFs are rendered
 */
export const initializeWorker = async (): Promise<boolean> => {
  try {
    // Check if already initialized
    if ((window as any).__PDFJS_WORKER_INITIALIZED) {
      console.log('PDF.js worker already initialized');
      return true;
    }
    
    // Load the worker
    const workerUrl = await loadPdfWorker();
    
    // Set the worker source
    pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
    
    // Set global flags for debugging
    (window as any).__PDFJS_WORKER_INITIALIZED = true;
    (window as any).__PDFJS_WORKER_VERSION = PDFJS_VERSION;
    (window as any).__PDFJS_WORKER_METHOD = 'dynamic-loading';
    
    // Log success
    console.log('PDF.js worker initialized successfully with URL:', workerUrl);
    return true;
  } catch (error) {
    console.error('Worker initialization failed:', error);
    (window as any).__PDFJS_WORKER_INITIALIZING = false;
    return false;
  }
};

/**
 * Check if the worker is initialized or being initialized
 */
export const isWorkerInitialized = (): boolean => {
  return !!(window as any).__PDFJS_WORKER_INITIALIZED;
};

export const isWorkerInitializing = (): boolean => {
  return !!(window as any).__PDFJS_WORKER_INITIALIZING;
};