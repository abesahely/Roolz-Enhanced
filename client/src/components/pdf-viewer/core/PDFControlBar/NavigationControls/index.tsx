import React from 'react';
import { usePDFContext } from '../../../context/PDFContext';
import { BRAND_COLORS } from '../../../utils/constants';

interface NavigationControlsProps {
  className?: string;
}

/**
 * NavigationControls component
 * 
 * Provides controls for navigating between PDF pages
 */
const NavigationControls: React.FC<NavigationControlsProps> = ({
  className = ''
}) => {
  // Get context values
  const { 
    currentPage, 
    totalPages, 
    prevPage, 
    nextPage, 
    goToPage 
  } = usePDFContext();
  
  // Handle page input change
  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const page = parseInt(e.target.value);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      goToPage(page);
    }
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
  
  // Disabled button style
  const disabledButtonStyle = {
    ...buttonStyle,
    opacity: 0.5,
    cursor: 'not-allowed'
  };
  
  return (
    <div className={`navigation-controls flex items-center ${className}`}>
      {/* Previous Page Button */}
      <button
        onClick={prevPage}
        disabled={currentPage <= 1}
        className="mr-2 hover:bg-gray-700"
        style={currentPage <= 1 ? disabledButtonStyle : buttonStyle}
        title="Previous Page"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>
      
      {/* Page Input/Display */}
      <div className="page-display flex items-center text-sm">
        <input
          type="text"
          value={currentPage}
          onChange={handlePageInputChange}
          className="w-8 bg-gray-700 text-center rounded-sm mx-1"
          style={{ color: BRAND_COLORS.WHITE }}
        />
        <span className="mx-1">of</span>
        <span>{totalPages}</span>
      </div>
      
      {/* Next Page Button */}
      <button
        onClick={nextPage}
        disabled={currentPage >= totalPages}
        className="ml-2 hover:bg-gray-700"
        style={currentPage >= totalPages ? disabledButtonStyle : buttonStyle}
        title="Next Page"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </button>
    </div>
  );
};

export default NavigationControls;