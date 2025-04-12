import React, { useState } from 'react';
import { DirectPDFViewer } from '@/components/pdf-viewer/direct-viewer';
import { DragDropUpload } from '@/components/ui/drag-drop-upload';
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE, BRAND_COLORS } from '@/lib/constants';

/**
 * TestDirectPDFViewer - Test page for the direct PDF.js viewer
 * 
 * This page allows testing of the direct PDF.js viewer implementation
 * which avoids version conflicts with react-pdf.
 */
export default function TestDirectPDFViewer() {
  const [file, setFile] = useState<File | null>(null);
  const [viewerOpen, setViewerOpen] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [viewerKey, setViewerKey] = useState<string>("initial");
  
  // Handle file upload
  const handleFileUpload = (uploadedFile: File) => {
    // Create a stable unique key for the viewer component based on the file
    const newKey = `${uploadedFile.name}-${uploadedFile.size}-${uploadedFile.lastModified}`;
    setViewerKey(newKey);
    
    // Set file and open viewer
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
          Direct PDF.js Viewer Test
        </h1>
        <p className="text-gray-600 mb-4">
          Test the direct PDF.js implementation (no react-pdf dependency)
        </p>
        <div className="flex justify-center space-x-4">
          <a href="/" className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300">
            Back to Home
          </a>
        </div>
      </div>

      <div className="max-w-xl mx-auto" style={{ display: viewerOpen ? 'none' : 'block' }}>
        <DragDropUpload
          onFileUpload={handleFileUpload}
          isUploading={false}
        />
        <div className="mt-4 text-center text-sm text-gray-500">
          Accepted file types: PDF • Max file size: 10MB
        </div>
      </div>
      
      {file && (
        <div 
          className="flex flex-col h-[90vh] md:h-[85vh] border border-gray-300 rounded-lg overflow-hidden w-full" 
          style={{ display: viewerOpen ? 'flex' : 'none' }}
        >
          <DirectPDFViewer
            key={viewerKey} // Use the stable key to ensure proper component lifecycle
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