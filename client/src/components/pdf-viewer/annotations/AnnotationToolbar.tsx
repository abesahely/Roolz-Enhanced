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
   */
  onModeToggle: (mode: AnnotationMode) => void;
  
  /**
   * Callback to save annotations
   */
  onSave?: () => void;
  
  /**
   * Whether annotations have been modified (enables save button)
   */
  annotationsModified?: boolean;
  
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
  onSave,
  annotationsModified = false,
  onClose,
  className = ''
}) => {
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
        onClick={() => onModeToggle(AnnotationModes.TEXT)}
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
        onClick={() => onModeToggle(AnnotationModes.HIGHLIGHT)}
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
        onClick={() => onModeToggle(AnnotationModes.DRAWING)}
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
        onClick={() => onModeToggle(AnnotationModes.SIGNATURE)}
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
        onClick={() => onModeToggle(AnnotationModes.CHECKBOX)}
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