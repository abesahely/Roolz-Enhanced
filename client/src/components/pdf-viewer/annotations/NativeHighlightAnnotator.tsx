/**
 * Native Highlight Annotator Component
 * 
 * This component provides a highlight annotation interface for PDF.js,
 * enabling users to highlight text in PDF documents.
 */
import React, { useEffect } from 'react';
import { DEFAULT_ANNOTATION_STYLES } from '../utils/annotationConfig';
import { annotationManager } from '../utils/AnnotationManager';

interface NativeHighlightAnnotatorProps {
  /**
   * Whether the highlight annotator is active
   */
  isActive: boolean;
  
  /**
   * Callback when text is highlighted
   */
  onHighlightAdded?: (text: string, position?: { x: number, y: number, width: number, height: number }) => void;
  
  /**
   * Color for the highlight annotation
   */
  highlightColor?: string;
}

/**
 * Component that adds highlight annotations to PDFs
 */
const NativeHighlightAnnotator: React.FC<NativeHighlightAnnotatorProps> = ({
  isActive,
  onHighlightAdded,
  highlightColor = DEFAULT_ANNOTATION_STYLES.highlight.color
}) => {
  // Set up highlight annotation parameters when activated
  useEffect(() => {
    if (isActive) {
      // Set parameters for highlight annotations
      annotationManager.setEditorParameters({
        highlightColor: highlightColor,
      });
      
      // Register callback for when a highlight annotation is created
      const handleHighlightAnnotationCreated = (annotation: any) => {
        if (annotation && annotation.type === 'highlight' && onHighlightAdded) {
          // Extract the highlighted text if available
          const highlightedText = annotation.content || '';
          
          // Extract the highlight area (rect is an array [x, y, width, height])
          const position = annotation.rect ? {
            x: annotation.rect[0],
            y: annotation.rect[1],
            width: annotation.rect[2] - annotation.rect[0],
            height: annotation.rect[3] - annotation.rect[1]
          } : undefined;
          
          onHighlightAdded(highlightedText, position);
        }
      };
      
      annotationManager.onAnnotationCreated(handleHighlightAnnotationCreated);
      
      // Clean up the callback when deactivated
      return () => {
        annotationManager.clearCallbacks('annotationCreated', handleHighlightAnnotationCreated);
      };
    }
  }, [isActive, highlightColor, onHighlightAdded]);
  
  // This is a logical component with no UI of its own
  return null;
};

export default NativeHighlightAnnotator;