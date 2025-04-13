/**
 * Annotation Configuration Utility
 * 
 * This module provides configuration and constants for PDF.js annotations,
 * ensuring consistent behavior and appearance across the application.
 */
import { BRAND_COLORS } from '../../../lib/constants';

// Annotation Types from the existing application
export enum AnnotationTypes {
  TEXT = 1,        // Free text annotations
  LINK = 2,        // Hyperlink annotations
  HIGHLIGHT = 3,   // Text highlight
  UNDERLINE = 4,   // Text underline
  SIGNATURE = 5,   // Signature field
  CHECKBOX = 6,    // Checkbox field
  INK = 7,         // Freehand drawing
  STAMP = 8,       // Stamp annotations
  COMMENT = 9,     // Comment annotations
}

// Editor Modes matching PDF.js internal values
export enum EditorModes {
  NONE = 0,        // No active annotation tool
  TEXT = 1,        // Free text annotation tool
  INK = 3,         // Ink annotation tool
  HIGHLIGHT = 8,   // Highlight annotation tool
}

// Annotation Mode enum from DirectPDFViewer
// Using a type instead of enum since we need string and null values
export type AnnotationMode = 'text' | 'highlight' | 'signature' | 'checkbox' | 'drawing' | null;

// Constants for the annotation modes
export const AnnotationModes = {
  TEXT: 'text' as AnnotationMode,
  HIGHLIGHT: 'highlight' as AnnotationMode,
  SIGNATURE: 'signature' as AnnotationMode,
  CHECKBOX: 'checkbox' as AnnotationMode,
  DRAWING: 'drawing' as AnnotationMode,
  NONE: null as AnnotationMode
}

// PDF render context options for rendering annotations
export interface PDFRenderContextOptions {
  isEdit?: boolean;
  isAnnotator?: boolean;
  annotationMode?: string;
}

/**
 * Convert a user-friendly annotation mode to PDF.js editor type ID
 */
export function getAnnotationMode(mode: AnnotationMode): number {
  switch (mode) {
    case 'text':
      return EditorModes.TEXT;
    case 'highlight':
      return EditorModes.HIGHLIGHT;
    case 'drawing':
      return EditorModes.INK;
    case null:
    default:
      return EditorModes.NONE;
  }
}

// Default annotation styling
export const DEFAULT_ANNOTATION_STYLES = {
  // Text annotations
  text: {
    fontSize: 11,
    fontFamily: 'Helvetica, Arial, sans-serif',
    color: '#000000',
    backgroundColor: `${BRAND_COLORS.ORANGE}33`, // 20% opacity orange
    borderWidth: 1,
    borderColor: BRAND_COLORS.ORANGE,
    borderRadius: 3,
  },
  
  // Signature styling
  signature: {
    fontFamily: 'Dancing Script, cursive',
    fontSize: 28,
    color: '#145691',
    backgroundColor: 'transparent',
  },
  
  // Highlight styling
  highlight: {
    color: `${BRAND_COLORS.ORANGE}80`, // 50% opacity orange
  },
  
  // Ink (drawing) styling
  ink: {
    color: BRAND_COLORS.ORANGE,
    thickness: 3,
    opacity: 1,
  },
};

// Default parameters for annotation editor
export const DEFAULT_EDITOR_PARAMS = {
  // Toolbar configuration
  isEditing: false,
  
  // Text parameters
  fontSize: DEFAULT_ANNOTATION_STYLES.text.fontSize,
  fontFamily: DEFAULT_ANNOTATION_STYLES.text.fontFamily,
  textColor: DEFAULT_ANNOTATION_STYLES.text.color,
  backgroundColor: DEFAULT_ANNOTATION_STYLES.text.backgroundColor,
  
  // FreeText specific
  freeTextEditing: false,
  
  // Drawing parameters
  inkThickness: DEFAULT_ANNOTATION_STYLES.ink.thickness,
  inkColor: DEFAULT_ANNOTATION_STYLES.ink.color,
  inkOpacity: DEFAULT_ANNOTATION_STYLES.ink.opacity,
};

/**
 * Get the appropriate icon for an annotation type
 */
export function getAnnotationIcon(type: AnnotationTypes): string {
  switch (type) {
    case AnnotationTypes.TEXT:
      return 'text-cursor';
    case AnnotationTypes.HIGHLIGHT:
      return 'highlighter';
    case AnnotationTypes.SIGNATURE:
      return 'pen-tool';
    case AnnotationTypes.CHECKBOX:
      return 'check-square';
    case AnnotationTypes.INK:
      return 'pen-line';
    default:
      return 'edit';
  }
}

/**
 * Convert editor mode to user-friendly name
 */
export function getEditorModeName(mode: EditorModes): string {
  switch (mode) {
    case EditorModes.TEXT:
      return 'Text Box';
    case EditorModes.INK:
      return 'Draw';
    case EditorModes.HIGHLIGHT:
      return 'Highlight';
    case EditorModes.NONE:
    default:
      return 'None';
  }
}

/**
 * Create complete editor parameters for PDF.js AnnotationEditor
 */
export function createEditorParameters(customParams: Record<string, any> = {}) {
  return {
    ...DEFAULT_EDITOR_PARAMS,
    ...customParams,
    // Make sure fieldObjects exists to prevent the "params.fieldObjects is undefined" error
    fieldObjects: customParams.fieldObjects || {},
  };
}