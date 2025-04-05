import React, { useState } from "react";
import { DragDropUpload } from "@/components/ui/drag-drop-upload";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLocation } from "wouter";
import "../index.css";

const Home: React.FC = () => {
  const [location, setLocation] = useLocation();
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = (file: File) => {
    console.log("File uploaded:", file);
    setIsUploading(true);
    const fileUrl = URL.createObjectURL(file);
    setLocation(`/view?url=${encodeURIComponent(fileUrl)}`);
    console.log("Navigating to:", `/view?url=${fileUrl}`);
    setIsUploading(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-benext-blue">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-6">
        <h1 className="text-benext-white text-2xl mb-6">Roolz</h1>
        <DragDropUpload
          onFileUpload={handleFileUpload}
          isUploading={isUploading}
        />
      </main>
      <Footer />
    </div>
  );
};

export default Home;
