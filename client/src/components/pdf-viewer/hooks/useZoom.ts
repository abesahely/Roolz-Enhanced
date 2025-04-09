/**
 * Zoom Hook
 * 
 * This hook manages zoom state and operations for the PDF viewer.
 */
import { useState, useCallback, useEffect, useRef } from 'react';
import { PDF_VIEWER } from '../utils/constants';

interface UseZoomOptions {
  initialScale?: number;
  initialAutoScale?: boolean;
  minScale?: number;
  maxScale?: number;
  scaleStep?: number;
  onScaleChange?: (scale: number) => void;
}

interface UseZoomReturn {
  scale: number;
  autoScale: boolean;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  setScale: (scale: number) => void;
  toggleAutoScale: () => void;
  calculateFitScale: (width: number, height: number, containerWidth: number, containerHeight: number) => number;
}

/**
 * Custom hook for managing zoom functionality in the PDF viewer
 * 
 * @param options Configuration options
 * @returns Object with zoom state and functions
 */
export const useZoom = (options?: UseZoomOptions): UseZoomReturn => {
  // Default options
  const {
    initialScale = PDF_VIEWER.DEFAULT_SCALE,
    initialAutoScale = true,
    minScale = PDF_VIEWER.ZOOM_MIN,
    maxScale = PDF_VIEWER.ZOOM_MAX,
    scaleStep = PDF_VIEWER.ZOOM_STEP,
    onScaleChange
  } = options || {};

  // State
  const [scale, setScaleState] = useState<number>(initialScale);
  const [autoScale, setAutoScale] = useState<boolean>(initialAutoScale);
  
  // Ref for previous scale to track changes
  const prevScaleRef = useRef<number>(initialScale);

  // Set scale with validation
  const setScale = useCallback((newScale: number) => {
    // Ensure scale is within min/max bounds
    const validatedScale = Math.max(minScale, Math.min(maxScale, newScale));
    
    // Only update if scale changed
    if (validatedScale !== scale) {
      setScaleState(validatedScale);
      prevScaleRef.current = scale;
      
      // Call the onScaleChange callback if provided
      if (onScaleChange) {
        onScaleChange(validatedScale);
      }
    }
  }, [scale, minScale, maxScale, onScaleChange]);

  // Zoom in function
  const zoomIn = useCallback(() => {
    setScale(scale + scaleStep);
    setAutoScale(false);
  }, [scale, scaleStep, setScale]);

  // Zoom out function
  const zoomOut = useCallback(() => {
    setScale(scale - scaleStep);
    setAutoScale(false);
  }, [scale, scaleStep, setScale]);

  // Reset zoom function
  const resetZoom = useCallback(() => {
    setScale(PDF_VIEWER.DEFAULT_SCALE);
    setAutoScale(false);
  }, [setScale]);

  // Toggle auto scale
  const toggleAutoScale = useCallback(() => {
    setAutoScale(!autoScale);
  }, [autoScale]);

  // Calculate scale to fit content in container
  const calculateFitScale = useCallback((
    width: number,
    height: number,
    containerWidth: number,
    containerHeight: number
  ): number => {
    // Ensure we don't divide by zero
    if (width <= 0 || height <= 0 || containerWidth <= 0 || containerHeight <= 0) {
      return PDF_VIEWER.DEFAULT_SCALE;
    }

    // Calculate scale based on width and height
    const widthScale = containerWidth / width;
    const heightScale = containerHeight / height;

    // Use the smaller scale to ensure content fits
    const newScale = Math.min(widthScale, heightScale);

    // Ensure scale is within min/max bounds
    return Math.max(minScale, Math.min(maxScale, newScale));
  }, [minScale, maxScale]);

  // Effect for tracking scale changes
  useEffect(() => {
    // Update prevScaleRef when scale changes
    if (scale !== prevScaleRef.current) {
      prevScaleRef.current = scale;
    }
  }, [scale]);

  return {
    scale,
    autoScale,
    zoomIn,
    zoomOut,
    resetZoom,
    setScale,
    toggleAutoScale,
    calculateFitScale
  };
};

export default useZoom;