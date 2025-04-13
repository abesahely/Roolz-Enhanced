/**
 * Native PDF.js Annotation Layer Component
 * 
 * This component renders the native PDF.js annotation layers,
 * including both the static annotation layer and the editable
 * annotation editor layer.
 */

import React, { useRef, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
import { pdfEventBus } from '../utils/EventBus';
import { SimpleLinkService } from '../utils/LinkService';

interface NativeAnnotationLayerProps {
  /**
   * The PDF page object
   */
  page: any;
  
  /**
   * The viewport for the PDF page
   */
  viewport: any;
  
  /**
   * Whether the annotation layer is visible
   */
  isVisible?: boolean;
  
  /**
   * The current scale of the PDF
   */
  scale?: number;
}

/**
 * NativeAnnotationLayer component
 * 
 * Renders the PDF.js annotation layers for a specific page
 */
const NativeAnnotationLayer: React.FC<NativeAnnotationLayerProps> = ({
  page,
  viewport,
  isVisible = true,
  scale = 1.0,
}) => {
  // References to the DOM elements for the layers
  const annotationLayerRef = useRef<HTMLDivElement>(null);
  const annotationEditorLayerRef = useRef<HTMLDivElement>(null);
  
  // Reference to the link service
  const linkServiceRef = useRef<SimpleLinkService>(new SimpleLinkService());
  
  // Initialize the annotation layers when the page or viewport changes
  useEffect(() => {
    if (!page || !viewport || !isVisible) return;
    
    // Skip if the refs aren't available
    if (!annotationLayerRef.current || !annotationEditorLayerRef.current) return;
    
    // Create a non-flipped viewport for annotations
    // PDF.js annotations expect a non-flipped viewport
    const annotationViewport = viewport.clone({ dontFlip: true });
    
    // Clear any existing content
    annotationLayerRef.current.innerHTML = '';
    annotationEditorLayerRef.current.innerHTML = '';
    
    // Update link service
    linkServiceRef.current.page = page._pageIndex + 1;
    
    // Initialize annotation layer
    const annotationLayer = new pdfjsLib.AnnotationLayer({
      viewport: annotationViewport,
      div: annotationLayerRef.current,
      page,
      linkService: linkServiceRef.current,
      renderInteractiveForms: true,
      eventBus: pdfEventBus,
    });
    
    annotationLayer.render({
      viewport: annotationViewport,
      intent: 'display',
    });
    
    // Initialize annotation editor layer if the global UI manager exists
    if (window.PDFViewerApplication?.pdfViewer?.annotationEditorUIManager) {
      // Use the existing annotation editor UI manager
      const { annotationEditorUIManager } = window.PDFViewerApplication.pdfViewer;
      
      // Create the annotation editor layer
      const annotationEditorLayer = new pdfjsLib.AnnotationEditorLayer({
        uiManager: annotationEditorUIManager,
        div: annotationEditorLayerRef.current,
        viewport: annotationViewport,
        page,
        eventBus: pdfEventBus,
      });
      
      // Set the current page index in the UI manager
      annotationEditorUIManager.setActiveEditor(page._pageIndex);
      
      // Render the editor layer
      annotationEditorLayer.render({
        viewport: annotationViewport,
      });
    }
    
    // Clean up
    return () => {
      // Any cleanup needed for layers
    };
  }, [page, viewport, isVisible, scale]);
  
  if (!isVisible) {
    return null;
  }
  
  return (
    <>
      {/* Static annotation layer for non-editable annotations */}
      <div 
        ref={annotationLayerRef}
        className="annotationLayer"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
          zIndex: 1
        }}
      />
      
      {/* Editable annotation editor layer */}
      <div 
        ref={annotationEditorLayerRef}
        className="annotationEditorLayer"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'auto',
          zIndex: 2
        }}
      />
    </>
  );
};

export default NativeAnnotationLayer;