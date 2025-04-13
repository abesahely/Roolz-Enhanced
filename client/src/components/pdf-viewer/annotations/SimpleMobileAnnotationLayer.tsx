import React, { useRef, useEffect } from 'react';
import { BRAND_COLORS } from '@/lib/constants';
import { AnnotationMode } from '../utils/annotationConfig';

interface SimpleMobileAnnotationLayerProps {
  /**
   * Active annotation mode
   */
  annotationMode: AnnotationMode;
  
  /**
   * Whether layer is visible
   */
  isVisible: boolean;
  
  /**
   * Canvas width (should match PDF canvas)
   */
  width: number;
  
  /**
   * Canvas height (should match PDF canvas)
   */
  height: number;
  
  /**
   * Callback when annotation is added
   */
  onAnnotationAdded?: () => void;
}

/**
 * A simplified annotation layer for mobile devices
 * 
 * This component creates a transparent overlay on top of the PDF canvas
 * that captures touch/mouse events and adds annotation elements directly.
 */
const SimpleMobileAnnotationLayer: React.FC<SimpleMobileAnnotationLayerProps> = ({
  annotationMode,
  isVisible,
  width,
  height,
  onAnnotationAdded
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  
  // Initialize canvas on mount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Set dimensions
    canvas.width = width;
    canvas.height = height;
    
    // Get and store the context
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Make it transparent by default
    ctx.globalAlpha = 0.0;
    contextRef.current = ctx;
    
    // Reset when unmounting
    return () => {
      contextRef.current = null;
    };
  }, [width, height]);
  
  // Handle annotation mode changes
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = contextRef.current;
    if (!canvas || !ctx) return;
    
    // Clear previous annotations when mode changes
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set appropriate styles based on annotation mode
    if (annotationMode === 'highlight') {
      ctx.strokeStyle = `${BRAND_COLORS.ORANGE}80`; // 50% opacity
      ctx.lineWidth = 10;
      ctx.lineCap = 'round';
    }
    else if (annotationMode === 'text' || annotationMode === 'signature') {
      ctx.font = annotationMode === 'signature' 
        ? '18px "Dancing Script", cursive' 
        : '14px Montserrat, sans-serif';
      ctx.fillStyle = BRAND_COLORS.NAVY;
    }
  }, [annotationMode]);
  
  // Handle touch/mouse events for annotation
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isVisible || !annotationMode) return;
    
    const canvas = canvasRef.current;
    const ctx = contextRef.current;
    if (!canvas || !ctx) return;
    
    // Get coordinates relative to canvas
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (annotationMode === 'text') {
      // For text annotations, display a text input at this location
      const text = prompt('Enter text:');
      if (text) {
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = BRAND_COLORS.NAVY;
        ctx.font = '14px Montserrat, sans-serif';
        
        // Draw a background
        const textWidth = ctx.measureText(text).width;
        ctx.fillStyle = `${BRAND_COLORS.ORANGE}33`; // 20% opacity
        ctx.fillRect(x - 5, y - 20, textWidth + 10, 30);
        
        // Draw the text
        ctx.fillStyle = BRAND_COLORS.NAVY;
        ctx.fillText(text, x, y);
        
        if (onAnnotationAdded) onAnnotationAdded();
      }
    }
    else if (annotationMode === 'signature') {
      // For signature, display signature input
      const signature = prompt('Enter your signature:');
      if (signature) {
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = BRAND_COLORS.NAVY;
        ctx.font = '22px "Dancing Script", cursive';
        ctx.fillText(signature, x, y);
        
        if (onAnnotationAdded) onAnnotationAdded();
      }
    }
    else if (annotationMode === 'highlight') {
      // For highlight, we'll draw a highlight rectangle around this point
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = BRAND_COLORS.ORANGE;
      ctx.fillRect(x - 40, y - 10, 80, 20);
      
      if (onAnnotationAdded) onAnnotationAdded();
    }
  };
  
  if (!isVisible || !annotationMode) {
    return null;
  }
  
  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 pointer-events-auto touch-auto"
      style={{ 
        width: `${width}px`, 
        height: `${height}px`,
        cursor: annotationMode ? 'crosshair' : 'default'
      }}
      onPointerDown={handlePointerDown}
    />
  );
};

export default SimpleMobileAnnotationLayer;