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
 */
export interface PDFRenderContextOptions {
  canvasContext: CanvasRenderingContext2D;
  viewport: any;
  annotationMode?: number;
  renderInteractiveForms?: boolean;
  enhanceTextSelection?: boolean;
  renderAnnotationEditorLayers?: boolean;
}

/**
 * PDF.js annotation editor types (integer constants)
 */
export enum AnnotationEditorType {
  NONE = 0,         // No annotation editor
  FREETEXT = 3,     // Free text annotation
  HIGHLIGHT = 4,    // Highlight text
  STAMP = 13,       // Stamp (for signature)
  INK = 15          // Ink (for drawing)
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
      return AnnotationEditorType.STAMP;
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