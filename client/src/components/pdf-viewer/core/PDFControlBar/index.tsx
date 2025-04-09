import React from 'react';
import { usePDFContext } from '../../context/PDFContext';
import { useMobileContext } from '../../context/MobileContext';
import { BRAND_COLORS, CONTROL_BAR } from '../../utils/constants';
import NavigationControls from './NavigationControls';
import ZoomControls from './ZoomControls';
import DownloadControls from './DownloadControls';

interface PDFControlBarProps {
  onClose: () => void;
  onSave?: () => void;
  className?: string;
}

/**
 * PDFControlBar component
 * 
 * Provides page navigation, zoom controls, and download/close buttons
 * for the PDF viewer.
 */
const PDFControlBar: React.FC<PDFControlBarProps> = ({
  onClose,
  onSave,
  className = ''
}) => {
  // Contexts
  const { file } = usePDFContext();
  const { isMobile } = useMobileContext();
  
  return (
    <div 
      className={`pdf-control-bar flex items-center justify-between px-4 py-2 rounded-t-lg ${className}`}
      style={{ 
        backgroundColor: BRAND_COLORS.NAVY_BLUE,
        height: `${CONTROL_BAR.HEIGHT}px`,
        color: BRAND_COLORS.WHITE
      }}
    >
      {/* Left Controls - Page Navigation */}
      <div className="flex items-center">
        <NavigationControls />
      </div>
      
      {/* Middle Controls - Zoom */}
      {!isMobile && (
        <div className="flex items-center">
          <ZoomControls />
        </div>
      )}
      
      {/* Right Controls - Download, Save, Close */}
      <div className="flex items-center">
        <DownloadControls 
          onSave={onSave}
          onClose={onClose}
        />
      </div>
    </div>
  );
};

export default PDFControlBar;