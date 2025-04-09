import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { PDFDocumentProxy } from 'pdfjs-dist';

// Type definitions
interface PDFContextState {
  file: File | null;
  pdfDocument: PDFDocumentProxy | null;
  currentPage: number;
  totalPages: number;
  scale: number;
  autoScale: boolean;
  loading: boolean;
  error: Error | null;
}

interface PDFContextActions {
  setFile: (file: File | null) => void;
  setPdfDocument: (doc: PDFDocumentProxy | null) => void;
  goToPage: (pageNumber: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  setScale: (scale: number) => void;
  toggleAutoScale: () => void;
}

interface PDFContextValue extends PDFContextState, PDFContextActions {}

// Create the context with a default value
const PDFContext = createContext<PDFContextValue | undefined>(undefined);

// Provider component
interface PDFProviderProps {
  children: ReactNode;
  initialFile?: File | null;
}

export const PDFProvider: React.FC<PDFProviderProps> = ({ 
  children,
  initialFile = null
}) => {
  // State
  const [file, setFile] = useState<File | null>(initialFile);
  const [pdfDocument, setPdfDocument] = useState<PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [autoScale, setAutoScale] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Update total pages when PDF document changes
  useEffect(() => {
    if (pdfDocument) {
      setTotalPages(pdfDocument.numPages);
    } else {
      setTotalPages(0);
    }
  }, [pdfDocument]);

  // Page navigation functions
  const goToPage = (pageNumber: number) => {
    if (pdfDocument && pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Auto-scale toggle
  const toggleAutoScale = () => {
    setAutoScale(!autoScale);
  };

  // Context value
  const value: PDFContextValue = {
    // State
    file,
    pdfDocument,
    currentPage,
    totalPages,
    scale,
    autoScale,
    loading,
    error,
    
    // Actions
    setFile,
    setPdfDocument,
    goToPage,
    nextPage,
    prevPage,
    setScale,
    toggleAutoScale
  };

  return (
    <PDFContext.Provider value={value}>
      {children}
    </PDFContext.Provider>
  );
};

// Custom hook to use the PDF context
export const usePDFContext = () => {
  const context = useContext(PDFContext);
  if (context === undefined) {
    throw new Error('usePDFContext must be used within a PDFProvider');
  }
  return context;
};

export default PDFContext;