import React from 'react';
import { PDFViewerSelectorProps, isFeatureEnabled } from './utils/featureFlags';
// Import legacy components (will import from existing implementation)
import PDFViewer from '../PDFViewer';
// Import React-PDF based components
import { PDFViewerContainer } from './index';
// Import new iframe-based components
import { PDFJSViewer } from './iframe-viewer';
// Import Direct PDF.js implementation
import { DirectPDFViewer } from './direct-viewer';

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
  forceDirect?: boolean; // Force using DirectPDFViewer implementation
}

/**
 * PDFViewerToggle Component
 * 
 * This component acts as a switch between four implementations:
 * 1. DirectPDFViewer (preferred direct PDF.js implementation)
 * 2. Legacy PDFViewer (original implementation)
 * 3. PDFViewerContainer (React-PDF based implementation)
 * 4. PDFJSViewer (iframe-based PDF.js pre-built viewer)
 * 
 * The DirectPDFViewer is the recommended implementation for its reliability,
 * version compatibility, and performance.
 */
const PDFViewerToggle: React.FC<PDFViewerToggleProps> = ({
  file,
  onClose,
  enableAnnotations = true,
  initialPage = 1,
  onPageChange,
  onSaveWithAnnotations,
  forceNew = false,
  forceIframe = false,
  forceDirect = false
}) => {
  // Check which viewer to use - DirectPDFViewer is now the default
  // unless specific feature flags or force* options override it
  const useDirect = forceDirect || isFeatureEnabled('useDirectPDFViewer');
  const useIframe = !useDirect && (forceIframe || isFeatureEnabled('useIframePDFViewer'));
  const useNew = !useDirect && !useIframe && (forceNew || isFeatureEnabled('useNewPDFViewer'));

  // Render the direct PDF.js viewer (preferred implementation)
  const renderDirect = () => (
    <DirectPDFViewer
      file={file}
      onClose={onClose}
      initialPage={initialPage}
      onPageChange={onPageChange}
      className="h-full w-full"
    />
  );

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
  if (useDirect) {
    return renderDirect();
  } else if (useIframe) {
    return renderIframe();
  } else if (useNew) {
    return renderNew();
  } else {
    return renderLegacy();
  }
};

export default PDFViewerToggle;