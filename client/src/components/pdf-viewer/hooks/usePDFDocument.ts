/**
 * PDF Document Hook
 * 
 * This hook handles loading and managing a PDF document.
 */
import { useState, useEffect } from 'react';
import { getDocument, PDFDocumentProxy } from 'pdfjs-dist';
import { ERROR_MESSAGES } from '../utils/constants';

interface UsePDFDocumentOptions {
  onDocumentLoad?: (document: PDFDocumentProxy) => void;
  onError?: (error: Error) => void;
}

interface UsePDFDocumentReturn {
  document: PDFDocumentProxy | null;
  loading: boolean;
  error: Error | null;
  loadDocument: (file: File) => Promise<void>;
}

/**
 * Custom hook for loading and managing a PDF document
 * 
 * @param options Configuration options
 * @returns Object with document, loading state, error, and load function
 */
export const usePDFDocument = (options?: UsePDFDocumentOptions): UsePDFDocumentReturn => {
  const [document, setDocument] = useState<PDFDocumentProxy | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  // Clean up function to prevent memory leaks
  useEffect(() => {
    return () => {
      if (document) {
        document.destroy().catch(console.error);
      }
    };
  }, [document]);

  /**
   * Load a PDF document from a File object
   */
  const loadDocument = async (file: File): Promise<void> => {
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      // Convert File to ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();

      // Load the PDF document
      const pdf = await getDocument({ data: arrayBuffer }).promise;
      
      setDocument(pdf);
      
      // Call the onDocumentLoad callback if provided
      if (options?.onDocumentLoad) {
        options.onDocumentLoad(pdf);
      }
    } catch (err) {
      console.error('Error loading PDF document:', err);
      const error = err instanceof Error ? err : new Error(ERROR_MESSAGES.FILE_LOAD_ERROR);
      setError(error);
      
      // Call the onError callback if provided
      if (options?.onError) {
        options.onError(error);
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    document,
    loading,
    error,
    loadDocument
  };
};

export default usePDFDocument;