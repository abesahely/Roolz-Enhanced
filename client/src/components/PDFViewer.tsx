import React, { useEffect, useState } from "react";

interface PDFViewerProps {
  file: File | null;
  onClose: () => void;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ file, onClose }) => {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  
  // Create an object URL when the file changes
  useEffect(() => {
    if (!file) return;
    
    const url = URL.createObjectURL(file);
    setFileUrl(url);
    
    // Clean up the URL when component unmounts
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  const handleDownload = () => {
    if (file) {
      const url = URL.createObjectURL(file);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="flex-grow bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-4 shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-bold text-xl truncate">{file?.name || "Document.pdf"}</h2>
        <div className="flex space-x-2">
          <button
            className="btn-teal p-2 rounded"
            title="Download"
            onClick={handleDownload}
          >
            <i className="fas fa-download"></i>
          </button>
          <button
            className="bg-benext-gray-600 hover:bg-benext-gray-500 text-white p-2 rounded"
            title="Close"
            onClick={onClose}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
      </div>

      {/* PDF Viewer Area */}
      <div className="relative bg-benext-gray-100 rounded-lg overflow-hidden" style={{ height: "70vh" }}>
        {fileUrl ? (
          <iframe 
            src={fileUrl}
            className="w-full h-full border-0"
            title="PDF Document Viewer"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <p className="text-benext-gray-400">Loading document...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PDFViewer;
