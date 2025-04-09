/**
 * Annotation Canvas Hook
 * 
 * This hook manages a fabric.js canvas for PDF annotations.
 */
import { useState, useEffect, useRef } from 'react';
import { fabric } from 'fabric';
import { Annotation } from '../context/AnnotationContext';
import { annotationsToFabricObjects, scaleAnnotations } from '../utils/annotationHelpers';

interface UseAnnotationCanvasOptions {
  onChange?: (fabricObjects: any[]) => void;
  onReady?: (canvas: fabric.Canvas) => void;
}

interface UseAnnotationCanvasReturn {
  canvas: fabric.Canvas | null;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  setCanvas: (canvas: fabric.Canvas | null) => void;
  addAnnotation: (annotation: any) => void;
  removeAnnotation: (object: any) => void;
  clearCanvas: () => void;
  renderAnnotations: (annotations: Annotation[], page: number) => void;
  updateCanvasSize: (width: number, height: number) => void;
  updateScale: (oldScale: number, newScale: number) => void;
}

/**
 * Custom hook for managing a fabric.js canvas for annotations
 * 
 * @param options Configuration options
 * @returns Object with canvas and canvas manipulation functions
 */
export const useAnnotationCanvas = (options?: UseAnnotationCanvasOptions): UseAnnotationCanvasReturn => {
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Initialize fabric.js canvas when component mounts
  useEffect(() => {
    if (!canvasRef.current) return;
    
    // Create the fabric.js canvas
    const fabricCanvas = new fabric.Canvas(canvasRef.current, {
      selection: true,
      preserveObjectStacking: true,
      stopContextMenu: true,
      fireRightClick: true
    });
    
    setCanvas(fabricCanvas);
    
    // Call the onReady callback if provided
    if (options?.onReady) {
      options.onReady(fabricCanvas);
    }
    
    // Clean up on unmount
    return () => {
      fabricCanvas.dispose();
      setCanvas(null);
    };
  }, [options]);
  
  // Add annotation to the canvas
  const addAnnotation = (object: any) => {
    if (!canvas) return;
    
    canvas.add(object);
    canvas.setActiveObject(object);
    canvas.renderAll();
    
    // Call the onChange callback if provided
    if (options?.onChange) {
      options.onChange(canvas.getObjects());
    }
  };
  
  // Remove annotation from the canvas
  const removeAnnotation = (object: any) => {
    if (!canvas) return;
    
    canvas.remove(object);
    canvas.renderAll();
    
    // Call the onChange callback if provided
    if (options?.onChange) {
      options.onChange(canvas.getObjects());
    }
  };
  
  // Clear all annotations from the canvas
  const clearCanvas = () => {
    if (!canvas) return;
    
    canvas.clear();
    canvas.renderAll();
    
    // Call the onChange callback if provided
    if (options?.onChange) {
      options.onChange([]);
    }
  };
  
  // Render annotations from the annotation context
  const renderAnnotations = (annotations: Annotation[], page: number) => {
    if (!canvas) return;
    
    // Clear existing annotations
    canvas.clear();
    
    // Convert annotations to fabric.js objects and add to canvas
    const fabricObjects = annotationsToFabricObjects(annotations, page);
    fabricObjects.forEach(obj => {
      canvas.add(obj);
    });
    
    canvas.renderAll();
  };
  
  // Update canvas size
  const updateCanvasSize = (width: number, height: number) => {
    if (!canvas) return;
    
    canvas.setWidth(width);
    canvas.setHeight(height);
    canvas.renderAll();
  };
  
  // Update scale when PDF zoom changes
  const updateScale = (oldScale: number, newScale: number) => {
    if (!canvas) return;
    
    scaleAnnotations(canvas, oldScale, newScale);
  };
  
  return {
    canvas,
    canvasRef,
    setCanvas,
    addAnnotation,
    removeAnnotation,
    clearCanvas,
    renderAnnotations,
    updateCanvasSize,
    updateScale
  };
};

export default useAnnotationCanvas;