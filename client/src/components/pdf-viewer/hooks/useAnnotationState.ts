import { useState, useCallback, useEffect } from 'react';
import { getAnnotationMode, isAnnotationModeActive } from '../utils/annotationConfig';

/**
 * Hook for managing annotation state
 * 
 * This hook handles:
 * - Current annotation mode tracking
 * - Mode toggling
 * - Getting the PDF.js annotation editor type
 */
export function useAnnotationState() {
  // Annotation mode - null means no annotation active
  const [annotationMode, setAnnotationMode] = useState<string | null>(null);
  
  // Whether annotation mode is active
  const [isAnnotating, setIsAnnotating] = useState<boolean>(false);
  
  // Track if annotations have been modified and need saving
  const [annotationsModified, setAnnotationsModified] = useState<boolean>(false);
  
  // Toggle between annotation modes
  const toggleAnnotationMode = useCallback((mode: string | null) => {
    if (annotationMode === mode) {
      // Turn off annotation mode if the same mode is selected
      setAnnotationMode(null);
      setIsAnnotating(false);
    } else {
      // Set the new annotation mode
      setAnnotationMode(mode);
      setIsAnnotating(true);
    }
  }, [annotationMode]);
  
  // Get annotation editor type for PDF.js
  const getAnnotationEditorType = useCallback(() => {
    return getAnnotationMode(annotationMode);
  }, [annotationMode]);
  
  // Mark annotations as modified
  const markAnnotationsModified = useCallback(() => {
    setAnnotationsModified(true);
  }, []);
  
  // Reset modified state after saving
  const resetAnnotationsModified = useCallback(() => {
    setAnnotationsModified(false);
  }, []);
  
  // Effect to listen for editor changes
  useEffect(() => {
    // Add listeners for annotation editor changes to detect modifications
    const handleAnnotationChange = () => {
      setAnnotationsModified(true);
    };
    
    // PDF.js dispatches 'annotationeditorchange' events when annotations change
    document.addEventListener('annotationeditorchange', handleAnnotationChange);
    
    return () => {
      document.removeEventListener('annotationeditorchange', handleAnnotationChange);
    };
  }, []);
  
  return {
    annotationMode,
    isAnnotating,
    annotationsModified,
    toggleAnnotationMode,
    getAnnotationEditorType,
    markAnnotationsModified,
    resetAnnotationsModified
  };
}