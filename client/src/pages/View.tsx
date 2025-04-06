import React, { useEffect, useState, useRef } from "react";
import PDFViewer from "@/PDFViewer";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLocation } from "wouter";
import { fabric } from "fabric";
import { jsPDF } from "jspdf";

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
  const [fontSize, setFontSize] = useState(20);
  const [textColor, setTextColor] = useState("#000000");

  useEffect(() => {
    if (fileUrl && !file) {
      fetch(fileUrl)
        .then((res) => res.blob())
        .then((blob) => {
          const pdfFile = new File([blob], "document.pdf", {
            type: "application/pdf",
          });
          setFile(pdfFile);
        })
        .catch((err) => {
          console.error("Fetch error:", err);
          setLocation("/");
        });
    }
  }, [fileUrl, setLocation]);

  const handleCanvasReady = (pdfCanvas: HTMLCanvasElement) => {
    if (pdfCanvas.width > 0 && pdfCanvas.height > 0) {
      const newDimensions = {
        width: pdfCanvas.width,
        height: pdfCanvas.height,
      };
      setCanvasDimensions(newDimensions);

      if (!canvasRef.current) {
        const fabricCanvas = new fabric.Canvas("edit-canvas", {
          width: pdfCanvas.width,
          height: pdfCanvas.height,
        });
        fabricCanvas.setBackgroundColor(
          "rgba(0,0,0,0)",
          fabricCanvas.renderAll.bind(fabricCanvas),
        );
        fabricCanvas.isDrawingMode = false; // Explicitly disable drawing mode
        canvasRef.current = fabricCanvas;

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

        // Update text properties when a textbox is selected
        fabricCanvas.on("selection:created", () => {
          const activeObject = fabricCanvas.getActiveObject();
          if (activeObject && activeObject.type === "textbox") {
            setFontSize((activeObject as fabric.Textbox).fontSize || 20);
            setTextColor(
              ((activeObject as fabric.Textbox).fill as string) || "#000000",
            );
          }
        });
        fabricCanvas.on("selection:updated", () => {
          const activeObject = fabricCanvas.getActiveObject();
          if (activeObject && activeObject.type === "textbox") {
            setFontSize((activeObject as fabric.Textbox).fontSize || 20);
            setTextColor(
              ((activeObject as fabric.Textbox).fill as string) || "#000000",
            );
          }
        });
      }
    }
  };

  const addTextBox = () => {
    if (canvasRef.current) {
      const textBox = new fabric.Textbox("Type here", {
        left: 50,
        top: 50,
        width: 200,
        fontSize: fontSize,
        fill: textColor,
        editable: true,
        borderColor: "#0000ff",
        cornerColor: "#0000ff",
        hasControls: true,
        hasBorders: true,
        lockScalingFlip: true,
        lockUniScaling: false,
      });
      canvasRef.current.add(textBox);
      canvasRef.current.setActiveObject(textBox);
      canvasRef.current.renderAll();
      console.log("Text box added");
    }
  };

  const addSignatureBox = () => {
    if (canvasRef.current) {
      const sigBox = new fabric.Textbox("Sign here", {
        left: 50,
        top: 100,
        width: 150,
        fontSize: fontSize,
        fill: textColor,
        editable: true,
        borderColor: "#ff0000",
        cornerColor: "#ff0000",
        fontFamily: "Times New Roman",
        hasControls: true,
        hasBorders: true,
        lockScalingFlip: true,
        lockUniScaling: false,
      });
      canvasRef.current.add(sigBox);
      canvasRef.current.setActiveObject(sigBox);
      canvasRef.current.renderAll();
      console.log("Signature box added");
    }
  };

  const updateTextProperties = () => {
    if (canvasRef.current) {
      const activeObject = canvasRef.current.getActiveObject();
      if (activeObject && activeObject.type === "textbox") {
        (activeObject as fabric.Textbox).set({ fontSize, fill: textColor });
        canvasRef.current.renderAll();
      }
    }
  };

  const savePDF = async () => {
    if (canvasRef.current && file) {
      const pdfCanvas = document.getElementById(
        "pdf-canvas",
      ) as HTMLCanvasElement;
      const pdfDataUrl = pdfCanvas.toDataURL("image/png");
      const fabricDataUrl = canvasRef.current.toDataURL("image/png");

      const pdf = new jsPDF({
        orientation:
          pdfCanvas.width > pdfCanvas.height ? "landscape" : "portrait",
        unit: "px",
        format: [pdfCanvas.width, pdfCanvas.height],
      });

      pdf.addImage(pdfDataUrl, "PNG", 0, 0, pdfCanvas.width, pdfCanvas.height);
      pdf.addImage(
        fabricDataUrl,
        "PNG",
        0,
        0,
        pdfCanvas.width,
        pdfCanvas.height,
      );
      pdf.save("edited-document.pdf");
    }
  };

  useEffect(() => {
    return () => {
      if (canvasRef.current) {
        canvasRef.current.dispose();
        canvasRef.current = null;
      }
    };
  }, []);

  if (!file) {
    return <div>Loading PDF...</div>;
  }

  return (
    <div className="min-h-screen bg-benext-blue">
      <Header />
      <main className="container mx-auto px-4 py-6">
        <h1 className="text-benext-white text-2xl mb-6">View Document</h1>
        <div className="mb-4 space-x-2">
          <button
            onClick={addTextBox}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Add Text Box
          </button>
          <button
            onClick={addSignatureBox}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Add Signature Box
          </button>
          <button
            onClick={savePDF}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Save PDF
          </button>
        </div>
        <div className="mb-4 space-x-2">
          <label className="text-benext-white">
            Font Size:
            <input
              type="number"
              value={fontSize}
              onChange={(e) => {
                setFontSize(Number(e.target.value));
                updateTextProperties();
              }}
              className="ml-2 p-1 rounded"
              min="10"
              max="100"
            />
          </label>
          <label className="text-benext-white">
            Text Color:
            <input
              type="color"
              value={textColor}
              onChange={(e) => {
                setTextColor(e.target.value);
                updateTextProperties();
              }}
              className="ml-2"
            />
          </label>
        </div>
        <div
          id="canvas-container"
          style={{
            position: "relative",
            width: canvasDimensions ? `${canvasDimensions.width}px` : "892px",
            height: canvasDimensions
              ? `${canvasDimensions.height}px`
              : "1262px",
          }}
        >
          <PDFViewer file={file} onCanvasReady={handleCanvasReady} />
          <canvas
            id="edit-canvas"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
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
