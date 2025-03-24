import React, { useState } from "react";
import { DragDropUpload } from "@/components/ui/drag-drop-upload"; // Keep existing component
import PDFViewer from "../PDFViewer"; // Adjust path if needed
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "../index.css"; // Tailwind styles

const Home: React.FC = () => {
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  const handleFileUpload = (file: File) => {
    setPdfFile(file); // Set file directly, skip API for now
  };

  return (
    <div className="flex flex-col min-h-screen bg-benext-blue">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-6">
        <h1 className="text-benext-white text-2xl mb-6">Roolz</h1>
        <DragDropUpload onFileUpload={handleFileUpload} isUploading={false} />
        {pdfFile && <PDFViewer file={pdfFile} />}
      </main>
      <Footer />
    </div>
  );
};

export default Home;
