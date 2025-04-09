/**
 * Visible Area Hook
 * 
 * This hook manages the visible area of a scrollable container,
 * useful for tracking which PDF pages are currently visible.
 */
import { useState, useCallback, useEffect, useRef } from 'react';

interface VisibleAreaRect {
  top: number;
  left: number;
  width: number;
  height: number;
  right: number;
  bottom: number;
}

interface UseVisibleAreaOptions {
  debounceTime?: number;
  onVisibleAreaChange?: (area: VisibleAreaRect) => void;
}

interface UseVisibleAreaReturn {
  visibleArea: VisibleAreaRect;
  containerRef: React.RefObject<HTMLDivElement>;
  updateVisibleArea: () => void;
  isInView: (elementTop: number, elementBottom: number) => boolean;
}

/**
 * Custom hook for tracking the visible area in a scrollable container
 * 
 * @param options Configuration options
 * @returns Object with visible area state and utility functions
 */
export const useVisibleArea = (options?: UseVisibleAreaOptions): UseVisibleAreaReturn => {
  // Default options
  const {
    debounceTime = 100,
    onVisibleAreaChange
  } = options || {};

  // State for visible area
  const [visibleArea, setVisibleArea] = useState<VisibleAreaRect>({
    top: 0,
    left: 0,
    width: 0,
    height: 0,
    right: 0,
    bottom: 0
  });

  // Ref for container element
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Debounce timer ref
  const debounceTimerRef = useRef<number | null>(null);

  // Calculate and update the visible area
  const updateVisibleArea = useCallback(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const scrollTop = container.scrollTop;
    const scrollLeft = container.scrollLeft;

    const newVisibleArea = {
      top: scrollTop,
      left: scrollLeft,
      width: rect.width,
      height: rect.height,
      right: scrollLeft + rect.width,
      bottom: scrollTop + rect.height
    };

    setVisibleArea(newVisibleArea);

    // Call the onVisibleAreaChange callback if provided
    if (onVisibleAreaChange) {
      onVisibleAreaChange(newVisibleArea);
    }
  }, [onVisibleAreaChange]);

  // Check if an element is in the visible area
  const isInView = useCallback((elementTop: number, elementBottom: number): boolean => {
    // Element is at least partially visible
    return (
      (elementTop >= visibleArea.top && elementTop <= visibleArea.bottom) ||
      (elementBottom >= visibleArea.top && elementBottom <= visibleArea.bottom) ||
      (elementTop <= visibleArea.top && elementBottom >= visibleArea.bottom)
    );
  }, [visibleArea]);

  // Set up scroll and resize listeners
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    // Handler with debounce
    const handleEvent = () => {
      if (debounceTimerRef.current !== null) {
        window.clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = window.setTimeout(() => {
        updateVisibleArea();
        debounceTimerRef.current = null;
      }, debounceTime);
    };

    // Add event listeners
    container.addEventListener('scroll', handleEvent);
    window.addEventListener('resize', handleEvent);

    // Initial calculation
    updateVisibleArea();

    // Clean up event listeners
    return () => {
      container.removeEventListener('scroll', handleEvent);
      window.removeEventListener('resize', handleEvent);

      if (debounceTimerRef.current !== null) {
        window.clearTimeout(debounceTimerRef.current);
      }
    };
  }, [debounceTime, updateVisibleArea]);

  return {
    visibleArea,
    containerRef,
    updateVisibleArea,
    isInView
  };
};

export default useVisibleArea;