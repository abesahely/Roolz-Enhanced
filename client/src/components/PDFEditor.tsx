import React, { useEffect, useRef, useState } from "react";
// @ts-ignore
import { fabric } from "fabric";
import PDFViewer from "@/components/PDFViewer";
import AnnotationTools from "@/components/AnnotationTools";
import SignatureModal from "@/components/SignatureModal";
import CheckboxTool from "@/components/CheckboxTool";
import { 
  ANNOTATION_BACKGROUND, 
  DEFAULT_FONT, 
  DEFAULT_FONT_SIZE,
  SIGNATURE_FONT 
} from "@/lib/constants";

interface PDFEditorProps {
  file: File | null;
  onClose: () => void;
}

type AnnotationType = 'text' | 'signature' | 'checkbox';

const PDFEditor: React.FC<PDFEditorProps> = ({ file, onClose }) => {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const canvasRef = useRef<fabric.Canvas | null>(null);
  const [fabricInitialized, setFabricInitialized] = useState(false);

  useEffect(() => {
    if (canvasContainerRef.current && !canvasRef.current) {
      // Create a canvas element for annotations
      const canvas = new fabric.Canvas("annotation-canvas", {
        width: canvasContainerRef.current.offsetWidth,
        height: canvasContainerRef.current.offsetHeight,
        backgroundColor: "transparent",
      });
      
      canvasRef.current = canvas;
      setFabricInitialized(true);
      
      // Cleanup function
      return () => {
        if (canvasRef.current) {
          canvasRef.current.dispose();
          canvasRef.current = null;
        }
      };
    }
  }, []);

  const handleAddText = (options: {
    text: string;
    font: string;
    fontSize: number;
  }) => {
    if (!canvasRef.current) return;
    
    // Create new textbox with orange background
    const textbox = new fabric.Textbox(options.text, {
      left: 100,
      top: 100,
      width: 200,
      fontSize: options.fontSize || DEFAULT_FONT_SIZE,
      fontFamily: options.font || DEFAULT_FONT,
      fill: '#000000',
      backgroundColor: ANNOTATION_BACKGROUND,
      editable: true,
      borderColor: "#F4871F",
      cornerColor: "#F4871F",
      hasControls: true,
      hasBorders: true,
      lockScalingFlip: true,
      lockUniScaling: false,
    });
    
    canvasRef.current.add(textbox);
    canvasRef.current.setActiveObject(textbox);
    canvasRef.current.renderAll();
  };

  const handleAddSignature = () => {
    setIsSignatureModalOpen(true);
  };

  const handleSignatureSave = (signatureText: string) => {
    if (!canvasRef.current) return;
    
    // Create new signature textbox with orange background
    const signatureBox = new fabric.Textbox(signatureText, {
      left: 100,
      top: 200,
      width: 200,
      fontSize: 28,
      fontFamily: SIGNATURE_FONT,
      fontWeight: 'bold',
      fill: '#000000',
      backgroundColor: ANNOTATION_BACKGROUND,
      editable: true,
      borderColor: "#F4871F",
      cornerColor: "#F4871F",
      hasControls: true,
      hasBorders: true,
      lockScalingFlip: true,
      lockUniScaling: false,
    });
    
    canvasRef.current.add(signatureBox);
    canvasRef.current.setActiveObject(signatureBox);
    canvasRef.current.renderAll();
  };

  const handleAddCheckbox = () => {
    if (!canvasRef.current) return;
    
    // Create a group for the checkbox (box + label)
    const checkboxRect = new fabric.Rect({
      left: 0,
      top: 0,
      width: 20,
      height: 20,
      fill: 'white',
      stroke: 'black',
      strokeWidth: 2,
    });
    
    const checkboxLabel = new fabric.Textbox('Checkbox Label', {
      left: 30,
      top: 0,
      fontSize: DEFAULT_FONT_SIZE,
      fontFamily: DEFAULT_FONT,
      fill: '#000000',
      backgroundColor: ANNOTATION_BACKGROUND,
    });
    
    // Create an invisible object to store checkbox state
    const stateObject = new fabric.Rect({
      left: 0,
      top: 0,
      width: 0,
      height: 0,
      opacity: 0,
      selectable: false,
    }) as fabric.Rect & { checked: boolean };
    
    // Add a custom property for state
    (stateObject as any).checked = false;
    
    // Create check mark (initially hidden)
    const checkmark = new fabric.Text('✓', {
      left: 4,
      top: -2,
      fontSize: 20,
      fontFamily: DEFAULT_FONT,
      fill: 'black',
      opacity: 0,
      selectable: false,
    });
    
    const group = new fabric.Group([checkboxRect, checkboxLabel, stateObject, checkmark], {
      left: 100,
      top: 150,
      selectable: true,
      hasControls: true,
      hasBorders: true,
    });
    
    // Add custom behavior to the checkbox
    group.on('mousedown', function(e: { e: Event }) {
      const pointer = canvasRef.current!.getPointer(e.e);
      const clickPoint = group.getLocalPointer(pointer);
      
      // Check if click was inside the checkbox (not the label)
      if (clickPoint.x >= 0 && clickPoint.x <= 20 && clickPoint.y >= 0 && clickPoint.y <= 20) {
        // Toggle checkbox state
        const newState = !stateObject.checked;
        (stateObject as any).checked = newState;
        
        // Toggle checkmark visibility
        checkmark.set({ opacity: newState ? 1 : 0 });
        
        canvasRef.current!.renderAll();
        (e.e as any).stopPropagation(); // Prevent canvas selection behavior
      }
    });
    
    canvasRef.current.add(group);
    canvasRef.current.setActiveObject(group);
    canvasRef.current.renderAll();
  };

  return (
    <div className="flex flex-col lg:flex-row h-full gap-4">
      <div ref={canvasContainerRef} className="relative flex-grow">
        <PDFViewer file={file} onClose={onClose} />
        <canvas 
          id="annotation-canvas" 
          className="absolute top-0 left-0 z-10 w-full h-full" 
        />
      </div>
      
      {fabricInitialized && (
        <AnnotationTools
          onAddText={handleAddText}
          onAddSignature={handleAddSignature}
          onAddCheckbox={handleAddCheckbox}
        />
      )}
      
      <SignatureModal
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        onSave={handleSignatureSave}
      />
    </div>
  );
};

export default PDFEditor;