/**
 * Annotation Styles Utility
 * 
 * This module provides styling functions and utilities for PDF.js annotations,
 * ensuring consistent appearance and behavior across different annotation types.
 */
import { BRAND_COLORS } from '@/lib/constants';
import { DEFAULT_ANNOTATION_STYLES } from './annotationConfig';

/**
 * CSS styles that will be injected for annotation rendering
 */
export const ANNOTATION_CSS = `
.annotationLayer {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 3;
  pointer-events: none;
}

.annotationLayer section {
  position: absolute;
  pointer-events: auto;
}

.annotationLayer .linkAnnotation {
  position: absolute;
  cursor: pointer;
  opacity: 0.3;
  border: 1px solid ${BRAND_COLORS.ORANGE};
  border-radius: 3px;
  background: ${BRAND_COLORS.ORANGE}33;
}

.annotationLayer .linkAnnotation:hover {
  opacity: 0.6;
  box-shadow: 0 2px 10px ${BRAND_COLORS.ORANGE}66;
}

.annotationLayer .textAnnotation {
  position: absolute;
  padding: 5px;
  box-sizing: border-box;
  color: #000;
  font-size: ${DEFAULT_ANNOTATION_STYLES.text.fontSize}px;
  font-family: ${DEFAULT_ANNOTATION_STYLES.text.fontFamily};
  background-color: ${DEFAULT_ANNOTATION_STYLES.text.backgroundColor};
  border: 1px solid ${BRAND_COLORS.ORANGE};
  border-radius: 3px;
  pointer-events: auto;
  white-space: pre;
  overflow: hidden;
}

.annotationLayer .textAnnotation:hover {
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.annotationLayer .textAnnotation.editing {
  border: 2px dashed ${BRAND_COLORS.ORANGE};
}

.annotationLayer .popupAnnotation {
  display: flex;
  flex-direction: column;
  position: absolute;
  width: 250px;
  background-color: #FFFFE0;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  border-radius: 3px;
  padding: 10px;
  font-size: 12px;
  min-height: 50px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 100;
}

.annotationLayer .highlightAnnotation {
  background-color: ${DEFAULT_ANNOTATION_STYLES.highlight.color};
  border-radius: 2px;
  pointer-events: auto;
}

.annotationLayer .underlineAnnotation {
  border-bottom: 2px solid ${BRAND_COLORS.ORANGE};
  pointer-events: auto;
}

.annotationLayer .freeTextAnnotation {
  font-family: ${DEFAULT_ANNOTATION_STYLES.text.fontFamily};
  font-size: ${DEFAULT_ANNOTATION_STYLES.text.fontSize}px;
  background-color: ${DEFAULT_ANNOTATION_STYLES.text.backgroundColor};
  border: 1px solid ${BRAND_COLORS.ORANGE};
  border-radius: 3px;
  padding: 4px;
  resize: both;
  overflow: hidden;
}

.annotationLayer .inkAnnotation {
  stroke: ${DEFAULT_ANNOTATION_STYLES.ink.color};
  stroke-width: ${DEFAULT_ANNOTATION_STYLES.ink.thickness}px;
  fill: none;
  pointer-events: auto;
}

.annotationLayer .stampAnnotation {
  opacity: 0.85;
  pointer-events: auto;
}

.annotationLayer .signatureAnnotation {
  font-family: ${DEFAULT_ANNOTATION_STYLES.signature.fontFamily};
  font-size: ${DEFAULT_ANNOTATION_STYLES.signature.fontSize}px;
  color: ${DEFAULT_ANNOTATION_STYLES.signature.color};
  background-color: ${DEFAULT_ANNOTATION_STYLES.signature.backgroundColor};
  border: 1px solid #AAA;
  border-radius: 3px;
  padding: 2px;
  pointer-events: auto;
}

.annotationEditorLayer {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 4;
  pointer-events: none;
}

.annotationEditorLayer .selectedEditor {
  border: 2px solid ${BRAND_COLORS.ORANGE} !important;
  box-shadow: 0 0 5px ${BRAND_COLORS.ORANGE}88 !important;
}

.xfaLayer {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2;
  pointer-events: none;
}

.xfaLayer .xfaField {
  pointer-events: auto;
}
`;

/**
 * Inject annotation styles into the document
 */
export function injectAnnotationStyles(): void {
  // Check if styles are already injected
  if (document.getElementById('pdf-annotation-styles')) {
    return;
  }
  
  // Create style element
  const styleElement = document.createElement('style');
  styleElement.id = 'pdf-annotation-styles';
  styleElement.textContent = ANNOTATION_CSS;
  
  // Append to document head
  document.head.appendChild(styleElement);
}

/**
 * Cleanup annotation styles when no longer needed
 */
export function cleanupAnnotationStyles(): void {
  const styleElement = document.getElementById('pdf-annotation-styles');
  if (styleElement) {
    styleElement.remove();
  }
}

/**
 * Get style properties for text annotations
 */
export function getTextAnnotationStyle(customStyles = {}) {
  return {
    ...DEFAULT_ANNOTATION_STYLES.text,
    ...customStyles
  };
}

/**
 * Get style properties for highlight annotations
 */
export function getHighlightAnnotationStyle(customStyles = {}) {
  return {
    ...DEFAULT_ANNOTATION_STYLES.highlight,
    ...customStyles
  };
}

/**
 * Get style properties for ink annotations
 */
export function getInkAnnotationStyle(customStyles = {}) {
  return {
    ...DEFAULT_ANNOTATION_STYLES.ink,
    ...customStyles
  };
}

/**
 * Get style properties for signature annotations
 */
export function getSignatureAnnotationStyle(customStyles = {}) {
  return {
    ...DEFAULT_ANNOTATION_STYLES.signature,
    ...customStyles
  };
}