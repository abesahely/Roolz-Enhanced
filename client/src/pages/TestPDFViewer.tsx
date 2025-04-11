import React, { useState } from "react";
import { DragDropUpload } from "@/components/ui/drag-drop-upload";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PDFViewerToggle from "@/components/pdf-viewer/PDFViewerToggle";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { toggleFeature, isFeatureEnabled } from "@/components/pdf-viewer/utils/featureFlags";

/**
 * TestPDFViewer Component - Test page for the new PDF viewer implementation
 */
const TestPDFViewer: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [forceNew, setForceNew] = useState(true);
  const isMobile = useIsMobile();

  // Handle file upload
  const handleFileUpload = (file: File) => {
    console.log("File uploaded:", file);
    setIsUploading(true);
    setFile(file);
    setIsUploading(false);
  };

  // Handle close PDF viewer
  const handleCloseViewer = () => {
    setFile(null);
  };

  // Toggle between implementations
  const handleToggleImplementation = () => {
    setForceNew(!forceNew);
  };

  // Toggle feature flag in localStorage
  const handleToggleFeatureFlag = () => {
    const newValue = toggleFeature('useNewPDFViewer');
    console.log(`Feature flag 'useNewPDFViewer' set to: ${newValue}`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-benext-blue">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6">
          <h1 className="text-benext-white text-2xl mb-2 md:mb-0">PDF Viewer Test</h1>
          
          <div className="flex flex-col md:flex-row gap-2 md:gap-4">
            <Button
              onClick={handleToggleImplementation}
              variant="secondary"
              className={forceNew ? "bg-green-600 hover:bg-green-700" : "bg-gray-600 hover:bg-gray-700"}
            >
              {forceNew ? "Using New Implementation" : "Using Legacy Implementation"}
            </Button>
            
            <Button
              onClick={handleToggleFeatureFlag}
              variant="outline"
              className="border-benext-orange text-benext-orange"
            >
              Feature Flag: {isFeatureEnabled('useNewPDFViewer') ? 'ON' : 'OFF'}
            </Button>
          </div>
        </div>
        
        {!file ? (
          <div className="mb-8">
            <p className="text-benext-white mb-4">
              Upload a PDF file to test the {forceNew ? "new" : "legacy"} PDF viewer implementation.
            </p>
            <div className="mb-4">
              <Button 
                onClick={async () => {
                  try {
                    // Fetch the test PDF from public directory
                    const response = await fetch('/test.pdf');
                    const blob = await response.blob();
                    const testFile = new File([blob], 'test.pdf', { type: 'application/pdf' });
                    handleFileUpload(testFile);
                  } catch (error) {
                    console.error('Error loading test PDF:', error);
                    alert('Error loading test PDF. Check console for details.');
                  }
                }}
                variant="default"
                className="bg-benext-orange hover:bg-benext-orange/90 mb-4"
              >
                Use Test PDF
              </Button>
              <p className="text-gray-400 text-sm">
                Use our simple test PDF to quickly verify the viewer functionality
              </p>
            </div>
            <DragDropUpload
              onFileUpload={handleFileUpload}
              isUploading={isUploading}
            />
          </div>
        ) : (
          <div 
            className="bg-benext-blue bg-opacity-20 rounded-lg p-2" 
            style={{ 
              minHeight: isMobile ? "400px" : "600px", 
              height: isMobile ? "calc(100vh - 200px)" : "calc(100vh - 250px)" 
            }}
          >
            <PDFViewerToggle 
              file={file}
              onClose={handleCloseViewer}
              enableAnnotations={true}
              initialPage={1}
              forceNew={forceNew}
            />
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default TestPDFViewer;