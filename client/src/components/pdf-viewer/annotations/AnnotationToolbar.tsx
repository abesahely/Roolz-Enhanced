/**
 * Annotation Toolbar Component
 *
 * This component provides a user interface for controlling PDF annotations,
 * with tools for text boxes, highlighting, drawing, and more.
 */
import React from 'react';
import { BRAND_COLORS } from '@/lib/constants';
import { AnnotationMode, AnnotationModes } from '../utils/annotationConfig';

// Icons
import { 
  TextCursor, 
  Highlighter, 
  PenLine, 
  PenTool, 
  CheckSquare, 
  X,
  Save
} from 'lucide-react';

interface AnnotationToolbarProps {
  /**
   * Current annotation mode
   */
  currentMode: AnnotationMode;
  
  /**
   * Callback when an annotation mode is toggled
   * This can be called onModeToggle or onModeChange to support different naming conventions
   */
  onModeToggle?: (mode: AnnotationMode) => void;
  onModeChange?: (mode: AnnotationMode) => void;
  
  /**
   * Callback to save annotations
   */
  onSave?: () => void;
  
  /**
   * Whether annotations have been modified (enables save button)
   * Both naming conventions (annotationsModified or hasModifications) are supported
   */
  annotationsModified?: boolean;
  hasModifications?: boolean;
  
  /**
   * Whether the toolbar is visible
   */
  isVisible?: boolean;
  
  /**
   * Callback to close the toolbar
   */
  onClose?: () => void;
  
  /**
   * Additional class name for styling
   */
  className?: string;
}

/**
 * AnnotationToolbar component
 * Provides UI controls for PDF annotation
 */
const AnnotationToolbar: React.FC<AnnotationToolbarProps> = ({
  currentMode,
  onModeToggle,
  onModeChange,
  onSave,
  annotationsModified = false,
  hasModifications = false,
  isVisible = true,
  onClose,
  className = ''
}) => {
  // Handle different naming conventions for the same function
  const handleModeToggle = (mode: AnnotationMode) => {
    // Use onModeToggle if provided, otherwise fall back to onModeChange
    if (onModeToggle) {
      onModeToggle(mode);
    } else if (onModeChange) {
      onModeChange(mode);
    } else {
      console.warn('No mode toggle handler provided to AnnotationToolbar');
    }
  };
  
  // Use either annotationsModified or hasModifications
  const isModified = annotationsModified || hasModifications;
  // Determine if a button is active
  const isActive = (mode: AnnotationMode) => currentMode === mode;
  
  // Active button style with beNext.io branding
  const activeButtonStyle = {
    backgroundColor: BRAND_COLORS.ORANGE,
    color: '#FFFFFF'
  };
  
  // Base button style
  const buttonStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '6px',
    padding: '8px',
    margin: '4px',
    cursor: 'pointer',
    backgroundColor: '#f5f5f5',
    transition: 'all 0.2s ease',
    border: 'none',
    outline: 'none',
    width: '40px',
    height: '40px'
  };

  // Apply conditional visibility
  if (!isVisible) {
    return null;
  }

  return (
    <div className={`bg-white p-2 rounded-lg shadow-md ${className}`}
         style={{
           display: 'flex',
           flexDirection: 'row',
           alignItems: 'center',
           gap: '0.5rem',
           border: `1px solid ${BRAND_COLORS.ORANGE}33`
         }}>
      {/* Text Box Tool */}
      <button
        style={{
          ...buttonStyle,
          ...(isActive(AnnotationModes.TEXT) ? activeButtonStyle : {})
        }}
        onClick={() => handleModeToggle(AnnotationModes.TEXT)}
        title="Add Text Box"
      >
        <TextCursor size={20} />
      </button>
      
      {/* Highlight Tool */}
      <button
        style={{
          ...buttonStyle,
          ...(isActive(AnnotationModes.HIGHLIGHT) ? activeButtonStyle : {})
        }}
        onClick={() => handleModeToggle(AnnotationModes.HIGHLIGHT)}
        title="Highlight Text"
      >
        <Highlighter size={20} />
      </button>
      
      {/* Drawing Tool */}
      <button
        style={{
          ...buttonStyle,
          ...(isActive(AnnotationModes.DRAWING) ? activeButtonStyle : {})
        }}
        onClick={() => handleModeToggle(AnnotationModes.DRAWING)}
        title="Draw on PDF"
      >
        <PenLine size={20} />
      </button>
      
      {/* Signature Tool */}
      <button
        style={{
          ...buttonStyle,
          ...(isActive(AnnotationModes.SIGNATURE) ? activeButtonStyle : {})
        }}
        onClick={() => handleModeToggle(AnnotationModes.SIGNATURE)}
        title="Add Signature"
      >
        <PenTool size={20} />
      </button>
      
      {/* Checkbox Tool */}
      <button
        style={{
          ...buttonStyle,
          ...(isActive(AnnotationModes.CHECKBOX) ? activeButtonStyle : {})
        }}
        onClick={() => handleModeToggle(AnnotationModes.CHECKBOX)}
        title="Add Checkbox"
      >
        <CheckSquare size={20} />
      </button>
      
      {/* Divider */}
      <div style={{ height: '30px', width: '1px', backgroundColor: '#e0e0e0', margin: '0 8px' }} />
      
      {/* Save Button */}
      {onSave && (
        <button
          style={{
            ...buttonStyle,
            opacity: annotationsModified ? 1 : 0.5,
            cursor: annotationsModified ? 'pointer' : 'not-allowed'
          }}
          onClick={annotationsModified ? onSave : undefined}
          disabled={!annotationsModified}
          title={annotationsModified ? "Save Annotations" : "No changes to save"}
        >
          <Save size={20} color={BRAND_COLORS.ORANGE} />
        </button>
      )}
      
      {/* Close Button */}
      {onClose && (
        <button
          style={{
            ...buttonStyle,
            marginLeft: 'auto'
          }}
          onClick={onClose}
          title="Close Annotation Tools"
        >
          <X size={20} />
        </button>
      )}
    </div>
  );
};

export default AnnotationToolbar;