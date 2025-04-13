/**
 * Annotation Renderer Layer
 * 
 * This component integrates with PDF.js to correctly render annotations
 * on top of the PDF page content.
 */
import React, { useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
import { pdfEventBus } from '../utils/EventBus';
import { annotationManager } from '../utils/AnnotationManager';
import { getAnnotationStorage, getLinkService } from '../utils/PDFJSInitializer';

interface AnnotationRendererLayerProps {
  /**
   * The PDF page object
   */
  pdfPage: any;
  
  /**
   * The page viewport
   */
  viewport: any;
  
  /**
   * The container element
   */
  container: HTMLDivElement | null;
  
  /**
   * Whether annotations are editable
   */
  isEditable?: boolean;
  
  /**
   * Current page number
   */
  pageNumber?: number;
  
  /**
   * Callback when an annotation is modified
   */
  onAnnotationModified?: () => void;
}

/**
 * Renders PDF.js annotation layers
 */
const AnnotationRendererLayer: React.FC<AnnotationRendererLayerProps> = ({
  pdfPage,
  viewport,
  container,
  isEditable = true,
  pageNumber = 1,
  onAnnotationModified
}) => {
  // Reference to the annotation layer
  const annotationLayerRef = useRef<HTMLDivElement | null>(null);
  const editorLayerRef = useRef<HTMLDivElement | null>(null);
  const xfaLayerRef = useRef<HTMLDivElement | null>(null);
  
  // Track cleanup functions
  const cleanupFunctionsRef = useRef<Array<() => void>>([]);
  
  // Effect to create and render the annotation layers
  useEffect(() => {
    // Skip if missing required props
    if (!pdfPage || !viewport || !container) {
      return;
    }
    
    // Skip if layer references aren't available
    if (!annotationLayerRef.current) {
      return;
    }
    
    const runCleanupFunctions = () => {
      // Run all registered cleanup functions
      cleanupFunctionsRef.current.forEach(cleanup => {
        try {
          cleanup();
        } catch (error) {
          console.error('Error during annotation layer cleanup:', error);
        }
      });
      
      // Reset the cleanup functions array
      cleanupFunctionsRef.current = [];
    };
    
    // Run any existing cleanup functions
    runCleanupFunctions();
    
    // Get parameters and create annotation layer elements
    const parameters = {
      viewport: viewport.clone({ dontFlip: false }),
      div: annotationLayerRef.current,
      annotations: [], // Initialize with empty array instead of null
      page: pdfPage,
      linkService: window.PDFViewerApplication?.pdfViewer?.linkService || getLinkService() || null,
      downloadManager: null,
      // Include fields needed for PDF.js annotation layer
      annotationStorage: getAnnotationStorage() || null,
      imageResourcesPath: './images/',
      renderForms: true,
      enableScripting: false,
      fieldObjects: {}, // Critical: this prevents the "params.fieldObjects is undefined" error
      annotationCanvasMap: null,
      accessibilityManager: null,
      // PDF.js 3.x specific parameters
      isEditable: isEditable, // Pass isEditable directly as a parameter 
      xfaHtml: null,
      textLayer: null,
      annotationEditorUIManager: window.PDFViewerApplication?.annotationEditorUIManager,
    };
    
    // Set up annotation layer (using type assertion to bypass strict type checking)
    // @ts-ignore - Ignoring type checking for PDF.js parameters
    const annotationLayer = new pdfjsLib.AnnotationLayer({
      ...parameters
    });
    
    // Set up editor layer if editable
    let editorLayer = null;
    if (isEditable && editorLayerRef.current) {
      try {
        // Make sure we have the UI manager
        const uiManager = window.PDFViewerApplication?.pdfViewer?.annotationEditorUIManager 
          || window.PDFViewerApplication?.annotationEditorUIManager;
        
        // Create the editor layer with proper parameters
        // @ts-ignore - Ignoring type checking for PDF.js parameters
        editorLayer = new pdfjsLib.AnnotationEditorLayer({
          ...parameters,
          uiManager: uiManager,
          div: editorLayerRef.current,
          mode: annotationManager.currentMode,
          // Use a minimal accessibilityManager to fix null errors
          accessibilityManager: {
            isVisible: false,
            notify: () => {},
            setIsVisible: (visible) => {},
            register: () => {},
            unregister: () => {}
          },
          // Use minimal l10n implementation
          l10n: {
            get: (key, args, fallback) => fallback || key
          },
          editingState: false,
        });
        
        // Log successful creation for debugging
        console.log('Annotation editor layer created successfully', {
          mode: annotationManager.currentMode,
          uiManager: !!uiManager
        });
      } catch (error) {
        console.error('Error creating annotation editor layer:', error);
      }
    }
    
    // Set up XFA layer (for complex forms)
    let xfaLayer = null;
    if (xfaLayerRef.current) {
      try {
        // @ts-ignore - Ignoring type checking for PDF.js parameters
        xfaLayer = new pdfjsLib.XfaLayer({
          ...parameters,
          div: xfaLayerRef.current,
        });
      } catch (error) {
        console.error('Error creating XFA layer:', error);
      }
    }
    
    // Load annotations from the page
    pdfPage.getAnnotations({ intent: 'display' }).then((annotations: any) => {
      if (annotations.length > 0) {
        console.log(`Page ${pageNumber} has ${annotations.length} annotations`);
      }
      
      // Render the annotation layer
      if (annotationLayer) {
        parameters.annotations = annotations;
        annotationLayer.render(parameters);
        
        // Register cleanup for annotation layer
        cleanupFunctionsRef.current.push(() => {
          try {
            // @ts-ignore - PDF.js doesn't expose cancel() in types but it exists
            if (annotationLayer && typeof annotationLayer.cancel === 'function') {
              annotationLayer.cancel();
            }
          } catch (e) {
            console.error('Error canceling annotation layer:', e);
          }
        });
      }
      
      // Render the editor layer if available
      if (editorLayer) {
        try {
          // @ts-ignore - PDF.js doesn't expose render() in types but it exists
          editorLayer.render(parameters);
          
          // Register cleanup for editor layer
          cleanupFunctionsRef.current.push(() => {
            try {
              // @ts-ignore - PDF.js doesn't expose cancel() in types but it exists
              if (editorLayer && typeof editorLayer.cancel === 'function') {
                editorLayer.cancel();
              }
            } catch (e) {
              console.error('Error canceling editor layer:', e);
            }
          });
        } catch (error) {
          console.error('Error rendering annotation editor layer:', error);
        }
      }
      
      // Render the XFA layer if available
      if (xfaLayer) {
        try {
          // @ts-ignore - PDF.js doesn't expose render() correctly in types
          if (typeof xfaLayer.render === 'function') {
            xfaLayer.render(parameters);
          } else if (typeof pdfjsLib.XfaLayer.render === 'function') {
            // Some PDF.js versions use static methods
            pdfjsLib.XfaLayer.render(parameters);
          }
          
          // Register cleanup for XFA layer
          cleanupFunctionsRef.current.push(() => {
            try {
              // @ts-ignore - PDF.js doesn't expose cancel() in types but it exists
              if (xfaLayer && typeof xfaLayer.cancel === 'function') {
                xfaLayer.cancel();
              }
            } catch (e) {
              console.error('Error canceling XFA layer:', e);
            }
          });
        } catch (error) {
          console.error('Error rendering XFA layer:', error);
        }
      }
      
      // Set up annotation change handler
      const handleAnnotationChange = () => {
        if (onAnnotationModified) {
          onAnnotationModified();
        }
      };
      
      // Subscribe to annotation events
      pdfEventBus.on('annotationedited', handleAnnotationChange);
      pdfEventBus.on('annotationupdated', handleAnnotationChange);
      
      // Register cleanup for event listeners
      cleanupFunctionsRef.current.push(() => {
        pdfEventBus.off('annotationedited', handleAnnotationChange);
        pdfEventBus.off('annotationupdated', handleAnnotationChange);
      });
    });
    
    // Clean up when component unmounts or inputs change
    return () => {
      runCleanupFunctions();
    };
  }, [pdfPage, viewport, container, isEditable, pageNumber, onAnnotationModified]);
  
  // Render the layer elements
  return (
    <div className="pdf-annotation-layers" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }}>
      {/* The annotation layer for static annotations */}
      <div
        ref={annotationLayerRef}
        className="annotationLayer"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'auto' }}
      />
      
      {/* The editor layer for interactive annotations */}
      <div
        ref={editorLayerRef}
        className="annotationEditorLayer"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'auto' }}
      />
      
      {/* The XFA layer for complex form annotations */}
      <div
        ref={xfaLayerRef}
        className="xfaLayer"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'auto' }}
      />
    </div>
  );
};

export default AnnotationRendererLayer;