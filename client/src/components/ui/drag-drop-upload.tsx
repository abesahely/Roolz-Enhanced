import React, { useRef, useState } from "react";
import { MAX_FILE_SIZE, ALLOWED_FILE_TYPES } from "@/lib/constants";

interface DragDropUploadProps {
  onFileUpload: (file: File) => void;
  isUploading?: boolean;
}

export const DragDropUpload: React.FC<DragDropUploadProps> = ({
  onFileUpload,
  isUploading = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files.length) {
      validateAndUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndUpload(e.target.files[0]);
    }
  };

  const validateAndUpload = (file: File) => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      alert("Please upload a PDF file.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      alert("File is too large. Maximum file size is 10MB.");
      return;
    }

    onFileUpload(file);
  };

  return (
    <div
      className={`dropzone rounded-lg p-8 mb-6 flex flex-col items-center justify-center cursor-pointer ${
        isDragging ? "active" : ""
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleFileSelect}
    >
      {isUploading ? (
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-benext-orange mb-4"></div>
          <p>Processing document...</p>
        </div>
      ) : (
        <>
          <div className="text-benext-orange mb-4 text-5xl">
            <i className="fas fa-file-pdf"></i>
          </div>
          <p className="text-center mb-2">Drag and drop your PDF here</p>
          <p className="text-benext-gray-400 text-sm text-center mb-4">
            or click to browse files
          </p>
          <button className="btn-orange px-4 py-2 rounded-md">Select File</button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".pdf"
            onChange={handleFileChange}
          />
        </>
      )}
    </div>
  );
};
