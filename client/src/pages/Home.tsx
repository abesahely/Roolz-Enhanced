import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { DragDropUpload } from "@/components/ui/drag-drop-upload";
import PDFEditor from "@/components/PDFEditor";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Document } from "@shared/schema";

const Home: React.FC = () => {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [isUploading, setIsUploading] = useState(false);

  // Fetch recent documents
  const { data: recentDocuments, isLoading: isLoadingDocuments } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
  });

  // Upload document mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to upload file");
      }

      return response.json();
    },
    onSuccess: () => {
      // Refresh the documents list
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
    },
  });

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setPdfFile(file);
    
    try {
      await uploadMutation.mutateAsync(file);
      setCurrentStep(2);
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Failed to upload file. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDocumentSelect = async (document: Document) => {
    setIsUploading(true);
    
    try {
      const response = await fetch(`/api/documents/${document.id}`);
      if (!response.ok) throw new Error("Failed to fetch document");
      
      const blob = await response.blob();
      const file = new File([blob], document.filename, { type: "application/pdf" });
      
      setPdfFile(file);
      setCurrentStep(2);
    } catch (error) {
      console.error("Error fetching document:", error);
      alert("Failed to load document. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setPdfFile(null);
    setCurrentStep(1);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-6">
        {currentStep === 1 ? (
          <div id="fileUploadSection" className="flex flex-col items-center justify-center py-10 md:py-16">
            <div className="max-w-xl w-full">
              <h2 className="text-xl md:text-2xl font-bold mb-6 text-center">Upload Your Document</h2>
              
              {/* Upload Card */}
              <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-6 shadow-lg">
                <DragDropUpload onFileUpload={handleFileUpload} isUploading={isUploading} />
                
                {/* Requirements */}
                <div className="text-sm text-benext-gray-300">
                  <p className="mb-2 font-medium">Requirements:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>PDF files only</li>
                    <li>Maximum file size: 10MB</li>
                    <li>Document should be properly formatted</li>
                  </ul>
                </div>
              </div>
              
              {/* Recent Files */}
              <div className="mt-8">
                <h3 className="text-lg font-medium mb-4">Recent Documents</h3>
                <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg divide-y divide-benext-blue-700">
                  {isLoadingDocuments ? (
                    <div className="p-4 text-center">Loading documents...</div>
                  ) : recentDocuments && recentDocuments.length > 0 ? (
                    recentDocuments.map((doc) => (
                      <div
                        key={doc.id}
                        className="p-4 flex items-center justify-between hover:bg-white hover:bg-opacity-5 cursor-pointer transition"
                        onClick={() => handleDocumentSelect(doc)}
                      >
                        <div className="flex items-center">
                          <i className="fas fa-file-pdf text-benext-teal mr-3"></i>
                          <div>
                            <p className="font-medium">{doc.filename}</p>
                            <p className="text-xs text-benext-gray-400">
                              Modified: {new Date(doc.updatedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <button className="text-benext-gray-400 hover:text-benext-teal">
                          <i className="fas fa-ellipsis-v"></i>
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-benext-gray-400">
                      No recent documents
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div id="pdfViewerSection">
            <PDFEditor file={pdfFile} onClose={handleClose} />
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default Home;
