import { useState, useCallback } from 'react';
import { AnnotationMode, getAnnotationMode } from '../utils/annotationConfig';

/**
 * Hook for managing annotation state
 * 
 * This hook handles:
 * - Current annotation mode tracking
 * - Mode toggling
 * - Getting the PDF.js annotation editor type
 */
export function useAnnotationState() {
  // Current annotation mode
  const [annotationMode, setAnnotationMode] = useState<AnnotationMode>(null);
  
  // Track if user is actively annotating
  const [isAnnotating, setIsAnnotating] = useState<boolean>(false);
  
  // Track if annotations have been modified
  const [annotationsModified, setAnnotationsModified] = useState<boolean>(false);
  
  /**
   * Toggle annotation mode
   * 
   * If the mode is already active, turn it off
   * Otherwise, activate the new mode
   */
  const toggleAnnotationMode = useCallback((mode: AnnotationMode) => {
    // If trying to select the currently active mode, turn it off
    if (mode === annotationMode) {
      setAnnotationMode(null);
      setIsAnnotating(false);
    } else {
      // Type safety check to make sure we only set valid annotation modes
      if (mode === 'text' || mode === 'highlight' || mode === 'signature' || mode === null) {
        setAnnotationMode(mode);
        setIsAnnotating(mode !== null);
      }
    }
  }, [annotationMode]);
  
  /**
   * Get PDF.js annotation editor type
   * 
   * Converts our string mode to PDF.js numeric constants
   */
  const getAnnotationEditorType = useCallback(() => {
    return getAnnotationMode(annotationMode);
  }, [annotationMode]);
  
  /**
   * Mark annotations as modified
   */
  const markAnnotationsModified = useCallback(() => {
    setAnnotationsModified(true);
  }, []);
  
  /**
   * Reset annotations modified state after saving
   */
  const resetAnnotationsModified = useCallback(() => {
    setAnnotationsModified(false);
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