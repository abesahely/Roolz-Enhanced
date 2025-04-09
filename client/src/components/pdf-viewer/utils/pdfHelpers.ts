/**
 * PDF Helper Utilities
 * 
 * This file contains helper functions for working with PDF documents.
 */
import { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
import { PDF_VIEWER } from './constants';

/**
 * Calculate the appropriate scale factor for a PDF page to fit inside a container
 * 
 * @param page The PDF page
 * @param containerWidth Width of the container element
 * @param containerHeight Height of the container element
 * @param padding Optional padding to add (default: 20)
 * @returns The calculated scale factor
 */
export const calculateFitScale = (
  page: PDFPageProxy,
  containerWidth: number,
  containerHeight: number,
  padding: number = 20
): number => {
  const viewportOriginal = page.getViewport({ scale: 1.0 });
  const pageWidth = viewportOriginal.width;
  const pageHeight = viewportOriginal.height;
  
  const availableWidth = containerWidth - (padding * 2);
  const availableHeight = containerHeight - (padding * 2);
  
  const widthScale = availableWidth / pageWidth;
  const heightScale = availableHeight / pageHeight;
  
  // Use the smaller scale to ensure the page fits in both dimensions
  const scale = Math.min(widthScale, heightScale);
  
  // Ensure the scale is within allowed bounds
  return Math.max(
    PDF_VIEWER.ZOOM_MIN,
    Math.min(PDF_VIEWER.ZOOM_MAX, scale)
  );
};

/**
 * Extract text content from a PDF page
 * 
 * @param page The PDF page
 * @returns Promise resolving to the extracted text
 */
export const extractTextFromPage = async (page: PDFPageProxy): Promise<string> => {
  try {
    const textContent = await page.getTextContent();
    return textContent.items.map(item => 'str' in item ? item.str : '').join(' ');
  } catch (error) {
    console.error('Error extracting text from PDF page:', error);
    return '';
  }
};

/**
 * Get page dimensions adjusted for scale
 * 
 * @param page The PDF page
 * @param scale Scale factor to apply
 * @returns Object containing width and height
 */
export const getPageDimensions = (page: PDFPageProxy, scale: number) => {
  const viewport = page.getViewport({ scale });
  return {
    width: viewport.width,
    height: viewport.height
  };
};

/**
 * Render a PDF page to a canvas
 * 
 * @param page The PDF page to render
 * @param canvas The canvas element to render to
 * @param scale Scale factor to apply
 * @returns Promise that resolves when rendering is complete
 */
export const renderPageToCanvas = async (
  page: PDFPageProxy,
  canvas: HTMLCanvasElement,
  scale: number
): Promise<void> => {
  const viewport = page.getViewport({ scale });
  const context = canvas.getContext('2d');
  
  if (!context) {
    throw new Error('Could not get canvas context');
  }
  
  // Set canvas dimensions to match the scaled page
  canvas.height = viewport.height;
  canvas.width = viewport.width;
  
  // Render the page
  const renderContext = {
    canvasContext: context,
    viewport
  };
  
  return page.render(renderContext).promise;
};

/**
 * Save the current view as a data URL
 * 
 * @param canvas The canvas element containing the rendered PDF
 * @returns Data URL representation of the canvas
 */
export const getCanvasDataURL = (canvas: HTMLCanvasElement): string => {
  return canvas.toDataURL('image/png');
};

/**
 * Get file extension from a filename
 * 
 * @param filename The filename to extract extension from
 * @returns The file extension (without the dot) or empty string
 */
export const getFileExtension = (filename: string): string => {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
};

/**
 * Get filename without extension
 * 
 * @param filename The filename to process
 * @returns The filename without extension
 */
export const getFilenameWithoutExtension = (filename: string): string => {
  return filename.replace(/\.[^/.]+$/, '');
};