import React, { useEffect, useState } from "react";
import PDFCanvas from "@/components/PDFCanvas";

interface PDFViewerProps {
  file: File | null;
  onClose: () => void;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ file, onClose }) => {
  const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.0);

  // Load the file data when it changes
  useEffect(() => {
    if (!file) return;

    const loadData = async () => {
      try {
        const data = await file.arrayBuffer();
        setPdfData(data);
      } catch (error) {
        console.error("Error reading file:", error);
      }
    };

    loadData();
  }, [file]);

  const handlePageLoaded = (pages: number) => {
    setTotalPages(pages);
  };

  const prevPage = () => {
    if (currentPage <= 1) return;
    setCurrentPage(prev => prev - 1);
  };

  const nextPage = () => {
    if (currentPage >= totalPages) return;
    setCurrentPage(prev => prev + 1);
  };

  const changeZoom = (newScale: number) => {
    setScale(newScale);
  };

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
        {/* PDF Render Canvas */}
        <div className="w-full h-full flex items-center justify-center overflow-auto">
          <PDFCanvas 
            pdfData={pdfData} 
            pageNumber={currentPage} 
            scale={scale} 
            onPageLoaded={handlePageLoaded}
          />
        </div>

        {/* PDF Controls (Bottom) */}
        <div className="absolute bottom-0 left-0 right-0 bg-benext-blue bg-opacity-90 py-2 px-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <button
              className="text-white hover:text-benext-teal"
              title="Previous Page"
              onClick={prevPage}
              disabled={currentPage <= 1}
            >
              <i className="fas fa-chevron-left"></i>
            </button>
            <span className="text-white text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <button
              className="text-white hover:text-benext-teal"
              title="Next Page"
              onClick={nextPage}
              disabled={currentPage >= totalPages}
            >
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>
          <div className="flex items-center space-x-3">
            <button
              className="text-white hover:text-benext-teal"
              title="Zoom Out"
              onClick={() => changeZoom(scale - 0.25)}
              disabled={scale <= 0.5}
            >
              <i className="fas fa-search-minus"></i>
            </button>
            <select
              className="bg-benext-blue text-white text-sm border border-benext-gray-600 rounded px-2 py-1"
              value={scale}
              onChange={(e) => changeZoom(parseFloat(e.target.value))}
            >
              <option value="0.5">50%</option>
              <option value="0.75">75%</option>
              <option value="1">100%</option>
              <option value="1.25">125%</option>
              <option value="1.5">150%</option>
              <option value="2">200%</option>
            </select>
            <button
              className="text-white hover:text-benext-teal"
              title="Zoom In"
              onClick={() => changeZoom(scale + 0.25)}
              disabled={scale >= 2}
            >
              <i className="fas fa-search-plus"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFViewer;
