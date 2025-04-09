/**
 * PDF Viewer Component Library
 * 
 * This module provides a complete PDF viewing and annotation solution
 * based on React-PDF with beNext.io branding.
 */

// Main container component
export { default as PDFViewerContainer } from './core/PDFViewerContainer';

// Core components for direct usage
export { default as PDFDocument } from './core/PDFDocument';
export { default as PDFControlBar } from './core/PDFControlBar';
export { default as PDFErrorBoundary } from './core/ErrorBoundary';

// Annotation components
export { default as AnnotationLayerContainer } from './annotations/AnnotationLayerContainer';
export { default as AnnotationToolbar } from './annotations/AnnotationToolbar';

// Context providers for advanced usage
export { PDFProvider, usePDFContext } from './context/PDFContext';
export { AnnotationProvider, useAnnotationContext } from './context/AnnotationContext';
export { MobileProvider, useMobileContext } from './context/MobileContext';

// Hooks for custom implementations
export { usePDFDocument } from './hooks/usePDFDocument';
export { useAnnotationCanvas } from './hooks/useAnnotationCanvas';
export { useVisibleArea } from './hooks/useVisibleArea';
export { useSavePDF } from './hooks/useSavePDF';
export { useZoom } from './hooks/useZoom';

// Constants and helpers
export * from './utils/constants';