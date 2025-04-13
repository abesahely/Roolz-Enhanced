/**
 * PDF.js annotation utilities and configuration
 */

import { BRAND_COLORS } from '@/lib/constants';

/**
 * Type for annotation mode
 */
export type AnnotationMode = 'text' | 'highlight' | 'signature' | null;

/**
 * Extended interface for PDF.js render context options to support annotations
 * 
 * Based on PDF.js documentation and implementation
 */
export interface PDFRenderContextOptions {
  canvasContext: CanvasRenderingContext2D;
  viewport: any;
  // Options for interactive elements
  renderInteractiveForms?: boolean;
  enableScripting?: boolean;
  // Text selection
  enhanceTextSelection?: boolean;
  // Annotation layers
  renderAnnotationEditorLayer?: boolean;
  annotationMode?: number;
  // Annotation editor type when in editing mode
  annotationEditorType?: number;
}

/**
 * PDF.js annotation editor types (integer constants)
 * 
 * These values come from PDF.js and might change between versions,
 * so we should keep them up to date with our PDF.js version.
 * 
 * For PDF.js 3.11.x, the values are:
 */
export enum AnnotationEditorType {
  NONE = 0,         // No annotation editor
  FREETEXT = 3,     // Free text annotation
  HIGHLIGHT = 4,    // Highlight text
  INK = 15,         // Ink (for drawing)
  
  // Note: Stamp type (13) is not supported yet in version 3.11.x
  // For signature, we'll use FreeText with a cursive font
}

/**
 * Get PDF.js annotation editor type from string mode
 * 
 * @param mode Current annotation mode
 * @returns PDF.js annotation editor type constant
 */
export function getAnnotationMode(mode: AnnotationMode): number {
  switch (mode) {
    case 'text':
      return AnnotationEditorType.FREETEXT;
    case 'highlight':
      return AnnotationEditorType.HIGHLIGHT;
    case 'signature':
      // Since STAMP isn't supported in 3.11.x, use FREETEXT with a cursive font
      return AnnotationEditorType.FREETEXT;
    default:
      return AnnotationEditorType.NONE;
  }
}

/**
 * Get annotation style properties based on mode
 * 
 * @param mode Annotation mode
 * @returns Style object for the annotation
 */
export function getAnnotationStyle(mode: AnnotationMode): Record<string, any> {
  switch (mode) {
    case 'text':
      return {
        backgroundColor: `${BRAND_COLORS.ORANGE}33`, // 20% opacity
        color: BRAND_COLORS.NAVY,
        fontSize: '12px',
        fontFamily: 'Montserrat, sans-serif',
        borderColor: BRAND_COLORS.ORANGE
      };
    case 'highlight':
      return {
        color: `${BRAND_COLORS.ORANGE}80`, // 50% opacity
      };
    case 'signature':
      return {
        fontFamily: 'Dancing Script, cursive',
        color: BRAND_COLORS.NAVY,
        fontSize: '18px'
      };
    default:
      return {};
  }
}