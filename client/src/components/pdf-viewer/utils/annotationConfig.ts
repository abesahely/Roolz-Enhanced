/**
 * Annotation configuration utilities
 * 
 * This file contains constants and utility functions for working with PDF.js annotations
 */

// Import PDF.js directly from node_modules to ensure version consistency (3.11.174)
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';

/**
 * Annotation types supported by PDF.js
 * These are mapped to the AnnotationEditorType enum from PDF.js
 */
export const ANNOTATION_MODES = {
  NONE: 0, // No annotation active
  DISABLE: -1, // Annotations explicitly disabled
  FREETEXT: 3, // Text box annotations
  HIGHLIGHT: 9, // Text highlighting (Note: may need to use TextMarkup in some versions)
  INK: 15, // Freehand drawing 
  STAMP: 13, // Stamp annotations (for signature)
};

/**
 * Get the PDF.js annotation editor type based on a string mode
 * 
 * @param mode The annotation mode as a string
 * @returns The PDF.js AnnotationEditorType value
 */
export function getAnnotationMode(mode: string | null): number {
  switch (mode) {
    case 'text':
      return ANNOTATION_MODES.FREETEXT;
    case 'highlight':
      return ANNOTATION_MODES.HIGHLIGHT;
    case 'signature':
      return ANNOTATION_MODES.STAMP;
    case 'ink':
      return ANNOTATION_MODES.INK;
    case 'disable':
      return ANNOTATION_MODES.DISABLE;
    case 'none':
    default:
      return ANNOTATION_MODES.NONE;
  }
}

/**
 * Check if an annotation mode requires text selection
 */
export function requiresTextSelection(mode: string | null): boolean {
  return mode === 'highlight';
}

/**
 * Check if an annotation mode is active
 */
export function isAnnotationModeActive(mode: string | null): boolean {
  return mode !== null && mode !== 'none';
}

/**
 * Configure PDF.js annotation editor
 * 
 * @param options Annotation configuration options
 */
export type AnnotationStyleOptions = {
  fontSize?: number;
  fontFamily?: string; 
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  textColor?: string;
};

/**
 * Standard render context options for PDF.js
 */
export interface PDFRenderContextOptions {
  canvasContext: CanvasRenderingContext2D;
  viewport: any; // PDFViewport type
  annotationMode?: number;
  annotationEditorUIManager?: any;
  enableScripting?: boolean;
  renderInteractiveForms?: boolean;
  transform?: number[];
  background?: any;
  intent?: string;
  enhanceTextSelection?: boolean;
  renderTextLayer?: boolean;
  renderAnnotations?: boolean;
  renderAnnotationEditorLayers?: boolean;
}