import React from 'react';
import { PDFViewerSelectorProps, isFeatureEnabled } from './utils/featureFlags';
// Import legacy components (will import from existing implementation)
import PDFViewer from '../PDFViewer';
// Import React-PDF based components
import { PDFViewerContainer } from './index';
// Import new iframe-based components
import { PDFJSViewer } from './iframe-viewer';

interface PDFViewerToggleProps {
  // Original PDFViewer props
  file: File | null;
  onClose: () => void;
  enableAnnotations?: boolean;
  initialPage?: number;
  onPageChange?: (pageNumber: number) => void;
  onSaveWithAnnotations?: () => void;
  // Toggle options
  forceNew?: boolean;
  forceIframe?: boolean;
}

/**
 * PDFViewerToggle Component
 * 
 * This component acts as a switch between three implementations:
 * 1. Legacy PDFViewer (original implementation)
 * 2. PDFViewerContainer (React-PDF based implementation)
 * 3. PDFJSViewer (iframe-based PDF.js pre-built viewer)
 */
const PDFViewerToggle: React.FC<PDFViewerToggleProps> = ({
  file,
  onClose,
  enableAnnotations = true,
  initialPage = 1,
  onPageChange,
  onSaveWithAnnotations,
  forceNew = false,
  forceIframe = false
}) => {
  // Check which viewer to use
  const useIframe = forceIframe || isFeatureEnabled('useIframePDFViewer');
  const useNew = !useIframe && (forceNew || isFeatureEnabled('useNewPDFViewer'));

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

  // Render the React-PDF based viewer
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
  
  // Render the iframe-based PDF.js pre-built viewer
  const renderIframe = () => (
    <PDFJSViewer
      file={file}
      onClose={onClose}
      initialPage={initialPage}
      onPageChange={onPageChange}
      className="h-full w-full"
    />
  );

  // Return the appropriate implementation
  if (useIframe) {
    return renderIframe();
  } else if (useNew) {
    return renderNew();
  } else {
    return renderLegacy();
  }
};

export default PDFViewerToggle;