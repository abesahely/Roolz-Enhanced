/**
 * Annotation Container Component
 * 
 * This component brings together all annotation-related components,
 * providing a unified interface for controlling PDF annotations.
 */
import React, { useState, useCallback, useEffect } from 'react';
import { AnnotationMode, AnnotationModes } from '../utils/annotationConfig';
import { updateAnnotationEditorMode } from '../utils/AnnotationManager';
import AnnotationToolbar from './AnnotationToolbar';
import NativeTextAnnotator from './NativeTextAnnotator';
import NativeHighlightAnnotator from './NativeHighlightAnnotator';
import NativeSignatureAnnotator from './NativeSignatureAnnotator';

interface AnnotationContainerProps {
  /**
   * Whether annotations are enabled
   */
  enabled: boolean;
  
  /**
   * Callback when an annotation is added
   */
  onAnnotationAdded?: (type: string, data: any) => void;
  
  /**
   * Callback when annotations are saved
   */
  onSave?: () => void;
  
  /**
   * Whether annotations have been modified
   */
  hasModifications?: boolean;
  
  /**
   * Callback to close the annotation tools
   */
  onClose?: () => void;
  
  /**
   * Initial annotation mode
   */
  initialMode?: AnnotationMode;
  
  /**
   * Callback when a text annotation is added
   */
  onTextAdded?: (text: string, position?: { x: number, y: number }) => void;
  
  /**
   * Callback when a highlight annotation is added
   */
  onHighlightAdded?: (text: string, position?: { x: number, y: number, width: number, height: number }) => void;
  
  /**
   * Callback when a signature annotation is added
   */
  onSignatureAdded?: (signature: string, position?: { x: number, y: number }) => void;
  
  /**
   * Additional class name for styling
   */
  className?: string;
}

/**
 * AnnotationContainer component
 * Coordinates all annotation components and tools
 */
const AnnotationContainer: React.FC<AnnotationContainerProps> = ({
  enabled,
  onAnnotationAdded,
  onSave,
  hasModifications = false,
  onClose,
  initialMode = null,
  onTextAdded,
  onHighlightAdded,
  onSignatureAdded,
  className = ''
}) => {
  // Current annotation mode state
  const [currentMode, setCurrentMode] = useState<AnnotationMode>(initialMode);
  
  // Update mode in state and PDF.js
  const handleModeChange = useCallback((mode: AnnotationMode) => {
    // Toggle mode off if already active
    const newMode = (mode === currentMode) ? null : mode;
    
    // Update state
    setCurrentMode(newMode);
    
    // Update PDF.js editor mode
    updateAnnotationEditorMode(newMode);
    
    // Log the mode change for debugging
    console.log(`[AnnotationContainer] Mode changed to: ${newMode || 'none'}`);
  }, [currentMode]);
  
  // Handle individual annotation callbacks
  const handleTextAnnotationAdded = useCallback((text: string, position?: { x: number, y: number }) => {
    if (onTextAdded) {
      onTextAdded(text, position);
    }
    
    if (onAnnotationAdded) {
      onAnnotationAdded('text', { text, position });
    }
    
    // Turn off text mode after adding
    handleModeChange(null);
  }, [onTextAdded, onAnnotationAdded, handleModeChange]);
  
  const handleHighlightAnnotationAdded = useCallback((text: string, position?: { x: number, y: number, width: number, height: number }) => {
    if (onHighlightAdded) {
      onHighlightAdded(text, position);
    }
    
    if (onAnnotationAdded) {
      onAnnotationAdded('highlight', { text, position });
    }
    
    // Keep highlight mode active to allow multiple highlights
  }, [onHighlightAdded, onAnnotationAdded]);
  
  const handleSignatureAnnotationAdded = useCallback((signature: string, position?: { x: number, y: number }) => {
    if (onSignatureAdded) {
      onSignatureAdded(signature, position);
    }
    
    if (onAnnotationAdded) {
      onAnnotationAdded('signature', { signature, position });
    }
    
    // Signature mode turns itself off after adding
  }, [onSignatureAdded, onAnnotationAdded]);
  
  // Initial mode setup
  useEffect(() => {
    if (initialMode && enabled) {
      handleModeChange(initialMode);
    }
  }, [initialMode, enabled, handleModeChange]);
  
  // If annotations are disabled, don't render anything
  if (!enabled) {
    return null;
  }
  
  return (
    <div className={`annotation-container ${className}`}>
      {/* Annotation Toolbar */}
      <AnnotationToolbar
        currentMode={currentMode}
        onModeChange={handleModeChange}
        onSave={onSave}
        hasModifications={hasModifications}
        onClose={onClose}
        className="mb-2"
      />
      
      {/* Text Annotator */}
      <NativeTextAnnotator
        isActive={currentMode === AnnotationModes.TEXT}
        onTextAdded={handleTextAnnotationAdded}
      />
      
      {/* Highlight Annotator */}
      <NativeHighlightAnnotator
        isActive={currentMode === AnnotationModes.HIGHLIGHT}
        onHighlightAdded={handleHighlightAnnotationAdded}
      />
      
      {/* Signature Annotator */}
      <NativeSignatureAnnotator
        isActive={currentMode === AnnotationModes.SIGNATURE}
        onSignatureAdded={handleSignatureAnnotationAdded}
      />
    </div>
  );
};

export default AnnotationContainer;