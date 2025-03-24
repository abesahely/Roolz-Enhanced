import React, { useEffect, useRef, useState } from "react";
import PDFViewer from "@/components/PDFViewer";
import AnnotationTools from "@/components/AnnotationTools";
import SignatureModal from "@/components/SignatureModal";

interface PDFEditorProps {
  file: File | null;
  onClose: () => void;
}

const PDFEditor: React.FC<PDFEditorProps> = ({ file, onClose }) => {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const annotationCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [annotations, setAnnotations] = useState<Array<{
    type: 'text' | 'signature',
    data: any,
    x: number,
    y: number
  }>>([]);

  useEffect(() => {
    if (canvasContainerRef.current && !annotationCanvasRef.current) {
      // Create a canvas element for annotations
      const canvas = document.createElement("canvas");
      canvas.width = canvasContainerRef.current.offsetWidth;
      canvas.height = canvasContainerRef.current.offsetHeight;
      canvas.style.position = "absolute";
      canvas.style.top = "0";
      canvas.style.left = "0";
      canvas.style.zIndex = "10";
      canvas.className = "annotation-canvas";
      
      annotationCanvasRef.current = canvas;
      
      if (canvasContainerRef.current) {
        canvasContainerRef.current.appendChild(canvas);
      }
      
      const context = canvas.getContext('2d');
      if (context) {
        setCtx(context);
      }
      
      // Cleanup function
      return () => {
        if (annotationCanvasRef.current) {
          annotationCanvasRef.current.remove();
        }
      };
    }
  }, []);

  // Render annotations whenever they change
  useEffect(() => {
    if (!ctx || !annotationCanvasRef.current) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, annotationCanvasRef.current.width, annotationCanvasRef.current.height);
    
    // Render all annotations
    annotations.forEach(annotation => {
      if (annotation.type === 'text') {
        const { text, fontSize, fontFamily, fontWeight, fontStyle, color, underline } = annotation.data;
        
        ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
        ctx.fillStyle = color;
        ctx.fillText(text, annotation.x, annotation.y);
        
        if (underline) {
          const textWidth = ctx.measureText(text).width;
          ctx.beginPath();
          ctx.moveTo(annotation.x, annotation.y + 3);
          ctx.lineTo(annotation.x + textWidth, annotation.y + 3);
          ctx.stroke();
        }
      } else if (annotation.type === 'signature') {
        // For signatures, draw the image from the data URL
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, annotation.x, annotation.y);
        };
        img.src = annotation.data;
      }
    });
  }, [annotations, ctx]);

  const handleAddText = (options: {
    text: string;
    font: string;
    size: string;
    isBold: boolean;
    isItalic: boolean;
    isUnderline: boolean;
  }) => {
    // Configure text properties based on size
    let fontSize = 14;
    if (options.size === "medium") fontSize = 20;
    if (options.size === "large") fontSize = 28;
    
    // Add new text annotation
    setAnnotations([
      ...annotations,
      {
        type: 'text',
        data: {
          text: options.text,
          fontSize,
          fontFamily: options.font,
          fontWeight: options.isBold ? 'bold' : 'normal',
          fontStyle: options.isItalic ? 'italic' : 'normal',
          color: '#2DD4BF',
          underline: options.isUnderline
        },
        x: 100,
        y: 100
      }
    ]);
  };

  const handleSignatureSave = (signatureDataURL: string) => {
    // Add new signature annotation
    setAnnotations([
      ...annotations,
      {
        type: 'signature',
        data: signatureDataURL,
        x: 100, 
        y: 200
      }
    ]);
  };

  return (
    <div className="flex flex-col lg:flex-row h-full gap-4">
      <div ref={canvasContainerRef} className="relative flex-grow">
        <PDFViewer file={file} onClose={onClose} />
      </div>
      
      <AnnotationTools
        onAddText={handleAddText}
        onShowSignatureModal={() => setIsSignatureModalOpen(true)}
      />
      
      <SignatureModal
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        onSave={handleSignatureSave}
      />
    </div>
  );
};

export default PDFEditor;
