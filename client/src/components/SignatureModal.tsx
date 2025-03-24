import React, { useRef, useState, useEffect } from "react";

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (signatureDataURL: string) => void;
}

const SignatureModal: React.FC<SignatureModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);

  // Initialize canvas context
  useEffect(() => {
    if (isOpen && canvasRef.current && !ctx) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        context.lineWidth = 2;
        context.strokeStyle = '#000000';
        setCtx(context);
      }
    }
  }, [isOpen, ctx]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!ctx) return;
    
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !ctx) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (ctx) {
      ctx.closePath();
    }
    setIsDrawing(false);
  };

  const clearSignature = () => {
    if (ctx && canvasRef.current) {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  const saveSignature = () => {
    if (canvasRef.current) {
      const dataURL = canvasRef.current.toDataURL('image/png');
      onSave(dataURL);
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
              <canvas 
                ref={canvasRef} 
                width={500} 
                height={120} 
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseOut={stopDrawing}
              />
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
