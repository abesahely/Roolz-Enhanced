import React from 'react';
import { useAnnotationContext } from '../../context/AnnotationContext';
import { useMobileContext } from '../../context/MobileContext';
import { BRAND_COLORS } from '../../utils/constants';
import TextTool from './TextTool';
import SignatureTool from './SignatureTool';
import CheckboxTool from './CheckboxTool';

interface AnnotationToolbarProps {
  className?: string;
}

/**
 * AnnotationToolbar component
 * 
 * Provides a toolbar with buttons for different annotation tools
 */
const AnnotationToolbar: React.FC<AnnotationToolbarProps> = ({
  className = ''
}) => {
  // Contexts
  const { activeAnnotationType, setActiveAnnotationType } = useAnnotationContext();
  const { isMobile } = useMobileContext();
  
  // Toggle the active annotation tool
  const toggleTool = (type: 'text' | 'signature' | 'checkbox') => {
    if (activeAnnotationType === type) {
      setActiveAnnotationType(null);
    } else {
      setActiveAnnotationType(type);
    }
  };
  
  // Style for the active tool
  const getToolStyle = (type: 'text' | 'signature' | 'checkbox') => {
    return activeAnnotationType === type
      ? { backgroundColor: BRAND_COLORS.ORANGE, color: BRAND_COLORS.WHITE }
      : { backgroundColor: BRAND_COLORS.GRAY_800, color: BRAND_COLORS.WHITE };
  };
  
  return (
    <div 
      className={`annotation-toolbar flex items-center justify-center p-2 rounded-full shadow-lg ${className}`}
      style={{ backgroundColor: BRAND_COLORS.NAVY_BLUE }}
    >
      {/* Text Tool */}
      <button
        className="tool-button flex items-center justify-center w-10 h-10 mx-1 rounded-full transition-colors"
        style={getToolStyle('text')}
        onClick={() => toggleTool('text')}
        title="Add Text"
      >
        <TextTool />
      </button>
      
      {/* Signature Tool */}
      <button
        className="tool-button flex items-center justify-center w-10 h-10 mx-1 rounded-full transition-colors"
        style={getToolStyle('signature')}
        onClick={() => toggleTool('signature')}
        title="Add Signature"
      >
        <SignatureTool />
      </button>
      
      {/* Checkbox Tool */}
      <button
        className="tool-button flex items-center justify-center w-10 h-10 mx-1 rounded-full transition-colors"
        style={getToolStyle('checkbox')}
        onClick={() => toggleTool('checkbox')}
        title="Add Checkbox"
      >
        <CheckboxTool />
      </button>
    </div>
  );
};

export default AnnotationToolbar;