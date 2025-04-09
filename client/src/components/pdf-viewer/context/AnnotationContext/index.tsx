import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { usePDFContext } from '../PDFContext';
import { fabric } from 'fabric';

// Annotation types
export type AnnotationType = 'text' | 'signature' | 'checkbox';

interface TextAnnotation {
  type: 'text';
  text: string;
  font: string;
  fontSize: number;
  position: { x: number; y: number };
  page: number;
  fabricObject?: fabric.Textbox;
}

interface SignatureAnnotation {
  type: 'signature';
  text: string;
  position: { x: number; y: number };
  page: number;
  fabricObject?: fabric.Text;
}

interface CheckboxAnnotation {
  type: 'checkbox';
  checked: boolean;
  position: { x: number; y: number };
  page: number;
  fabricObject?: fabric.Group;
}

export type Annotation = TextAnnotation | SignatureAnnotation | CheckboxAnnotation;

// Context interface
interface AnnotationContextState {
  activeAnnotationType: AnnotationType | null;
  annotations: Annotation[];
  canvas: fabric.Canvas | null;
  signatureModalOpen: boolean;
  signatureText: string;
}

interface AnnotationContextActions {
  setActiveAnnotationType: (type: AnnotationType | null) => void;
  setCanvas: (canvas: fabric.Canvas | null) => void;
  addAnnotation: (annotation: Omit<Annotation, 'fabricObject'>) => void;
  updateAnnotation: (index: number, partialAnnotation: Partial<Annotation>) => void;
  removeAnnotation: (index: number) => void;
  clearAnnotations: () => void;
  openSignatureModal: () => void;
  closeSignatureModal: () => void;
  setSignatureText: (text: string) => void;
}

interface AnnotationContextValue extends AnnotationContextState, AnnotationContextActions {}

// Create the context
const AnnotationContext = createContext<AnnotationContextValue | undefined>(undefined);

// Provider component
interface AnnotationProviderProps {
  children: ReactNode;
}

export const AnnotationProvider: React.FC<AnnotationProviderProps> = ({ children }) => {
  // State
  const [activeAnnotationType, setActiveAnnotationType] = useState<AnnotationType | null>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [signatureModalOpen, setSignatureModalOpen] = useState(false);
  const [signatureText, setSignatureText] = useState('');

  // PDF context for page information
  const { currentPage } = usePDFContext();

  // Actions
  const addAnnotation = useCallback((annotation: Omit<Annotation, 'fabricObject'>) => {
    setAnnotations(prev => [...prev, annotation as Annotation]);
  }, []);

  const updateAnnotation = useCallback((index: number, partialAnnotation: Partial<Annotation>) => {
    setAnnotations(prev => 
      prev.map((annotation, i) => 
        i === index ? { ...annotation, ...partialAnnotation } : annotation
      )
    );
  }, []);

  const removeAnnotation = useCallback((index: number) => {
    setAnnotations(prev => prev.filter((_, i) => i !== index));
  }, []);

  const clearAnnotations = useCallback(() => {
    setAnnotations([]);
  }, []);

  const openSignatureModal = useCallback(() => {
    setSignatureModalOpen(true);
  }, []);

  const closeSignatureModal = useCallback(() => {
    setSignatureModalOpen(false);
  }, []);

  // Value for the context
  const value: AnnotationContextValue = {
    // State
    activeAnnotationType,
    annotations,
    canvas,
    signatureModalOpen,
    signatureText,
    
    // Actions
    setActiveAnnotationType,
    setCanvas,
    addAnnotation,
    updateAnnotation,
    removeAnnotation,
    clearAnnotations,
    openSignatureModal,
    closeSignatureModal,
    setSignatureText
  };

  return (
    <AnnotationContext.Provider value={value}>
      {children}
    </AnnotationContext.Provider>
  );
};

// Custom hook
export const useAnnotationContext = () => {
  const context = useContext(AnnotationContext);
  if (context === undefined) {
    throw new Error('useAnnotationContext must be used within an AnnotationProvider');
  }
  return context;
};

export default AnnotationContext;