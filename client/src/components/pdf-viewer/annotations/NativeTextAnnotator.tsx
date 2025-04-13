/**
 * Native Text Annotator Component
 * 
 * This component provides a text annotation interface for PDF.js,
 * enabling users to add text boxes to PDF documents.
 */
import React, { useEffect, useState } from 'react';
import { BRAND_COLORS } from '@/lib/constants';
import { DEFAULT_ANNOTATION_STYLES } from '../utils/annotationConfig';
import { annotationManager } from '../utils/AnnotationManager';

interface NativeTextAnnotatorProps {
  /**
   * Whether the text annotator is active
   */
  isActive: boolean;
  
  /**
   * Callback when text is added
   */
  onTextAdded?: (text: string, position?: { x: number, y: number }) => void;
  
  /**
   * Default text for the annotation
   */
  defaultText?: string;
  
  /**
   * Font size for the text annotation
   */
  fontSize?: number;
  
  /**
   * Font family for the text annotation
   */
  fontFamily?: string;
  
  /**
   * Background color for the text annotation
   */
  backgroundColor?: string;
}

/**
 * Component that adds text annotations to PDFs
 */
const NativeTextAnnotator: React.FC<NativeTextAnnotatorProps> = ({
  isActive,
  onTextAdded,
  defaultText = '',
  fontSize = DEFAULT_ANNOTATION_STYLES.text.fontSize,
  fontFamily = DEFAULT_ANNOTATION_STYLES.text.fontFamily,
  backgroundColor = DEFAULT_ANNOTATION_STYLES.text.backgroundColor
}) => {
  // Track text annotation parameters
  const [text, setText] = useState(defaultText);
  
  // Set up text annotation parameters when activated
  useEffect(() => {
    if (isActive) {
      // Set parameters for text annotations
      annotationManager.setEditorParameters({
        fontSize,
        fontFamily,
        textColor: DEFAULT_ANNOTATION_STYLES.text.color,
        backgroundColor,
        strokeColor: BRAND_COLORS.ORANGE,
        padding: 5
      });
      
      // Register callback for when a text annotation is created
      const handleTextAnnotationCreated = (annotation: any) => {
        if (annotation && annotation.type === 'freetext' && onTextAdded) {
          onTextAdded(annotation.content || '', {
            x: annotation.rect[0],
            y: annotation.rect[1]
          });
        }
      };
      
      annotationManager.onAnnotationCreated(handleTextAnnotationCreated);
      
      // Clean up the callback when deactivated
      return () => {
        annotationManager.clearCallbacks('annotationCreated', handleTextAnnotationCreated);
      };
    }
  }, [isActive, fontSize, fontFamily, backgroundColor, onTextAdded]);
  
  // This is a logical component with no UI of its own
  return null;
};

export default NativeTextAnnotator;