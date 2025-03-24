import React, { useEffect } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.js?url"; // Vite asset import

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const PDFViewer: React.FC<{ file: File }> = ({ file }) => {
  useEffect(() => {
    console.log("Worker src set to:", pdfjsLib.GlobalWorkerOptions.workerSrc); // Debug
    if (file) {
      const reader = new FileReader();
      reader.onload = async () => {
        const data = new Uint8Array(reader.result as ArrayBuffer);
        const pdf = await pdfjsLib.getDocument(data).promise;
        const page = await pdf.getPage(1);
        const canvas = document.getElementById(
          "pdf-canvas",
        ) as HTMLCanvasElement;
        const viewport = page.getViewport({ scale: 1.5 });
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        const context = canvas.getContext("2d");
        if (context) {
          page.render({ canvasContext: context, viewport });
        }
      };
      reader.readAsArrayBuffer(file);
    }
  }, [file]);

  return (
    <div>
      <canvas id="pdf-canvas" style={{ border: "1px solid #2DD4BF" }} />
    </div>
  );
};

export default PDFViewer;
