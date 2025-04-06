import React, { useEffect, useState, useRef } from "react";
import PDFViewer from "@/PDFViewer";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLocation } from "wouter";
import { fabric } from "fabric";

const View: React.FC = () => {
  const [location, setLocation] = useLocation();
  const urlParams = new URLSearchParams(window.location.search);
  const fileUrl = urlParams.get("url")
    ? decodeURIComponent(urlParams.get("url")!)
    : null;
  const [file, setFile] = useState<File | null>(null);
  const [canvasDimensions, setCanvasDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const canvasRef = useRef<fabric.Canvas | null>(null);

  console.log("View page - URL from params:", fileUrl);

  useEffect(() => {
    if (fileUrl && !file) {
      fetch(fileUrl)
        .then((res) => res.blob())
        .then((blob) => {
          const pdfFile = new File([blob], "document.pdf", {
            type: "application/pdf",
          });
          console.log("Fetched file:", pdfFile);
          setFile(pdfFile);
        })
        .catch((err) => {
          console.error("Fetch error:", err);
          setLocation("/");
        });
    }
  }, [fileUrl, setLocation]);

  useEffect(() => {
    if (file && !canvasRef.current) {
      const initializeCanvas = () => {
        const pdfCanvas = document.getElementById(
          "pdf-canvas",
        ) as HTMLCanvasElement;
        if (
          pdfCanvas &&
          pdfCanvas.offsetWidth > 0 &&
          pdfCanvas.offsetHeight > 0
        ) {
          setCanvasDimensions({
            width: pdfCanvas.offsetWidth,
            height: pdfCanvas.offsetHeight,
          });
          const fabricCanvas = new fabric.Canvas("edit-canvas", {
            width: pdfCanvas.offsetWidth,
            height: pdfCanvas.offsetHeight,
          });
          fabricCanvas.setBackgroundColor(
            "rgba(0,0,0,0)",
            fabricCanvas.renderAll.bind(fabricCanvas),
          );
          fabricCanvas.isDrawingMode = true;
          fabricCanvas.freeDrawingBrush.width = 5;
          fabricCanvas.freeDrawingBrush.color = "#ff0000";
          canvasRef.current = fabricCanvas;
          console.log(
            "Fabric.js canvas initialized with size:",
            pdfCanvas.offsetWidth,
            pdfCanvas.offsetHeight,
          );
          const pdfRect = pdfCanvas.getBoundingClientRect();
          const fabricRect = fabricCanvas.lowerCanvasEl.getBoundingClientRect();
          console.log("PDF canvas position:", {
            x: pdfRect.x,
            y: pdfRect.y,
            width: pdfRect.width,
            height: pdfRect.height,
          });
          console.log("Fabric canvas position:", {
            x: fabricRect.x,
            y: fabricRect.y,
            width: fabricRect.width,
            height: fabricRect.height,
          });
          fabricCanvas.on("mouse:down", (e) => console.log("Mouse down:", e));
          fabricCanvas.lowerCanvasEl.addEventListener("click", (e) =>
            console.log("Direct canvas click:", e),
          );
        } else {
          console.error("PDF canvas not found or not ready, retrying...");
          setTimeout(initializeCanvas, 500);
        }
      };
      initializeCanvas();
    }
    return () => {
      if (canvasRef.current) {
        canvasRef.current.dispose();
        canvasRef.current = null;
      }
    };
  }, [file]);

  if (!file) {
    console.log("File not yet loaded, waiting...");
    return <div>Loading PDF...</div>;
  }

  return (
    <div className="min-h-screen bg-benext-blue">
      <Header />
      <main className="container mx-auto px-4 py-6">
        <h1 className="text-benext-white text-2xl mb-6">View Document</h1>
        <div
          id="canvas-container"
          style={{
            position: "relative",
            width: canvasDimensions ? `${canvasDimensions.width}px` : "auto",
            height: canvasDimensions ? `${canvasDimensions.height}px` : "auto",
          }}
        >
          <PDFViewer file={file} />
          <canvas
            id="edit-canvas"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              pointerEvents: "auto",
              zIndex: 10,
            }}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default View;
