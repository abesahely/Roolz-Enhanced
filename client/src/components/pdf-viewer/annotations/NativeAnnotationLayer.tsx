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
    // Early return checks
    if (!page || !viewport || !isVisible) return;
    if (!annotationLayerRef.current || !annotationEditorLayerRef.current) return;
    
    // Create a non-flipped viewport for annotations (PDF.js expects non-flipped)
    const annotationViewport = viewport.clone({ dontFlip: true });
    
    // Clear any existing content
    annotationLayerRef.current.innerHTML = '';
    annotationEditorLayerRef.current.innerHTML = '';
    
    // Update link service with current page
    if (page._pageIndex !== undefined) {
      linkServiceRef.current.page = page._pageIndex + 1;
    }
    
    // Setup annotation layer (static annotations)
    const setupAnnotationLayer = () => {
      try {
        if (pdfjsLib.AnnotationLayer) {
          const annotationLayer = new pdfjsLib.AnnotationLayer({
            viewport: annotationViewport,
            div: annotationLayerRef.current,
            page,
            renderInteractiveForms: true,
          } as any);
          
          annotationLayer.render({
            viewport: annotationViewport,
          } as any);
        }
      } catch (error) {
        console.error('Error rendering annotation layer:', error);
      }
    };
    
    // Setup annotation editor layer (editable annotations)
    const setupEditorLayer = () => {
      try {
        if (window.PDFViewerApplication?.pdfViewer?.annotationEditorUIManager && 
            typeof pdfjsLib.AnnotationEditorLayer === 'function') {
          
          const { annotationEditorUIManager } = window.PDFViewerApplication.pdfViewer;
          
          // Create parameters that should work with our PDF.js version
          const editorParams = {
            div: annotationEditorLayerRef.current,
            viewport: annotationViewport,
            page,
            uiManager: annotationEditorUIManager,
            // Add safe fallback values for required parameters
            accessibilityManager: null,
            annotationLayer: null,
            mode: 1, // Text editor mode
            l10n: null,
            fieldObjects: {}, // Empty object instead of undefined
          };
          
          const annotationEditorLayer = new pdfjsLib.AnnotationEditorLayer(editorParams as any);
          
          // Update the current page number in PDFViewerApplication
          if (typeof page._pageIndex === 'number') {
            window.PDFViewerApplication.pdfViewer.currentPageNumber = page._pageIndex + 1;
          }
          
          // Render with minimal properties
          annotationEditorLayer.render({
            viewport: annotationViewport,
          } as any);
        }
      } catch (error) {
        console.error('Error initializing annotation editor layer:', error);
      }
    };
    
    // Run setup functions
    setupAnnotationLayer();
    setupEditorLayer();
    
    // Clean up function
    return () => {
      // Any cleanup needed for annotation layers
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