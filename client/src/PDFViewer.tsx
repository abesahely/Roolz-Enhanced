import React, { useEffect, useRef } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.js?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const PDFViewer: React.FC<{ file: File }> = ({ file }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    console.log("Worker src set to:", pdfjsLib.GlobalWorkerOptions.workerSrc);
    if (file && canvasRef.current) {
      const renderPDF = async () => {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = canvasRef.current!;
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        const context = canvas.getContext("2d");
        if (context) {
          await page.render({ canvasContext: context, viewport }).promise;
        }
      };
      renderPDF();
    }
  }, [file]);

  return (
    <div
      style={{
        position: "relative",
        width: "fit-content",
        height: "fit-content",
      }}
    >
      <canvas
        ref={canvasRef}
        id="pdf-canvas"
        style={{ border: "1px solid #2DD4BF", pointerEvents: "none" }}
      />
    </div>
  );
};

export default PDFViewer;
