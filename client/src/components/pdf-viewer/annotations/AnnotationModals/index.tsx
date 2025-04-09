import React, { useState } from 'react';
import { useAnnotationContext } from '../../context/AnnotationContext';
import { usePDFContext } from '../../context/PDFContext';
import { ANNOTATION, BRAND_COLORS, FONTS } from '../../utils/constants';

/**
 * AnnotationModals component
 * 
 * This component manages modals for annotation inputs, including:
 * - Signature input
 * - Text annotation properties
 */
const AnnotationModals: React.FC = () => {
  // Contexts
  const { 
    signatureModalOpen, 
    closeSignatureModal, 
    setSignatureText, 
    signatureText,
    addAnnotation,
    activeAnnotationType
  } = useAnnotationContext();
  
  const { currentPage } = usePDFContext();
  
  // Local state for text annotation modal
  const [textModalOpen, setTextModalOpen] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [fontSize, setFontSize] = useState(ANNOTATION.DEFAULT_FONT_SIZE);
  
  // Handle signature save
  const handleSignatureSave = () => {
    if (!signatureText) return;
    
    // Add signature annotation (in a real implementation would add to the canvas)
    addAnnotation({
      type: 'signature',
      text: signatureText,
      position: { x: 100, y: 100 }, // Default position, would be adjusted based on click
      page: currentPage
    });
    
    // Close the modal and reset
    closeSignatureModal();
  };
  
  // Handle text save
  const handleTextSave = () => {
    if (!textInput) return;
    
    // Add text annotation
    addAnnotation({
      type: 'text',
      text: textInput,
      font: ANNOTATION.DEFAULT_FONT,
      fontSize: fontSize,
      position: { x: 100, y: 100 }, // Default position, would be adjusted based on click
      page: currentPage
    });
    
    // Close the modal and reset
    setTextModalOpen(false);
    setTextInput('');
  };
  
  // Render the signature modal
  const renderSignatureModal = () => {
    if (!signatureModalOpen) return null;
    
    return (
      <div className="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div 
          className="modal-content p-6 rounded-lg shadow-lg max-w-md w-full"
          style={{ backgroundColor: BRAND_COLORS.NAVY_BLUE }}
        >
          <h3 className="text-xl font-bold mb-4" style={{ color: BRAND_COLORS.WHITE }}>
            Add Signature
          </h3>
          
          <div className="mb-4">
            <input
              type="text"
              value={signatureText}
              onChange={(e) => setSignatureText(e.target.value)}
              placeholder="Type your signature"
              className="w-full p-3 rounded bg-gray-800 border-none"
              style={{ 
                color: BRAND_COLORS.WHITE,
                fontFamily: FONTS.SIGNATURE,
                fontSize: '24px'
              }}
            />
          </div>
          
          {signatureText && (
            <div 
              className="preview-box p-4 rounded mb-4 text-center"
              style={{ 
                backgroundColor: BRAND_COLORS.NAVY_BLUE_LIGHT,
                fontFamily: FONTS.SIGNATURE,
                fontSize: '32px',
                color: BRAND_COLORS.WHITE
              }}
            >
              {signatureText}
            </div>
          )}
          
          <div className="flex justify-end space-x-2">
            <button
              onClick={closeSignatureModal}
              className="px-4 py-2 rounded"
              style={{ 
                backgroundColor: BRAND_COLORS.GRAY_700,
                color: BRAND_COLORS.WHITE
              }}
            >
              Cancel
            </button>
            
            <button
              onClick={handleSignatureSave}
              disabled={!signatureText}
              className="px-4 py-2 rounded"
              style={{ 
                backgroundColor: signatureText ? BRAND_COLORS.ORANGE : BRAND_COLORS.GRAY_600,
                color: BRAND_COLORS.WHITE,
                opacity: signatureText ? 1 : 0.6
              }}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  // Render the text annotation modal
  const renderTextModal = () => {
    if (!textModalOpen) return null;
    
    return (
      <div className="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div 
          className="modal-content p-6 rounded-lg shadow-lg max-w-md w-full"
          style={{ backgroundColor: BRAND_COLORS.NAVY_BLUE }}
        >
          <h3 className="text-xl font-bold mb-4" style={{ color: BRAND_COLORS.WHITE }}>
            Add Text
          </h3>
          
          <div className="mb-4">
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Enter text"
              className="w-full p-3 rounded bg-gray-800 border-none resize-none"
              style={{ 
                color: BRAND_COLORS.WHITE,
                fontFamily: FONTS.PRIMARY,
                height: '100px'
              }}
            ></textarea>
          </div>
          
          <div className="mb-4">
            <label 
              className="block mb-2 text-sm font-medium"
              style={{ color: BRAND_COLORS.WHITE }}
            >
              Font Size
            </label>
            
            <select
              value={fontSize}
              onChange={(e) => setFontSize(parseInt(e.target.value))}
              className="w-full p-2 rounded bg-gray-800 border-none"
              style={{ color: BRAND_COLORS.WHITE }}
            >
              {ANNOTATION.FONT_SIZES.map(size => (
                <option key={size} value={size}>{size}px</option>
              ))}
            </select>
          </div>
          
          {textInput && (
            <div 
              className="preview-box p-4 rounded mb-4"
              style={{ 
                backgroundColor: BRAND_COLORS.NAVY_BLUE_LIGHT,
                fontFamily: FONTS.PRIMARY,
                fontSize: `${fontSize}px`,
                color: BRAND_COLORS.WHITE
              }}
            >
              {textInput}
            </div>
          )}
          
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setTextModalOpen(false)}
              className="px-4 py-2 rounded"
              style={{ 
                backgroundColor: BRAND_COLORS.GRAY_700,
                color: BRAND_COLORS.WHITE
              }}
            >
              Cancel
            </button>
            
            <button
              onClick={handleTextSave}
              disabled={!textInput}
              className="px-4 py-2 rounded"
              style={{ 
                backgroundColor: textInput ? BRAND_COLORS.ORANGE : BRAND_COLORS.GRAY_600,
                color: BRAND_COLORS.WHITE,
                opacity: textInput ? 1 : 0.6
              }}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  // Handle opening modals based on active annotation type
  React.useEffect(() => {
    if (activeAnnotationType === 'text') {
      setTextModalOpen(true);
    } else {
      setTextModalOpen(false);
    }
  }, [activeAnnotationType]);
  
  return (
    <>
      {renderSignatureModal()}
      {renderTextModal()}
    </>
  );
};

export default AnnotationModals;