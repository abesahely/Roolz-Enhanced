import React from 'react';
import { usePDFContext } from '../../../context/PDFContext';
import { useAnnotationContext } from '../../../context/AnnotationContext';
import { BRAND_COLORS } from '../../../utils/constants';

interface DownloadControlsProps {
  onClose: () => void;
  onSave?: () => void;
  className?: string;
}

/**
 * DownloadControls component
 * 
 * Provides controls for downloading, saving, and closing the PDF
 */
const DownloadControls: React.FC<DownloadControlsProps> = ({
  onClose,
  onSave,
  className = ''
}) => {
  // Get context values
  const { file, pdfDocument } = usePDFContext();
  const { annotations } = useAnnotationContext();
  
  // Button style base
  const buttonStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    color: BRAND_COLORS.WHITE,
    border: 'none',
    cursor: 'pointer',
    padding: '6px 10px',
    borderRadius: '4px',
    transition: 'background-color 0.2s',
    fontWeight: 500
  };
  
  // Primary button style
  const primaryButtonStyle = {
    ...buttonStyle,
    backgroundColor: BRAND_COLORS.ORANGE
  };
  
  // Function to download original PDF
  const downloadOriginalPDF = () => {
    if (!file) return;
    
    // Create a download link
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);
  };
  
  // Has annotations
  const hasAnnotations = annotations.length > 0;
  
  return (
    <div className={`download-controls flex items-center ${className}`}>
      {/* Download Original Button */}
      {file && (
        <button
          onClick={downloadOriginalPDF}
          className="mr-2 hover:bg-gray-700"
          style={buttonStyle}
          title="Download Original PDF"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          <span className="text-sm">Original</span>
        </button>
      )}
      
      {/* Save with Annotations Button */}
      {onSave && hasAnnotations && (
        <button
          onClick={onSave}
          className="mr-2"
          style={primaryButtonStyle}
          title="Save with Annotations"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
            <polyline points="17 21 17 13 7 13 7 21"></polyline>
            <polyline points="7 3 7 8 15 8"></polyline>
          </svg>
          <span className="text-sm">Save</span>
        </button>
      )}
      
      {/* Close Button */}
      <button
        onClick={onClose}
        className="hover:bg-gray-700"
        style={buttonStyle}
        title="Close Viewer"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
  );
};

export default DownloadControls;