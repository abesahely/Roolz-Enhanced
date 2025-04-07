import React, { useEffect, useRef, useState } from "react";
// @ts-ignore
import { fabric } from "fabric";
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
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
  const pdfCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Initialize fabric canvas when the PDF canvas is ready
  const handleCanvasReady = (canvas: HTMLCanvasElement) => {
    pdfCanvasRef.current = canvas;
    initializeFabricCanvas();
  };

  const initializeFabricCanvas = () => {
    if (!pdfCanvasRef.current || canvasRef.current) return;

    // Get the PDF canvas
    const pdfCanvas = pdfCanvasRef.current;
    
    // Get dimensions from the PDF canvas
    const width = pdfCanvas.width;
    const height = pdfCanvas.height;
    
    // Find the PDF wrapper (parent of the PDF canvas)
    const pdfWrapper = document.querySelector('.pdf-wrapper');
    if (!pdfWrapper) {
      console.error("PDF wrapper not found");
      return;
    }
    
    // Create canvas element if it doesn't exist
    let annotationCanvas = document.getElementById('annotation-canvas') as HTMLCanvasElement;
    if (!annotationCanvas) {
      // Create a new canvas element
      annotationCanvas = document.createElement('canvas');
      annotationCanvas.id = 'annotation-canvas';
      
      // Add it to the PDF wrapper (so it's positioned directly over the PDF)
      pdfWrapper.appendChild(annotationCanvas);
    }
    
    // Set canvas dimensions
    annotationCanvas.width = width;
    annotationCanvas.height = height;
    
    // Position the canvas directly over the PDF
    annotationCanvas.style.position = 'absolute';
    annotationCanvas.style.top = '0';
    annotationCanvas.style.left = '0';
    annotationCanvas.style.zIndex = '20';
    annotationCanvas.style.pointerEvents = 'all'; // This ensures it captures all pointer events
    
    // Create a fabric canvas with the same dimensions as the PDF
    const canvas = new fabric.Canvas("annotation-canvas", {
      width: width,
      height: height,
      backgroundColor: "transparent",
      selection: true, // Allow selection
      interactive: true // Ensure fabric's interactivity is on
    });
    
    // Make sure all objects are selectable by default
    fabric.Object.prototype.selectable = true;
    fabric.Object.prototype.evented = true;
    
    // Store the canvas reference
    canvasRef.current = canvas;
    setFabricInitialized(true);
    
    // No need for a resize handler with absolute positioning relative to parent
    // But we'll set an initial position based on the container
    annotationCanvas.style.top = '0';
    annotationCanvas.style.left = '0';
    
    console.log("PDF canvas dimensions:", width, height);
    console.log("Annotation canvas initialized with interactive settings");
  };

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
  
  // Function to save the PDF with annotations
  const saveAnnotatedPDF = async () => {
    if (!file || !canvasRef.current || !pdfCanvasRef.current) {
      console.error("Cannot save annotations: Missing file or canvas");
      return;
    }
    
    try {
      // Get the PDF file
      const arrayBuffer = await file.arrayBuffer();
      
      // Load the PDF document
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();
      const firstPage = pages[0]; // For now, we only process the first page
      
      // Convert the fabric canvas to a dataURL (PNG)
      const canvas = canvasRef.current;
      const annotationsImage = canvas.toDataURL({
        format: 'png',
        quality: 1
      });
      
      // Remove the data:image/png;base64, prefix
      const base64Data = annotationsImage.replace(/^data:image\/(png|jpg);base64,/, '');
      const annotationsImageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      
      // Embed the annotations image into the PDF
      const pngImage = await pdfDoc.embedPng(annotationsImageBytes);
      
      // Get the dimensions of the page
      const { width, height } = firstPage.getSize();
      
      // Draw the annotations image on top of the PDF
      firstPage.drawImage(pngImage, {
        x: 0,
        y: 0,
        width: width,
        height: height,
      });
      
      // Serialize the PDFDocument to bytes
      const pdfBytes = await pdfDoc.save();
      
      // Create a blob and download
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      // Generate a filename with 'annotated-' prefix
      const originalName = file.name;
      const annotatedName = originalName.replace('.pdf', '-annotated.pdf');
      
      // Create download link
      const a = document.createElement('a');
      a.href = url;
      a.download = annotatedName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log("PDF saved with annotations!");
    } catch (error) {
      console.error("Error saving annotated PDF:", error);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-full gap-4 max-w-screen-2xl mx-auto">
      <div ref={canvasContainerRef} className="relative flex-grow min-w-0">
        <PDFViewer 
          file={file} 
          onClose={onClose} 
          onCanvasReady={handleCanvasReady}
          onSaveWithAnnotations={saveAnnotatedPDF}
        />
        
        {/* Annotation layer is created dynamically */}
      </div>
      
      {fabricInitialized && (
        <div className="lg:flex-shrink-0">
          <AnnotationTools
            onAddText={handleAddText}
            onAddSignature={handleAddSignature}
            onAddCheckbox={handleAddCheckbox}
          />
        </div>
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