/**
 * Native Annotation Layer Component
 *
 * This component provides integration with PDF.js native annotation capabilities,
 * allowing direct interaction with the PDF annotation system.
 */
import React, { useEffect, useRef } from 'react';
import { initializePDFJS, isPDFJSInitialized } from '../utils/PDFJSInitializer';
import { pdfEventBus } from '../utils/EventBus';
import { annotationManager } from '../utils/AnnotationManager';
import { EditorModes } from '../utils/annotationConfig';

interface NativeAnnotationLayerProps {
  /**
   * Current page viewport from PDF.js
   */
  viewport?: any;
  
  /**
   * PDF page object from PDF.js
   */
  pdfPage?: any;
  
  /**
   * Current page number
   */
  pageNumber?: number;
  
  /**
   * Canvas element for PDF rendering
   */
  canvas?: HTMLCanvasElement | null;
  
  /**
   * Current annotation mode
   */
  annotationMode?: number;
  
  /**
   * Whether the viewer is in edit mode
   */
  isEditMode?: boolean;
  
  /**
   * Callback when an annotation is created
   */
  onAnnotationCreated?: (annotation: any) => void;
  
  /**
   * Callback when an annotation is modified
   */
  onAnnotationModified?: (annotation: any) => void;
}

/**
 * NativeAnnotationLayer component
 * This component initializes and manages the PDF.js native annotation system
 */
const NativeAnnotationLayer: React.FC<NativeAnnotationLayerProps> = ({
  viewport,
  pdfPage,
  pageNumber = 1,
  canvas,
  annotationMode = EditorModes.NONE,
  isEditMode = false,
  onAnnotationCreated,
  onAnnotationModified
}) => {
  // Reference to track if this component has initialized annotations
  const hasInitializedRef = useRef(false);
  
  // Effect to initialize PDF.js annotation system
  useEffect(() => {
    // Skip if already initialized by this component
    if (hasInitializedRef.current) return;
    
    // Initialize the PDF.js environment if needed
    if (!isPDFJSInitialized()) {
      console.log('Initializing PDF.js annotation environment');
      initializePDFJS();
    }
    
    // Set up annotation handlers
    if (onAnnotationCreated) {
      annotationManager.onAnnotationCreated(onAnnotationCreated);
    }
    
    if (onAnnotationModified) {
      pdfEventBus.on('annotationedited', onAnnotationModified);
    }
    
    // Mark as initialized
    hasInitializedRef.current = true;
    
    // Clean up on unmount
    return () => {
      if (onAnnotationModified) {
        pdfEventBus.off('annotationedited', onAnnotationModified);
      }
      
      // Note: We don't clean up the entire system here as other components
      // might still be using it. The parent component should handle cleanup.
    };
  }, [onAnnotationCreated, onAnnotationModified]);
  
  // Effect to update annotation mode when it changes
  useEffect(() => {
    if (hasInitializedRef.current) {
      // Update the editor mode in the annotation manager
      annotationManager.setMode(annotationMode || EditorModes.NONE);
    }
  }, [annotationMode]);
  
  return null; // No DOM elements needed, this is purely a logical component
};

export default NativeAnnotationLayer;