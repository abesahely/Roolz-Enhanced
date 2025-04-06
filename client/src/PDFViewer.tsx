import React, { useEffect, useRef, memo } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.js?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const PDFViewer: React.FC<{
  file: File;
  onCanvasReady: (canvas: HTMLCanvasElement) => void;
}> = ({ file, onCanvasReady }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hasRendered = useRef(false);

  useEffect(() => {
    if (file && canvasRef.current && !hasRendered.current) {
      const renderPDF = async () => {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = canvasRef.current!;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const context = canvas.getContext("2d");
        if (context) {
          await page.render({ canvasContext: context, viewport }).promise;
          hasRendered.current = true;
          onCanvasReady(canvas);
        }
      };
      renderPDF();
    }
  }, [file, onCanvasReady]);

  return (
    <canvas
      ref={canvasRef}
      id="pdf-canvas"
      style={{
        pointerEvents: "none",
        position: "absolute",
        top: 0,
        left: 0,
      }}
    />
  );
};

export default memo(PDFViewer);
