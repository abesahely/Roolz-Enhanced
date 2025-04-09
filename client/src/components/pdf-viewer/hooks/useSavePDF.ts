/**
 * Save PDF Hook
 * 
 * This hook handles saving a PDF with annotations.
 */
import { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import { Annotation } from '../context/AnnotationContext';
import { getFilenameWithoutExtension } from '../utils/pdfHelpers';
import { ERROR_MESSAGES } from '../utils/constants';

interface UseSavePDFOptions {
  onSaveStart?: () => void;
  onSaveComplete?: (savedFile: File) => void;
  onSaveError?: (error: Error) => void;
}

interface UseSavePDFReturn {
  saving: boolean;
  error: Error | null;
  savePDF: (file: File, annotations: Annotation[]) => Promise<void>;
  embedAnnotationsInPDF: (file: File, annotations: Annotation[]) => Promise<File>;
}

/**
 * Custom hook for saving PDFs with annotations
 * 
 * @param options Configuration options
 * @returns Object with saving state, error, and save functions
 */
export const useSavePDF = (options?: UseSavePDFOptions): UseSavePDFReturn => {
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Embed annotations into a PDF and save it
   * 
   * @param file Original PDF file
   * @param annotations Annotation objects to embed
   * @returns Promise that resolves when save is complete
   */
  const savePDF = async (file: File, annotations: Annotation[]): Promise<void> => {
    if (!file) return;

    setSaving(true);
    setError(null);

    try {
      // Start save process callback
      if (options?.onSaveStart) {
        options.onSaveStart();
      }

      // Embed annotations and get the new file
      const annotatedFile = await embedAnnotationsInPDF(file, annotations);

      // Create a download link
      const url = URL.createObjectURL(annotatedFile);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${getFilenameWithoutExtension(file.name)}_annotated.pdf`;
      document.body.appendChild(a);
      a.click();

      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 0);

      // Completion callback
      if (options?.onSaveComplete) {
        options.onSaveComplete(annotatedFile);
      }
    } catch (err) {
      console.error('Error saving PDF with annotations:', err);
      const saveError = err instanceof Error ? err : new Error(ERROR_MESSAGES.SAVE_ERROR);
      setError(saveError);

      // Error callback
      if (options?.onSaveError) {
        options.onSaveError(saveError);
      }
    } finally {
      setSaving(false);
    }
  };

  /**
   * Embed annotations into a PDF document
   * 
   * @param file Original PDF file
   * @param annotations Annotation objects to embed
   * @returns Promise resolving to the new File with embedded annotations
   */
  const embedAnnotationsInPDF = async (file: File, annotations: Annotation[]): Promise<File> => {
    // Read the file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Load the PDF document
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    
    // In a real implementation, this function would use pdf-lib to:
    // 1. Draw text annotations
    // 2. Draw signature annotations
    // 3. Draw checkbox annotations
    // 4. Save the document

    // Convert from fabric.js objects to pdf-lib elements
    // This would involve looping through pages and annotations
    // and drawing them on the appropriate page
    
    // For this skeleton, we'll just add a simple example of embedding text
    // (In the real implementation, this would be replaced with actual annotation embedding)
    
    // // Get the first page
    // const page = pdfDoc.getPages()[0];
    
    // // Add invisible text to simulate annotations
    // page.drawText('Annotation added by useSavePDF', {
    //   x: 10,
    //   y: 10,
    //   color: { r: 0, g: 0, b: 0, opacity: 0.0001 } // Nearly invisible
    // });
    
    // Save the PDF
    const pdfBytes = await pdfDoc.save();
    
    // Convert to Blob then File
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    return new File([blob], `${getFilenameWithoutExtension(file.name)}_annotated.pdf`, {
      type: 'application/pdf',
      lastModified: new Date().getTime()
    });
  };

  return {
    saving,
    error,
    savePDF,
    embedAnnotationsInPDF
  };
};

export default useSavePDF;