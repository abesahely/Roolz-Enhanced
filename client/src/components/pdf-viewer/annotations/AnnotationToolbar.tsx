import React from 'react';
import { BRAND_COLORS } from '@/lib/constants';

interface AnnotationToolbarProps {
  /**
   * Current annotation mode
   */
  currentMode: string | null;
  
  /**
   * Function to handle mode changes
   */
  onModeChange: (mode: string | null) => void;
  
  /**
   * Function to handle saving annotations
   */
  onSave: () => void;
  
  /**
   * Whether annotations have been modified
   */
  hasModifications: boolean;
  
  /**
   * Whether annotation toolbar is visible
   */
  isVisible?: boolean;
}

/**
 * Annotation Toolbar Component
 * 
 * Provides buttons for selecting different annotation types
 * and saving annotations.
 */
const AnnotationToolbar: React.FC<AnnotationToolbarProps> = ({
  currentMode,
  onModeChange,
  onSave,
  hasModifications,
  isVisible = true
}) => {
  if (!isVisible) return null;

  // Utility function to determine button background color
  const getButtonStyle = (mode: string) => {
    return currentMode === mode 
      ? { backgroundColor: BRAND_COLORS.ORANGE } 
      : { backgroundColor: 'transparent' };
  };

  return (
    <div 
      className="annotation-toolbar flex flex-wrap items-center justify-between p-2 border-t border-white/10"
      style={{ backgroundColor: BRAND_COLORS.NAVY }}
    >
      <div className="flex flex-wrap items-center space-x-1">
        {/* Text annotation button */}
        <button 
          className="px-3 py-1 rounded text-white hover:bg-white/10 flex items-center"
          onClick={() => onModeChange(currentMode === 'text' ? null : 'text')}
          style={getButtonStyle('text')}
          title="Add text annotation"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          <span className="hidden sm:inline">Text</span>
        </button>

        {/* Highlight annotation button */}
        <button 
          className="px-3 py-1 rounded text-white hover:bg-white/10 flex items-center"
          onClick={() => onModeChange(currentMode === 'highlight' ? null : 'highlight')}
          style={getButtonStyle('highlight')}
          title="Highlight text"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="hidden sm:inline">Highlight</span>
        </button>

        {/* Signature annotation button */}
        <button 
          className="px-3 py-1 rounded text-white hover:bg-white/10 flex items-center"
          onClick={() => onModeChange(currentMode === 'signature' ? null : 'signature')}
          style={getButtonStyle('signature')}
          title="Add signature"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          <span className="hidden sm:inline">Signature</span>
        </button>
      </div>

      {/* Save button - only show when modifications exist */}
      {hasModifications && (
        <button
          className="px-3 py-1 rounded text-white flex items-center ml-auto"
          onClick={onSave}
          style={{ backgroundColor: BRAND_COLORS.ORANGE }}
          title="Save annotations"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
          </svg>
          <span className="hidden sm:inline">Save</span>
        </button>
      )}
    </div>
  );
};

export default AnnotationToolbar;