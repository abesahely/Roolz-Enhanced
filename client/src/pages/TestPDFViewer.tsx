import React, { useState } from "react";
import { DragDropUpload } from "@/components/ui/drag-drop-upload";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PDFViewerToggle from "@/components/pdf-viewer/PDFViewerToggle";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { toggleFeature, isFeatureEnabled, resetFeatureFlags } from "@/components/pdf-viewer/utils/featureFlags";
import { BRAND_COLORS } from "@/lib/constants";

/**
 * TestPDFViewer Component - Test page for all PDF viewer implementations
 * 
 * This page allows testing of different PDF viewer implementations:
 * 1. DirectPDFViewer (preferred direct PDF.js implementation)
 * 2. Legacy PDFViewer (original implementation)
 * 3. PDFViewerContainer (React-PDF based implementation)
 * 4. PDFJSViewer (iframe-based PDF.js pre-built viewer)
 */
const TestPDFViewer: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [forceNew, setForceNew] = useState(false);
  const [forceIframe, setForceIframe] = useState(false);
  const [forceDirect, setForceDirect] = useState(true);
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

  // Toggle viewer implementations
  const selectDirectViewer = () => {
    setForceDirect(true);
    setForceNew(false);
    setForceIframe(false);
  };

  const selectLegacyViewer = () => {
    setForceDirect(false);
    setForceNew(false);
    setForceIframe(false);
  };

  const selectNewViewer = () => {
    setForceDirect(false);
    setForceNew(true);
    setForceIframe(false);
  };

  const selectIframeViewer = () => {
    setForceDirect(false);
    setForceNew(false);
    setForceIframe(true);
  };

  // Reset all feature flags to defaults
  const handleResetFeatureFlags = () => {
    resetFeatureFlags();
    // Force refresh to load new settings
    window.location.reload();
  };
  
  // Toggle feature flags in localStorage
  const handleToggleDirectFlag = () => {
    const newValue = toggleFeature('useDirectPDFViewer');
    console.log(`Feature flag 'useDirectPDFViewer' set to: ${newValue}`);
  };
  
  const handleToggleNewFlag = () => {
    const newValue = toggleFeature('useNewPDFViewer');
    console.log(`Feature flag 'useNewPDFViewer' set to: ${newValue}`);
  };
  
  const handleToggleIframeFlag = () => {
    const newValue = toggleFeature('useIframePDFViewer');
    console.log(`Feature flag 'useIframePDFViewer' set to: ${newValue}`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-benext-blue">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6">
          <h1 className="text-benext-white text-2xl mb-2 md:mb-0">PDF Viewer Test</h1>
        </div>
        
        {/* Viewer Selection */}
        <div className="bg-gray-800 p-4 rounded-lg mb-6">
          <h2 className="text-benext-white text-xl mb-4">Select PDF Viewer Implementation</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Button
              onClick={selectDirectViewer}
              variant={forceDirect ? "default" : "outline"}
              className={forceDirect 
                ? "bg-benext-orange hover:bg-benext-orange/90 border-none" 
                : "border-benext-orange text-benext-orange"}
            >
              Direct Viewer (PDF.js)
            </Button>
            
            <Button
              onClick={selectLegacyViewer}
              variant={!forceDirect && !forceNew && !forceIframe ? "default" : "outline"}
              className={!forceDirect && !forceNew && !forceIframe
                ? "bg-blue-600 hover:bg-blue-700 border-none"
                : "border-blue-600 text-blue-500"}
            >
              Legacy Viewer
            </Button>
            
            <Button
              onClick={selectNewViewer}
              variant={forceNew ? "default" : "outline"}
              className={forceNew
                ? "bg-green-600 hover:bg-green-700 border-none"
                : "border-green-600 text-green-500"}
            >
              React-PDF Viewer
            </Button>
            
            <Button
              onClick={selectIframeViewer}
              variant={forceIframe ? "default" : "outline"}
              className={forceIframe
                ? "bg-purple-600 hover:bg-purple-700 border-none"
                : "border-purple-600 text-purple-500"}
            >
              Iframe Viewer
            </Button>
          </div>
          
          <h3 className="text-benext-white text-lg mb-2">Feature Flags</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <Button
              onClick={handleToggleDirectFlag}
              variant="outline"
              size="sm"
              className="border-benext-orange text-benext-white"
            >
              Direct Viewer Flag: {isFeatureEnabled('useDirectPDFViewer') ? 'ON' : 'OFF'}
            </Button>
            
            <Button
              onClick={handleToggleNewFlag}
              variant="outline"
              size="sm"
              className="border-green-500 text-benext-white"
            >
              React-PDF Flag: {isFeatureEnabled('useNewPDFViewer') ? 'ON' : 'OFF'}
            </Button>
            
            <Button
              onClick={handleToggleIframeFlag}
              variant="outline"
              size="sm"
              className="border-purple-500 text-benext-white"
            >
              Iframe Flag: {isFeatureEnabled('useIframePDFViewer') ? 'ON' : 'OFF'}
            </Button>
          </div>
          
          <Button
            onClick={handleResetFeatureFlags}
            variant="destructive"
            size="sm"
          >
            Reset All Feature Flags
          </Button>
        </div>
        
        {!file ? (
          <div className="mb-8">
            <p className="text-benext-white mb-4">
              Upload a PDF file to test the {forceDirect ? "Direct" : forceNew ? "React-PDF" : forceIframe ? "Iframe" : "Legacy"} PDF viewer implementation.
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
              forceIframe={forceIframe}
              forceDirect={forceDirect}
            />
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default TestPDFViewer;