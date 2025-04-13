/**
 * Annotation State Hook
 * 
 * This hook manages the state for PDF annotations,
 * providing controls for annotation modes and tracking modifications.
 */
import { useState, useCallback } from 'react';
import { AnnotationMode, EditorModes, getAnnotationMode } from '../utils/annotationConfig';

interface AnnotationState {
  // Current annotation mode
  annotationMode: AnnotationMode;
  
  // Whether user is actively annotating
  isAnnotating: boolean;
  
  // Whether annotations have been modified (need saving)
  annotationsModified: boolean;
  
  // Function to toggle annotation mode
  toggleAnnotationMode: (mode: AnnotationMode) => void;
  
  // Function to get the current PDF.js editor type
  getAnnotationEditorType: () => number;
  
  // Function to mark annotations as modified
  markAnnotationsModified: () => void;
  
  // Function to reset the modified state
  resetAnnotationsModified: () => void;
}

/**
 * Hook for managing annotation state
 */
export function useAnnotationState(): AnnotationState {
  // Current annotation mode (null means none)
  const [annotationMode, setAnnotationMode] = useState<AnnotationMode>(null);
  
  // Track whether annotations have been modified
  const [annotationsModified, setAnnotationsModified] = useState<boolean>(false);
  
  /**
   * Toggle the annotation mode between the provided mode and none
   */
  const toggleAnnotationMode = useCallback((mode: AnnotationMode) => {
    setAnnotationMode(currentMode => {
      // If already in this mode, turn it off
      if (currentMode === mode) {
        return null; // Set to no annotation mode
      }
      // Otherwise, switch to the requested mode
      return mode;
    });
  }, []);
  
  /**
   * Get the current annotation editor type number for PDF.js
   */
  const getAnnotationEditorType = useCallback((): number => {
    return annotationMode ? getAnnotationMode(annotationMode) : EditorModes.NONE;
  }, [annotationMode]);
  
  /**
   * Mark annotations as modified (need saving)
   */
  const markAnnotationsModified = useCallback(() => {
    setAnnotationsModified(true);
  }, []);
  
  /**
   * Reset annotations modified state (e.g., after saving)
   */
  const resetAnnotationsModified = useCallback(() => {
    setAnnotationsModified(false);
  }, []);
  
  // Calculate whether user is currently in annotation mode
  const isAnnotating = annotationMode !== null;
  
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