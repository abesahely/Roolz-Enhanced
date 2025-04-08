import React, { useEffect, useRef, useState } from "react";
// @ts-ignore
import { fabric } from "fabric";
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { saveAs } from 'file-saver';
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
    
    // Find the PDF wrapper element with ID
    const pdfWrapper = document.getElementById('pdf-wrapper');
    if (!pdfWrapper) {
      console.error("PDF wrapper not found");
      return;
    }
    
    // Remove any existing annotation canvas to avoid duplicates
    const existingCanvas = document.getElementById('annotation-canvas');
    if (existingCanvas) {
      existingCanvas.remove();
    }
    
    // Create a new canvas element
    const annotationCanvas = document.createElement('canvas');
    annotationCanvas.id = 'annotation-canvas';
    
    // Set canvas dimensions to match PDF
    annotationCanvas.width = width;
    annotationCanvas.height = height;
    
    // Set explicit inline styles with high specificity
    annotationCanvas.style.cssText = `
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
      z-index: 100 !important;
      pointer-events: all !important;
    `;
    
    // Add it to the PDF wrapper
    pdfWrapper.appendChild(annotationCanvas);
    
    // Create a fabric canvas with the same dimensions as the PDF
    const canvas = new fabric.Canvas("annotation-canvas", {
      width: width,
      height: height,
      backgroundColor: "transparent",
      selection: true, // Allow selection
      interactive: true, // Ensure fabric's interactivity is on
      renderOnAddRemove: true,
      controlsAboveOverlay: true
    });
    
    // Make sure all objects are selectable by default
    fabric.Object.prototype.selectable = true;
    fabric.Object.prototype.hasControls = true;
    fabric.Object.prototype.hasBorders = true;
    fabric.Object.prototype.evented = true;
    
    // Force a proper render
    setTimeout(() => {
      canvas.renderAll();
    }, 100);
    
    // Store the canvas reference
    canvasRef.current = canvas;
    setFabricInitialized(true);
    
    // Store the canvas in the window object so it can be accessed from PDFViewer
    // This allows us to synchronize scaling between the PDF and the annotations
    (window as any).fabricCanvas = canvas;
    
    // Set up the fabric canvas to work in text editing mode
    // This helps make sure the canvas is properly initialized with all settings
    canvas.setZoom(1);
    canvas.selection = true;
    canvas.interactive = true;
    canvas.enableRetinaScaling = true;
    
    // Make all objects selectable and visible by default
    fabric.Object.prototype.transparentCorners = false;
    fabric.Object.prototype.cornerColor = '#F4871F';
    fabric.Object.prototype.cornerStyle = 'circle';
    
    // Add keyboard event listener for deleting selected objects
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only proceed if we have an active canvas
      if (!canvas) return;
      
      // Check if Delete or Backspace is pressed
      if ((e.key === 'Delete' || e.key === 'Backspace')) {
        const activeObject = canvas.getActiveObject();
        if (activeObject) {
          // Skip if we're actively editing a textbox (check if there's an active text input)
          if (document.activeElement && 
              (document.activeElement.tagName.toLowerCase() === 'input' || 
               document.activeElement.tagName.toLowerCase() === 'textarea' ||
               (activeObject as any).isEditing === true)) {
            return; // Let the default behavior happen for text editing
          }
          
          // Delete the object
          canvas.remove(activeObject);
          canvas.renderAll();
          e.preventDefault(); // Prevent browser's back navigation on backspace
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    // Add cleanup function to remove event listener and cleanup window references
    const cleanup = () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (canvas) {
        canvas.dispose();
        // Remove reference to canvas in window object
        if ((window as any).fabricCanvas === canvas) {
          delete (window as any).fabricCanvas;
        }
      }
    };
    
    // Store the cleanup function in a ref for later use
    const cleanupRef = React.useRef(cleanup);
    cleanupRef.current = cleanup;
    
    // Add cleanup on component unmount
    React.useEffect(() => {
      return () => {
        cleanupRef.current();
      };
    }, []);
    
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
      lockUniScaling: true, // This prevents text from resizing when box is resized
      textAlign: 'left',
      scaleX: 1,
      scaleY: 1,
      fixedWidth: true,
      splitByGrapheme: false
    });
    
    canvasRef.current.add(textbox);
    canvasRef.current.setActiveObject(textbox);
    canvasRef.current.renderAll();
    console.log("Text annotation added");
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
      lockUniScaling: true, // This prevents text from resizing when box is resized
      textAlign: 'left',
      scaleX: 1,
      scaleY: 1,
      fixedWidth: true,
    });
    
    canvasRef.current.add(signatureBox);
    canvasRef.current.setActiveObject(signatureBox);
    canvasRef.current.renderAll();
    console.log("Signature annotation added");
  };

  const handleAddCheckbox = () => {
    if (!canvasRef.current) return;
    
    // Create a group for the checkbox only (no label)
    const checkboxRect = new fabric.Rect({
      left: 0,
      top: 0,
      width: 20,
      height: 20,
      fill: 'white',
      stroke: 'black',
      strokeWidth: 2,
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
    
    const group = new fabric.Group([checkboxRect, stateObject, checkmark], {
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
    console.log("Checkbox annotation added");
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
      
      // First, let's save the current state of all objects
      const canvas = canvasRef.current;
      const objects = canvas.getObjects();
      const originalBackgrounds: Record<number, string | undefined> = {};
      
      // Temporarily remove all backgrounds from objects
      objects.forEach((obj: fabric.Object, index: number) => {
        if ((obj as any).type === 'textbox') {
          originalBackgrounds[index] = (obj as any).backgroundColor;
          (obj as any).set({ backgroundColor: 'transparent' });
        } else if ((obj as any).type === 'group') {
          const groupObjects = (obj as any)._objects;
          if (groupObjects) {
            groupObjects.forEach((groupObj: any) => {
              if (groupObj.type === 'textbox') {
                originalBackgrounds[index] = groupObj.backgroundColor;
                groupObj.set({ backgroundColor: 'transparent' });
              }
            });
          }
        }
      });
      
      // Force a render to update the objects
      canvas.renderAll();
      
      // Convert the fabric canvas to a dataURL (PNG) without backgrounds
      const annotationsImage = canvas.toDataURL({
        format: 'png',
        quality: 1
      });
      
      // Restore the original backgrounds
      objects.forEach((obj: fabric.Object, index: number) => {
        if ((obj as any).type === 'textbox' && index in originalBackgrounds) {
          (obj as any).set({ backgroundColor: originalBackgrounds[index] });
        } else if ((obj as any).type === 'group') {
          const groupObjects = (obj as any)._objects;
          if (groupObjects) {
            groupObjects.forEach((groupObj: any) => {
              if (groupObj.type === 'textbox' && index in originalBackgrounds) {
                groupObj.set({ backgroundColor: originalBackgrounds[index] });
              }
            });
          }
        }
      });
      
      // Restore the canvas with original backgrounds
      canvas.renderAll();
      
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
      console.log("Serializing PDF with annotations...");
      const pdfBytes = await pdfDoc.save();
      
      // Create a blob with the PDF data
      console.log("Creating blob for annotated PDF...");
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      
      // Generate a filename with 'annotated-' prefix
      const originalName = file.name || "document.pdf";
      let annotatedName = originalName.replace(/\.pdf$/i, '-annotated.pdf');
      if (!annotatedName.endsWith('.pdf')) {
        annotatedName += '.pdf'; // Ensure it has the PDF extension
      }
      
      console.log("Preparing to download annotated PDF:", annotatedName);
      
      try {
        // Use FileSaver.js to directly download the file
        saveAs(blob, annotatedName);
        console.log("FileSaver.js initiated download for annotated PDF");
        return; // Exit function after successful download
      } catch (error) {
        console.error("Error with FileSaver download:", error);
        // If FileSaver failed, continue with fallback approach
      }
      
      // Fallback: Create a download dialog for manual interaction
      console.log("Creating download dialog for annotated PDF");
      const downloadUrl = URL.createObjectURL(blob);
      
      // Create a visible button element which the user can directly interact with
      // This helps on iOS where automatic clicks are often blocked
      const downloadArea = document.createElement('div');
      downloadArea.style.position = 'fixed';
      downloadArea.style.top = '50%';
      downloadArea.style.left = '50%';
      downloadArea.style.transform = 'translate(-50%, -50%)';
      downloadArea.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
      downloadArea.style.color = 'white';
      downloadArea.style.padding = '20px';
      downloadArea.style.borderRadius = '8px';
      downloadArea.style.zIndex = '10000';
      downloadArea.style.textAlign = 'center';
      
      // Add explanation text
      const message = document.createElement('p');
      message.textContent = 'Your annotated PDF is ready. Tap the button below to download or view it.';
      message.style.marginBottom = '15px';
      downloadArea.appendChild(message);
      
      // Create the download button
      const downloadButton = document.createElement('a');
      downloadButton.href = downloadUrl;
      downloadButton.download = annotatedName;
      downloadButton.textContent = 'Download Annotated PDF';
      downloadButton.style.display = 'inline-block';
      downloadButton.style.backgroundColor = '#F4871F';
      downloadButton.style.color = 'white';
      downloadButton.style.padding = '10px 15px';
      downloadButton.style.borderRadius = '4px';
      downloadButton.style.textDecoration = 'none';
      downloadButton.style.fontWeight = 'bold';
      downloadButton.style.cursor = 'pointer';
      downloadButton.style.marginBottom = '10px';
      downloadArea.appendChild(downloadButton);
      
      // Add a view button for mobile users who can't download
      const viewButton = document.createElement('a');
      viewButton.href = downloadUrl;
      viewButton.target = '_blank';
      viewButton.textContent = 'View PDF';
      viewButton.style.display = 'inline-block';
      viewButton.style.backgroundColor = '#0A1E45';
      viewButton.style.color = 'white';
      viewButton.style.padding = '10px 15px';
      viewButton.style.borderRadius = '4px';
      viewButton.style.textDecoration = 'none';
      viewButton.style.fontWeight = 'bold';
      viewButton.style.cursor = 'pointer';
      viewButton.style.marginLeft = '10px';
      viewButton.style.marginBottom = '10px';
      downloadArea.appendChild(viewButton);
      
      // Add a close button
      const closeButton = document.createElement('button');
      closeButton.textContent = 'Close';
      closeButton.style.display = 'block';
      closeButton.style.backgroundColor = '#666';
      closeButton.style.color = 'white';
      closeButton.style.border = 'none';
      closeButton.style.padding = '8px 15px';
      closeButton.style.borderRadius = '4px';
      closeButton.style.margin = '10px auto 0';
      closeButton.style.cursor = 'pointer';
      closeButton.onclick = () => {
        document.body.removeChild(downloadArea);
        URL.revokeObjectURL(downloadUrl);
      };
      downloadArea.appendChild(closeButton);
      
      // Add note for iOS users
      const iOSNote = document.createElement('p');
      iOSNote.textContent = 'On iOS: If download doesn\'t start, tap and hold the button, then choose "Download Linked File" or "Open in New Tab".';
      iOSNote.style.fontSize = '12px';
      iOSNote.style.marginTop = '10px';
      iOSNote.style.opacity = '0.8';
      downloadArea.appendChild(iOSNote);
      
      // Add to body
      document.body.appendChild(downloadArea);
      
      // Auto-cleanup after 60 seconds if user doesn't close manually
      setTimeout(() => {
        if (document.body.contains(downloadArea)) {
          document.body.removeChild(downloadArea);
          URL.revokeObjectURL(downloadUrl);
        }
      }, 60000);
      
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