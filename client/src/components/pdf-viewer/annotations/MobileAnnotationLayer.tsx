import React, { useState, useRef, useEffect } from 'react';
import { BRAND_COLORS, SIGNATURE_FONT } from '@/lib/constants';
import { AnnotationMode } from '../utils/annotationConfig';
import { useIsMobile } from '@/hooks/use-mobile';

interface MobileAnnotationLayerProps {
  /**
   * Active annotation mode
   */
  annotationMode: AnnotationMode;
  
  /**
   * Canvas width (should match PDF canvas)
   */
  width: number;
  
  /**
   * Canvas height (should match PDF canvas)
   */
  height: number;
  
  /**
   * Callback when an annotation is added
   */
  onAnnotationAdded?: () => void;
}

/**
 * MobileAnnotationLayer Component
 * 
 * Provides a mobile-friendly overlay for adding annotations to PDFs
 * using direct canvas manipulation for better touch support.
 */
const MobileAnnotationLayer: React.FC<MobileAnnotationLayerProps> = ({
  annotationMode,
  width,
  height,
  onAnnotationAdded
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [annotations, setAnnotations] = useState<Array<{
    type: AnnotationMode;
    x: number;
    y: number;
    text?: string;
    width?: number;
    height?: number;
  }>>([]);
  
  const isMobile = useIsMobile();
  
  // Only show this layer on mobile devices
  if (!isMobile || !annotationMode) {
    return null;
  }
  
  // Handle adding a text annotation
  const handleAddTextAnnotation = (x: number, y: number) => {
    const text = prompt('Enter text for annotation:');
    if (!text) return;
    
    setAnnotations(prev => [...prev, {
      type: 'text',
      x,
      y,
      text
    }]);
    
    if (onAnnotationAdded) {
      onAnnotationAdded();
    }
  };
  
  // Handle adding a signature annotation
  const handleAddSignatureAnnotation = (x: number, y: number) => {
    const signature = prompt('Enter your signature:');
    if (!signature) return;
    
    setAnnotations(prev => [...prev, {
      type: 'signature',
      x,
      y,
      text: signature
    }]);
    
    if (onAnnotationAdded) {
      onAnnotationAdded();
    }
  };
  
  // Handle adding a highlight annotation
  const handleAddHighlightAnnotation = (x: number, y: number) => {
    setAnnotations(prev => [...prev, {
      type: 'highlight',
      x,
      y,
      width: 100,
      height: 20
    }]);
    
    if (onAnnotationAdded) {
      onAnnotationAdded();
    }
  };
  
  // Handle click/tap on the overlay
  const handleTap = (e: React.MouseEvent | React.TouchEvent) => {
    if (!annotationMode) return;
    
    // Get position relative to the overlay
    const overlay = overlayRef.current;
    if (!overlay) return;
    
    const rect = overlay.getBoundingClientRect();
    
    // Handle both mouse and touch events
    let clientX, clientY;
    
    if ('touches' in e) {
      // Touch event
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      // Mouse event
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    // Call the appropriate handler based on annotation mode
    switch (annotationMode) {
      case 'text':
        handleAddTextAnnotation(x, y);
        break;
      case 'signature':
        handleAddSignatureAnnotation(x, y);
        break;
      case 'highlight':
        handleAddHighlightAnnotation(x, y);
        break;
    }
  };
  
  return (
    <div 
      ref={overlayRef}
      className="absolute top-0 left-0 w-full h-full z-10 touch-none"
      style={{ 
        width: `${width}px`, 
        height: `${height}px`,
        cursor: annotationMode ? 'crosshair' : 'default'
      }}
      onClick={handleTap}
      onTouchStart={handleTap}
    >
      {/* Render all annotations */}
      {annotations.map((annotation, index) => {
        if (annotation.type === 'text') {
          return (
            <div 
              key={index}
              className="absolute bg-orange-100/30 px-2 py-1 rounded"
              style={{ 
                top: annotation.y - 20, 
                left: annotation.x - 5,
                color: BRAND_COLORS.NAVY,
                fontFamily: 'Montserrat, sans-serif',
                fontSize: '14px',
                border: `1px solid ${BRAND_COLORS.ORANGE}`
              }}
            >
              {annotation.text}
            </div>
          );
        }
        
        if (annotation.type === 'signature') {
          return (
            <div 
              key={index}
              className="absolute"
              style={{ 
                top: annotation.y - 20, 
                left: annotation.x,
                color: BRAND_COLORS.NAVY,
                fontFamily: `${SIGNATURE_FONT}, cursive`,
                fontSize: '22px'
              }}
            >
              {annotation.text}
            </div>
          );
        }
        
        if (annotation.type === 'highlight') {
          return (
            <div 
              key={index}
              className="absolute rounded-sm"
              style={{ 
                top: annotation.y - 10, 
                left: annotation.x - 50,
                width: annotation.width,
                height: annotation.height,
                backgroundColor: `${BRAND_COLORS.ORANGE}40` // 25% opacity
              }}
            />
          );
        }
        
        return null;
      })}
    </div>
  );
};

export default MobileAnnotationLayer;