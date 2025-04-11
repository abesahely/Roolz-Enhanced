/**
 * PDF.js Worker Initialization Utility
 * 
 * This module provides a utility function to ensure the PDF.js worker
 * is properly initialized before any PDF rendering occurs.
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
    console.log('PDF.js worker already initialized with version:', (window as any).__PDFJS_WORKER_VERSION);
    return true;
  }
  
  // If not initialized by our global setup, initialize here as fallback
  // This is a safety measure and provides a second chance for initialization
  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    console.warn('PDF.js worker not initialized by global setup, initializing from utility');
    
    // Use the same version that react-pdf is using internally
    pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.js`;
    
    // Set initialization flags
    (window as any).__PDFJS_WORKER_INITIALIZED = true;
    (window as any).__PDFJS_WORKER_VERSION = PDFJS_VERSION;
    
    console.log('PDF.js worker initialized with version:', PDFJS_VERSION);
    return true;
  }
  
  // Worker is initialized but not by our code
  console.log('PDF.js worker initialized by external code:', pdfjs.GlobalWorkerOptions.workerSrc);
  return true;
}