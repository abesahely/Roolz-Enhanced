import React from 'react';
import { usePDFContext } from '../../../context/PDFContext';
import { BRAND_COLORS, PDF_VIEWER } from '../../../utils/constants';

interface ZoomControlsProps {
  className?: string;
}

/**
 * ZoomControls component
 * 
 * Provides controls for zooming in and out of the PDF
 */
const ZoomControls: React.FC<ZoomControlsProps> = ({
  className = ''
}) => {
  // Get context values
  const { 
    scale, 
    setScale, 
    autoScale, 
    toggleAutoScale 
  } = usePDFContext();
  
  // Zoom in function
  const zoomIn = () => {
    const newScale = Math.min(PDF_VIEWER.ZOOM_MAX, scale + PDF_VIEWER.ZOOM_STEP);
    setScale(newScale);
  };
  
  // Zoom out function
  const zoomOut = () => {
    const newScale = Math.max(PDF_VIEWER.ZOOM_MIN, scale - PDF_VIEWER.ZOOM_STEP);
    setScale(newScale);
  };
  
  // Reset zoom function
  const resetZoom = () => {
    setScale(PDF_VIEWER.DEFAULT_SCALE);
  };
  
  // Button style
  const buttonStyle = {
    backgroundColor: 'transparent',
    color: BRAND_COLORS.WHITE,
    border: 'none',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '4px',
    transition: 'background-color 0.2s'
  };
  
  return (
    <div className={`zoom-controls flex items-center ${className}`}>
      {/* Zoom Out Button */}
      <button
        onClick={zoomOut}
        disabled={scale <= PDF_VIEWER.ZOOM_MIN}
        className="hover:bg-gray-700"
        style={buttonStyle}
        title="Zoom Out"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          <line x1="8" y1="11" x2="14" y2="11"></line>
        </svg>
      </button>
      
      {/* Current Zoom Level Display/Reset */}
      <button
        onClick={resetZoom}
        className="mx-1 px-2 text-sm rounded hover:bg-gray-700"
        style={buttonStyle}
        title="Reset Zoom"
      >
        {`${Math.round(scale * 100)}%`}
      </button>
      
      {/* Zoom In Button */}
      <button
        onClick={zoomIn}
        disabled={scale >= PDF_VIEWER.ZOOM_MAX}
        className="hover:bg-gray-700"
        style={buttonStyle}
        title="Zoom In"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          <line x1="11" y1="8" x2="11" y2="14"></line>
          <line x1="8" y1="11" x2="14" y2="11"></line>
        </svg>
      </button>
      
      {/* Auto-fit Toggle */}
      <button
        onClick={toggleAutoScale}
        className={`ml-2 px-2 text-xs rounded ${autoScale ? 'bg-orange-500' : 'hover:bg-gray-700'}`}
        style={{
          ...buttonStyle,
          backgroundColor: autoScale ? BRAND_COLORS.ORANGE : 'transparent',
        }}
        title={autoScale ? "Disable Auto-fit" : "Enable Auto-fit"}
      >
        <span>Auto</span>
      </button>
    </div>
  );
};

export default ZoomControls;