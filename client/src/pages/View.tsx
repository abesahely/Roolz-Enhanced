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
      setTimeout(() => {
        const pdfCanvas = document.getElementById(
          "pdf-canvas",
        ) as HTMLCanvasElement;
        if (pdfCanvas) {
          const fabricCanvas = new fabric.Canvas("edit-canvas", {
            width: pdfCanvas.offsetWidth, // Match DOM size
            height: pdfCanvas.offsetHeight,
          });
          fabricCanvas.setBackgroundColor(
            "rgba(0,0,0,0.5)",
            fabricCanvas.renderAll.bind(fabricCanvas),
          ); // Semi-transparent for visibility
          fabricCanvas.isDrawingMode = true;
          fabricCanvas.freeDrawingBrush.width = 5;
          fabricCanvas.freeDrawingBrush.color = "#ff0000";
          canvasRef.current = fabricCanvas;
          console.log(
            "Fabric.js canvas initialized with size:",
            pdfCanvas.offsetWidth,
            pdfCanvas.offsetHeight,
          );
          console.log("Canvas position:", pdfCanvas.getBoundingClientRect());
          // Log mouse events
          fabricCanvas.on("mouse:down", (e) => console.log("Mouse down:", e));
        } else {
          console.error("PDF canvas not found");
        }
      }, 1000); // Increase delay
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
    <div className="flex flex-col min-h-screen bg-benext-blue">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-6">
        <h1 className="text-benext-white text-2xl mb-6">View Document</h1>
        <div id="canvas-container" style={{ position: "relative" }}>
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
