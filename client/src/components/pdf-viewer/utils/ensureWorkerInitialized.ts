/**
 * PDF.js Worker Initialization Utility
 * 
 * This module provides a utility function to ensure the PDF.js worker
 * is properly initialized before any PDF rendering occurs.
 * 
 * Following SimplePDF.com approach with direct paths to worker.
 */

import { pdfjs } from 'react-pdf';
import { PDFJS_VERSION } from '../../../pdfjs-worker-setup';

/**
 * Ensures the PDF.js worker is properly initialized
 * This function should be called before any PDF rendering occurs
 * 
 * @returns boolean indicating if worker is initialized
 */
export function ensureWorkerInitialized(): boolean {
  // Check if worker is already initialized
  if ((window as any).__PDFJS_WORKER_INITIALIZED) {
    console.log('PDF.js worker already initialized:', {
      version: (window as any).__PDFJS_WORKER_VERSION,
      method: (window as any).__PDFJS_WORKER_METHOD || 'unknown'
    });
    return true;
  }
  
  // If not initialized by our global setup, initialize here as fallback
  // This is a safety measure and provides a second chance for initialization
  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    console.warn('PDF.js worker not initialized by global setup, initializing from utility');
    
    // Use the same approach as in pdfjs-worker-setup.ts
    const workerSrc = `/node_modules/pdfjs-dist/build/pdf.worker.min.js`;
    
    // Use worker path for initialization
    pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
    
    // Set initialization flags
    (window as any).__PDFJS_WORKER_INITIALIZED = true;
    (window as any).__PDFJS_WORKER_VERSION = PDFJS_VERSION;
    (window as any).__PDFJS_WORKER_METHOD = 'utility-fallback';
    
    console.log('PDF.js worker initialized with fallback path:', workerSrc);
    return true;
  }
  
  // Worker is initialized but not by our code
  console.log('PDF.js worker initialized by external code:', {
    workerSrc: pdfjs.GlobalWorkerOptions.workerSrc,
    type: typeof pdfjs.GlobalWorkerOptions.workerSrc
  });
  return true;
}