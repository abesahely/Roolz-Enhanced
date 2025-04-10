import * as pdfjsLib from 'pdfjs-dist';

/**
 * PDF.js Worker Configuration
 * 
 * We need to set the worker source to load the PDF.js worker script.
 * This is essential for PDF.js to function correctly.
 */

// For Vite, we need a specific approach
// Using a CDN URL is the most reliable approach across all environments
// Check if we're in a browser environment
if (typeof window !== 'undefined' && 'Worker' in window) {
  try {
    // Get the version from the installed package
    const pdfJsVersion = pdfjsLib.version;
    
    // Use versioned CDN - this is the most reliable approach
    const workerSrc = `https://unpkg.com/pdfjs-dist@${pdfJsVersion}/build/pdf.worker.min.js`;
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;
    console.log(`PDF.js worker source set to: ${workerSrc}`);
  } catch (error) {
    console.error('Error initializing PDF.js worker:', error);
    // Set to a default version as last resort
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
  }
} else {
  console.warn('PDF.js worker cannot be initialized: not in browser environment or Worker API not available');
}

export { pdfjsLib };