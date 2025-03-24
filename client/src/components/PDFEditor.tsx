import React, { useEffect, useRef, useState } from "react";
import PDFViewer from "@/components/PDFViewer";
import AnnotationTools from "@/components/AnnotationTools";
import SignatureModal from "@/components/SignatureModal";
import { fabric } from "fabric";

interface PDFEditorProps {
  file: File | null;
  onClose: () => void;
}

const PDFEditor: React.FC<PDFEditorProps> = ({ file, onClose }) => {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<fabric.Canvas | null>(null);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);

  useEffect(() => {
    if (canvasContainerRef.current && !fabricCanvas) {
      const canvas = new fabric.Canvas(document.createElement("canvas"), {
        width: canvasContainerRef.current.offsetWidth,
        height: canvasContainerRef.current.offsetHeight,
      });
      
      // Position the canvas over the PDF
      const canvasEl = canvas.getElement();
      canvasEl.style.position = "absolute";
      canvasEl.style.top = "0";
      canvasEl.style.left = "0";
      canvasEl.style.zIndex = "10";
      canvasEl.className = "annotation-canvas";
      
      if (canvasContainerRef.current) {
        canvasContainerRef.current.appendChild(canvasEl);
      }
      
      setFabricCanvas(canvas);
      
      // Cleanup function
      return () => {
        canvas.dispose();
        canvasEl.remove();
      };
    }
  }, [fabricCanvas]);

  const handleAddText = (options: {
    text: string;
    font: string;
    size: string;
    isBold: boolean;
    isItalic: boolean;
    isUnderline: boolean;
  }) => {
    if (!fabricCanvas) return;
    
    // Configure text properties based on size
    let fontSize = 14;
    if (options.size === "medium") fontSize = 20;
    if (options.size === "large") fontSize = 28;
    
    // Create a new text object
    const textObject = new fabric.Textbox(options.text, {
      left: 100,
      top: 100,
      fontFamily: options.font,
      fontSize: fontSize,
      fill: "#2DD4BF",
      fontWeight: options.isBold ? "bold" : "normal",
      fontStyle: options.isItalic ? "italic" : "normal",
      underline: options.isUnderline,
    });
    
    // Add the text to the canvas
    fabricCanvas.add(textObject);
    fabricCanvas.setActiveObject(textObject);
    fabricCanvas.renderAll();
  };

  const handleSignatureSave = (signatureCanvas: fabric.Canvas) => {
    if (!fabricCanvas) return;
    
    // Export signature as SVG
    const signatureObjects = signatureCanvas.getObjects();
    if (signatureObjects.length === 0) return;
    
    const group = new fabric.Group(signatureCanvas.getObjects());
    
    // Add to the main canvas
    fabricCanvas.add(group);
    fabricCanvas.renderAll();
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
