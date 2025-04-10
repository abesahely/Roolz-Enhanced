import React, { useState } from "react";
import { DragDropUpload } from "@/components/ui/drag-drop-upload";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-benext-white text-2xl">Roolz</h1>
          <Link href="/test-pdf">
            <Button variant="outline" className="border-benext-orange text-benext-orange hover:bg-benext-orange hover:text-white">
              Test PDF Viewer
            </Button>
          </Link>
        </div>
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
