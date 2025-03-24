import React, { useRef, useState, useEffect } from "react";
import { fabric } from "fabric";

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (signatureCanvas: fabric.Canvas) => void;
}

const SignatureModal: React.FC<SignatureModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);

  useEffect(() => {
    if (isOpen && canvasRef.current && !canvas) {
      const newCanvas = new fabric.Canvas(canvasRef.current, {
        isDrawingMode: true,
        width: canvasRef.current.width,
        height: canvasRef.current.height,
      });
      
      // Set brush options
      newCanvas.freeDrawingBrush.color = "#000000";
      newCanvas.freeDrawingBrush.width = 2;
      
      setCanvas(newCanvas);
    }
  }, [isOpen, canvas]);

  const clearSignature = () => {
    if (canvas) {
      canvas.clear();
    }
  };

  const saveSignature = () => {
    if (canvas) {
      onSave(canvas);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-benext-blue border border-benext-gray-600 rounded-lg max-w-md w-full mx-4">
        <div className="p-4 border-b border-benext-gray-600 flex justify-between items-center">
          <h3 className="font-bold">Add Signature</h3>
          <button
            className="text-benext-gray-400 hover:text-white"
            onClick={onClose}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="p-6">
          <div className="bg-white rounded-lg p-2 mb-4">
            <div className="border-2 border-dashed border-benext-gray-300 h-32 rounded flex items-center justify-center">
              <canvas ref={canvasRef} width={500} height={120} />
            </div>
          </div>
          <div className="flex justify-end space-x-3">
            <button
              className="px-4 py-2 bg-benext-gray-600 text-white rounded hover:bg-benext-gray-500"
              onClick={clearSignature}
            >
              Clear
            </button>
            <button
              className="px-4 py-2 btn-teal rounded"
              onClick={saveSignature}
            >
              Apply Signature
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignatureModal;
