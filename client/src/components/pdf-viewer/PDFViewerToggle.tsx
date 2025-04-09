import React from 'react';
import { PDFViewerSelectorProps, isFeatureEnabled } from './utils/featureFlags';
// Import legacy components (will import from existing implementation)
import PDFViewer from '../PDFViewer';
// Import new components (from our new implementation)
import { PDFViewerContainer } from './index';

interface PDFViewerToggleProps {
  // Original PDFViewer props
  file: File | null;
  onClose: () => void;
  enableAnnotations?: boolean;
  initialPage?: number;
  onPageChange?: (pageNumber: number) => void;
  onSaveWithAnnotations?: () => void;
  // Toggle option
  forceNew?: boolean;
}

/**
 * PDFViewerToggle Component
 * 
 * This component acts as a switch between the legacy PDFViewer and
 * the new PDFViewerContainer based on feature flags.
 */
const PDFViewerToggle: React.FC<PDFViewerToggleProps> = ({
  file,
  onClose,
  enableAnnotations = true,
  initialPage = 1,
  onPageChange,
  onSaveWithAnnotations,
  forceNew = false
}) => {
  // Check if we should use the new PDF viewer
  const useNew = forceNew || isFeatureEnabled('useNewPDFViewer');

  // Render the legacy PDF viewer
  const renderLegacy = () => (
    <PDFViewer
      file={file}
      onClose={onClose}
      onCanvasReady={undefined} // Legacy prop
      onSaveWithAnnotations={onSaveWithAnnotations}
      initialPage={initialPage}
      onPageChange={onPageChange}
    />
  );

  // Render the new PDF viewer
  const renderNew = () => (
    <PDFViewerContainer
      file={file}
      onClose={onClose}
      enableAnnotations={enableAnnotations}
      initialPage={initialPage}
      onPageChange={onPageChange}
      onSaveWithAnnotations={onSaveWithAnnotations}
    />
  );

  // Return the appropriate implementation
  return useNew ? renderNew() : renderLegacy();
};

export default PDFViewerToggle;