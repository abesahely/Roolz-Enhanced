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
  const renderTaskRef = useRef<pdfjsLib.PDFRenderTask | null>(null);

  useEffect(() => {
    console.log(
      "PDFViewer useEffect triggered. File:",
      file,
      "Canvas ref:",
      canvasRef.current,
    );

    if (file && canvasRef.current && !hasRendered.current) {
      const renderPDF = async () => {
        try {
          console.log("Starting PDF rendering...");
          const arrayBuffer = await file.arrayBuffer();
          console.log("ArrayBuffer loaded:", arrayBuffer.byteLength, "bytes");
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          console.log("PDF document loaded:", pdf.numPages, "pages");
          const page = await pdf.getPage(1);
          console.log("Page 1 loaded");

          const rotation = page.rotate;
          console.log("Page rotation:", rotation);

          const viewport = page.getViewport({ scale: 1.0 });
          console.log("Viewport:", viewport.width, "x", viewport.height);

          const canvas = canvasRef.current!;
          const context = canvas.getContext("2d");
          if (!context) {
            throw new Error("Failed to get 2D context from canvas");
          }

          if (rotation === 90 || rotation === 270) {
            canvas.width = viewport.height;
            canvas.height = viewport.width;
          } else {
            canvas.width = viewport.width;
            canvas.height = viewport.height;
          }

          context.save();
          if (rotation !== 0) {
            if (rotation === 90) {
              context.translate(canvas.width, 0);
              context.rotate((90 * Math.PI) / 180);
            } else if (rotation === 180) {
              context.translate(canvas.width, canvas.height);
              context.rotate((180 * Math.PI) / 180);
            } else if (rotation === 270) {
              context.translate(0, canvas.height);
              context.rotate((270 * Math.PI) / 180);
            }
          }

          console.log("Rendering page to canvas...");
          const renderTask = page.render({
            canvasContext: context,
            viewport: page.getViewport({ scale: 1.0, rotation: 0 }),
          });
          renderTaskRef.current = renderTask;
          await renderTask.promise;
          console.log("Page rendered successfully");

          context.restore();
          hasRendered.current = true;
          renderTaskRef.current = null;
          onCanvasReady(canvas);
        } catch (error) {
          console.error("PDF rendering error:", error);
        }
      };
      renderPDF();
    } else {
      console.log(
        "PDFViewer conditions not met. File:",
        file,
        "Canvas ref:",
        canvasRef.current,
        "Has rendered:",
        hasRendered.current,
      );
    }

    return () => {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
        console.log("Cancelled ongoing render task");
      }
    };
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
