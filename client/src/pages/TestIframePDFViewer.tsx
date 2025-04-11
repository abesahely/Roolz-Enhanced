import React, { useState } from 'react';
import { PDFJSViewer } from '@/components/pdf-viewer/iframe-viewer';
import { DragDropUpload } from '@/components/ui/drag-drop-upload';
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE, BRAND_COLORS } from '@/lib/constants';

/**
 * TestIframePDFViewer - Test page for the new iframe-based PDF.js viewer
 * 
 * This page allows testing of the iframe-based viewer implementation
 * with file upload functionality and basic controls.
 */
export default function TestIframePDFViewer() {
  const [file, setFile] = useState<File | null>(null);
  const [viewerOpen, setViewerOpen] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Handle file upload
  const handleFileUpload = (uploadedFile: File) => {
    setFile(uploadedFile);
    setViewerOpen(true);
  };

  // Handle page change
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    console.log(`Page changed to: ${pageNumber}`);
  };

  // Close viewer
  const handleClose = () => {
    setViewerOpen(false);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2" style={{ color: BRAND_COLORS.NAVY }}>
          Iframe PDF.js Viewer Test
        </h1>
        <p className="text-gray-600 mb-4">
          Test the iframe-based PDF.js pre-built viewer implementation
        </p>
        <div className="flex justify-center space-x-4">
          <a href="/" className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300">
            Back to Home
          </a>
        </div>
      </div>

      {!viewerOpen ? (
        <div className="max-w-xl mx-auto">
          <DragDropUpload
            onFileUpload={handleFileUpload}
            isUploading={false}
          />
          <div className="mt-4 text-center text-sm text-gray-500">
            Accepted file types: PDF • Max file size: 10MB
          </div>
        </div>
      ) : (
        <div className="flex flex-col h-[80vh] border border-gray-300 rounded-lg overflow-hidden">
          <PDFJSViewer
            file={file}
            onClose={handleClose}
            initialPage={currentPage}
            onPageChange={handlePageChange}
            className="w-full h-full"
          />
        </div>
      )}

      {viewerOpen && (
        <div className="mt-4 p-4 bg-gray-100 rounded-lg">
          <h3 className="font-medium mb-2">PDF Viewer Status</h3>
          <p>Current page: {currentPage}</p>
          <p>File: {file?.name}</p>
          <p>Size: {file ? Math.round(file.size / 1024) : 0} KB</p>
        </div>
      )}
    </div>
  );
}