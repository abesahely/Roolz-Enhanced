/**
 * Native Annotation Layer Component
 *
 * This component provides integration with PDF.js native annotation capabilities,
 * allowing direct interaction with the PDF annotation system.
 */
import React, { useEffect, useRef, useState } from 'react';
import { initializePDFJS, isPDFJSInitialized, getAnnotationStorage } from '../utils/PDFJSInitializer';
import { pdfEventBus } from '../utils/EventBus';
import { annotationManager } from '../utils/AnnotationManager';
import { EditorModes } from '../utils/annotationConfig';
import { injectAnnotationStyles, cleanupAnnotationStyles } from '../utils/annotationStyles';
import { AnnotationParameters } from '../utils/AnnotationParameters';
import AnnotationRendererLayer from './AnnotationRendererLayer';

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
  
  /**
   * Parent container element
   */
  containerRef?: React.RefObject<HTMLDivElement>;
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
  onAnnotationModified,
  containerRef
}) => {
  // Reference to track if this component has initialized annotations
  const hasInitializedRef = useRef(false);
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  
  // Set container from ref
  useEffect(() => {
    if (containerRef?.current) {
      setContainer(containerRef.current);
    }
  }, [containerRef]);
  
  // Effect to initialize PDF.js annotation system
  useEffect(() => {
    // Skip if already initialized by this component
    if (hasInitializedRef.current) return;
    
    // Initialize the PDF.js environment if needed
    if (!isPDFJSInitialized()) {
      console.log('Initializing PDF.js annotation environment');
      initializePDFJS();
    }
    
    // Inject the CSS styles for annotations
    injectAnnotationStyles();
    
    // Set up annotation handlers
    if (onAnnotationCreated) {
      annotationManager.onAnnotationCreated(onAnnotationCreated);
    }
    
    if (onAnnotationModified) {
      pdfEventBus.on('annotationedited', onAnnotationModified);
    }
    
    // Ensure annotation storage has our required fields
    const storage = getAnnotationStorage();
    if (storage && !storage.fieldObjects) {
      storage.fieldObjects = {};
    }
    
    // Mark as initialized
    hasInitializedRef.current = true;
    
    // Clean up on unmount
    return () => {
      if (onAnnotationModified) {
        pdfEventBus.off('annotationedited', onAnnotationModified);
      }
      
      if (onAnnotationCreated) {
        annotationManager.clearCallbacks('annotationCreated');
      }
      
      // Clean up styles
      cleanupAnnotationStyles();
      
      // Note: We don't clean up the entire system here as other components
      // might still be using it. The parent component should handle cleanup.
    };
  }, [onAnnotationCreated, onAnnotationModified]);
  
  // Effect to update annotation mode when it changes
  useEffect(() => {
    if (hasInitializedRef.current) {
      // Update the editor mode in the annotation manager
      annotationManager.setMode(annotationMode || EditorModes.NONE);
      
      // Set appropriate parameters based on the mode
      if (annotationMode !== undefined) {
        const params = AnnotationParameters.getEditorModeParameters(
          annotationMode || EditorModes.NONE,
          { isEditing: isEditMode }
        );
        annotationManager.setEditorParameters(params);
      }
    }
  }, [annotationMode, isEditMode]);
  
  // When page or viewport changes, notify the annotation system
  useEffect(() => {
    if (hasInitializedRef.current && pdfPage && viewport && pageNumber > 0) {
      // Update current page in PDF viewer application
      if (window.PDFViewerApplication?.pdfViewer) {
        (window.PDFViewerApplication.pdfViewer as any).currentPageNumber = pageNumber;
      }
      
      // Dispatch page change event
      pdfEventBus.dispatch('pagechanging', {
        pageNumber,
        source: this
      });
    }
  }, [pdfPage, viewport, pageNumber]);
  
  // Render annotation layers if we have necessary data
  if (pdfPage && viewport) {
    return (
      <div style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        width: `${viewport.width}px`, 
        height: `${viewport.height}px`,
        pointerEvents: 'none' 
      }}>
        <AnnotationRendererLayer
          pdfPage={pdfPage}
          viewport={viewport}
          container={container || document.body}
          isEditable={isEditMode}
          pageNumber={pageNumber}
          onAnnotationModified={onAnnotationModified}
        />
      </div>
    );
  }
  
  // No DOM elements needed if we don't have all required data
  return null;
};

export default NativeAnnotationLayer;