/**
 * Native Signature Annotator Component
 * 
 * This component provides a signature annotation interface for PDF.js,
 * enabling users to add signature text to PDF documents.
 */
import React, { useEffect, useState } from 'react';
import { SIGNATURE_FONT } from '@/lib/constants';
import { DEFAULT_ANNOTATION_STYLES } from '../utils/annotationConfig';
import { annotationManager } from '../utils/AnnotationManager';
import SignatureModal from '../../SignatureModal';

interface NativeSignatureAnnotatorProps {
  /**
   * Whether the signature annotator is active
   */
  isActive: boolean;
  
  /**
   * Callback when a signature is added
   */
  onSignatureAdded?: (signature: string, position?: { x: number, y: number }) => void;
  
  /**
   * Font size for the signature annotation
   */
  fontSize?: number;
  
  /**
   * Font family for the signature annotation
   */
  fontFamily?: string;
}

/**
 * Component that adds signature annotations to PDFs
 */
const NativeSignatureAnnotator: React.FC<NativeSignatureAnnotatorProps> = ({
  isActive,
  onSignatureAdded,
  fontSize = DEFAULT_ANNOTATION_STYLES.signature.fontSize,
  fontFamily = DEFAULT_ANNOTATION_STYLES.signature.fontFamily
}) => {
  // State for the signature modal
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  
  // Open the signature modal when the component becomes active
  useEffect(() => {
    if (isActive) {
      setIsSignatureModalOpen(true);
    }
  }, [isActive]);
  
  // Handle signature save
  const handleSignatureSave = (signatureText: string) => {
    // Close the modal
    setIsSignatureModalOpen(false);
    
    if (!signatureText.trim()) {
      // If no signature, turn off the annotation mode
      annotationManager.setMode(0); // Set to NONE mode
      return;
    }
    
    // Set parameters for signature annotations (using text annotations)
    annotationManager.setEditorParameters({
      fontSize,
      fontFamily,
      textColor: DEFAULT_ANNOTATION_STYLES.signature.color,
      backgroundColor: DEFAULT_ANNOTATION_STYLES.signature.backgroundColor,
      defaultText: signatureText,
      strokeColor: 'transparent',
      padding: 5
    });
    
    // Register callback for when a signature (text) annotation is created
    const handleSignatureAnnotationCreated = (annotation: any) => {
      if (annotation && annotation.type === 'freetext' && onSignatureAdded) {
        onSignatureAdded(annotation.content || '', {
          x: annotation.rect[0],
          y: annotation.rect[1]
        });
        
        // Turn off the annotation mode after adding a signature
        setTimeout(() => {
          annotationManager.setMode(0); // Set to NONE mode
        }, 100);
      }
    };
    
    annotationManager.onAnnotationCreated(handleSignatureAnnotationCreated);
    
    // Don't clean up the callback here, it will be cleaned up when the component unmounts
  };
  
  // Handle signature modal close (cancel)
  const handleSignatureModalClose = () => {
    setIsSignatureModalOpen(false);
    // Turn off the annotation mode
    annotationManager.setMode(0); // Set to NONE mode
  };
  
  return (
    <>
      {isSignatureModalOpen && (
        <SignatureModal
          isOpen={isSignatureModalOpen}
          onClose={handleSignatureModalClose}
          onSave={handleSignatureSave}
        />
      )}
    </>
  );
};

export default NativeSignatureAnnotator;