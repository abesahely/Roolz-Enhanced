/**
 * PDF.js Worker Configuration
 * 
 * This file handles loading and configuring the PDF.js worker thread.
 */
import { GlobalWorkerOptions } from 'pdfjs-dist/build/pdf';

// Import from the existing worker setup
import { pdfjsLib } from '../../../pdfjs-worker-setup';

/**
 * Initialize the PDF.js worker
 * This should be called before any PDF operations
 */
export const initPdfWorker = (): void => {
  try {
    // Check if the worker is already set up
    if (GlobalWorkerOptions.workerSrc) {
      return;
    }
    
    // Worker is set up in pdfjs-worker-setup.ts via CDN
    // Just add a check here for verification
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      throw new Error('PDF.js worker not properly configured');
    }
    
    console.log('PDF.js worker initialized from CDN');
  } catch (error) {
    console.error('Error initializing PDF.js worker:', error);
    throw new Error('Failed to initialize PDF.js worker');
  }
};

/**
 * Get PDF version and information
 * 
 * @returns Version string
 */
export const getPdfLibVersion = (): string => {
  return pdfjsLib.version;
};

/**
 * Check if PDF.js worker is properly initialized
 * 
 * @returns Boolean indicating if worker is ready
 */
export const isPdfWorkerInitialized = (): boolean => {
  return !!GlobalWorkerOptions.workerSrc;
};

// Export pdfjsLib for direct usage
export { pdfjsLib };