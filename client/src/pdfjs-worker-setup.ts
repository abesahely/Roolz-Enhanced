import * as pdfjsLib from 'pdfjs-dist';

/**
 * PDF.js Worker Configuration
 * 
 * We need to set the worker source to load the PDF.js worker script.
 * This is essential for PDF.js to function correctly.
 */

// Check if we're in a browser environment
if (typeof window !== 'undefined' && 'Worker' in window) {
  // Get the version from the installed package
  const pdfJsVersion = pdfjsLib.version || '3.10.111';
  
  // Set worker source using CDN
  // This allows the worker to be loaded without bundling it
  const workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfJsVersion}/build/pdf.worker.min.js`;
  console.log(`Setting PDF.js worker source to: ${workerSrc}`);
  
  // Set the worker source 
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;
} else {
  console.warn('PDF.js worker cannot be initialized: not in browser environment or Worker API not available');
}

export { pdfjsLib };