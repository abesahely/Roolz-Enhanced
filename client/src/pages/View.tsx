import React, { useEffect, useState } from "react";
import PDFEditor from "@/components/PDFEditor";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLocation } from "wouter";

/**
 * View Component - Displays and allows editing of PDF files
 * with beNext.io branded styling and annotation tools
 */
const View: React.FC = () => {
  const [location, setLocation] = useLocation();
  const urlParams = new URLSearchParams(window.location.search);
  const fileUrl = urlParams.get("url")
    ? decodeURIComponent(urlParams.get("url")!)
    : null;
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);

  // Fetch the PDF file from the provided URL
  useEffect(() => {
    if (fileUrl && !file) {
      setIsFetching(true);
      fetch(fileUrl)
        .then((res) => {
          if (!res.ok) {
            throw new Error("Failed to fetch the PDF file");
          }
          return res.blob();
        })
        .then((blob) => {
          const pdfFile = new File([blob], "document.pdf", {
            type: "application/pdf",
          });
          console.log("PDF file fetched:", pdfFile);
          setFile(pdfFile);
        })
        .catch((err) => {
          console.error("Fetch error:", err);
          setError("Failed to load the PDF. Please try again.");
        })
        .finally(() => {
          setIsFetching(false);
        });
    }
  }, [fileUrl]);

  const handleGoBack = () => {
    const path = "/";
    setLocation(path.replace(/\/+/g, "/"));
  };

  const handleCloseEditor = () => {
    handleGoBack();
  };

  // Error view
  if (error) {
    return (
      <div className="min-h-screen bg-benext-blue text-benext-white">
        <Header />
        <main className="container mx-auto px-4 py-6">
          <h1 className="text-2xl mb-6">Error</h1>
          <p>{error}</p>
          <button
            onClick={handleGoBack}
            className="mt-4 px-4 py-2 btn-orange rounded hover:bg-opacity-90"
          >
            Go Back
          </button>
        </main>
        <Footer />
      </div>
    );
  }

  // Loading view
  if (!file) {
    return (
      <div className="min-h-screen bg-benext-blue text-benext-white">
        <Header />
        <main className="container mx-auto px-4 py-6">
          <h1 className="text-2xl mb-6">View Document</h1>
          <p>
            {isFetching ? "Fetching PDF, please wait..." : "Loading PDF..."}
          </p>
        </main>
        <Footer />
      </div>
    );
  }

  // PDF Editor view
  return (
    <div className="min-h-screen bg-benext-blue">
      <Header />
      <main className="container mx-auto px-4 py-6">
        <h1 className="text-benext-white text-2xl mb-6">Edit Document</h1>
        <div className="bg-benext-blue bg-opacity-20 rounded-lg p-2 h-[75vh]">
          <PDFEditor file={file} onClose={handleCloseEditor} />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default View;