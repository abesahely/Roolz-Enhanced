import React, { useRef, useEffect, useState } from 'react';
import { annotationManager, Annotation } from '../direct-viewer/CustomAnnotationManager';
import { AnnotationMode } from '../utils/annotationConfig';

interface AnnotationLayerProps {
  /**
   * Active annotation mode
   */
  annotationMode: AnnotationMode;
  
  /**
   * Canvas element for the PDF page
   */
  canvas: HTMLCanvasElement | null;
  
  /**
   * Current page number
   */
  pageNumber: number;
  
  /**
   * Current scale
   */
  scale: number;
  
  /**
   * Callback when annotations are modified
   */
  onAnnotationsModified?: () => void;
}

/**
 * AnnotationLayer component
 * 
 * Provides an interactive layer for adding annotations to PDFs
 * using our custom annotation manager.
 */
const AnnotationLayer: React.FC<AnnotationLayerProps> = ({
  annotationMode,
  canvas,
  pageNumber,
  scale,
  onAnnotationsModified,
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [currentAnnotations, setCurrentAnnotations] = useState<Annotation[]>([]);
  
  // Initialize annotation manager with canvas
  useEffect(() => {
    if (canvas) {
      annotationManager.initialize(canvas);
      annotationManager.setPage(pageNumber);
      annotationManager.setScale(scale);
      
      if (onAnnotationsModified) {
        annotationManager.onAnnotationsModified(onAnnotationsModified);
      }
      
      // Update dimensions based on canvas
      setDimensions({
        width: canvas.width,
        height: canvas.height
      });
      
      // Get current annotations for this page
      setCurrentAnnotations(annotationManager.getAnnotationsForCurrentPage());
    }
  }, [canvas, pageNumber, scale, onAnnotationsModified]);
  
  // Update when page or scale changes
  useEffect(() => {
    if (canvas) {
      annotationManager.setPage(pageNumber);
      annotationManager.setScale(scale);
      setCurrentAnnotations(annotationManager.getAnnotationsForCurrentPage());
    }
  }, [canvas, pageNumber, scale]);
  
  // Handle click/tap on the overlay to add annotations
  const handleInteraction = (e: React.MouseEvent | React.TouchEvent) => {
    if (!annotationMode || !canvas) return;
    
    // Prevent default to avoid unwanted behaviors
    e.preventDefault();
    
    // Ensure the canvas parent is positioned relatively
    if (canvas.parentElement) {
      const computedStyle = window.getComputedStyle(canvas.parentElement);
      if (computedStyle.position === 'static') {
        canvas.parentElement.style.position = 'relative';
      }
    }
    
    // Convert React event to DOM event
    let domEvent: MouseEvent | TouchEvent;
    if ('touches' in e.nativeEvent) {
      domEvent = e.nativeEvent as TouchEvent;
    } else {
      domEvent = e.nativeEvent as MouseEvent;
    }
    
    // Handle the interaction with our manager
    annotationManager.handleInteraction(annotationMode, domEvent);
    
    // Update local state with new annotations
    setCurrentAnnotations(annotationManager.getAnnotationsForCurrentPage());
  };
  
  if (!canvas || !dimensions.width || !dimensions.height) {
    return null;
  }
  
  return (
    <div 
      ref={overlayRef}
      className="absolute top-0 left-0 z-10"
      style={{ 
        width: `${dimensions.width}px`, 
        height: `${dimensions.height}px`,
        cursor: annotationMode ? 'crosshair' : 'default',
        pointerEvents: annotationMode ? 'auto' : 'none'
      }}
      onClick={handleInteraction}
      onTouchStart={handleInteraction}
    />
  );
};

export default AnnotationLayer;