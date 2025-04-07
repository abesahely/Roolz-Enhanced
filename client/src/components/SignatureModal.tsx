import React, { useState } from "react";
import { SIGNATURE_FONT } from "@/lib/constants";

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (signatureText: string) => void;
}

const SignatureModal: React.FC<SignatureModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [signatureText, setSignatureText] = useState("");

  const handleSave = () => {
    if (signatureText.trim()) {
      onSave(signatureText);
      onClose();
      setSignatureText(""); // Reset for next use
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-benext-blue border border-benext-gray-600 rounded-lg max-w-md w-full mx-4">
        <div className="p-4 border-b border-benext-gray-600 flex justify-between items-center">
          <h3 className="font-bold">Add Signature</h3>
          <button
            className="text-benext-gray-400 hover:text-white"
            onClick={onClose}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="p-6">
          <label className="block text-sm font-medium mb-2">Type your signature</label>
          <div className="bg-white rounded-lg p-4 mb-4">
            <input
              type="text"
              value={signatureText}
              onChange={(e) => setSignatureText(e.target.value)}
              placeholder="Type your signature here"
              className={`w-full text-black text-2xl p-2 border-b-2 border-benext-gray-300 focus:outline-none focus:border-benext-orange bg-transparent`}
              style={{ fontFamily: SIGNATURE_FONT }}
            />
          </div>
          <div className="flex justify-between space-x-3">
            <button
              className="px-4 py-2 bg-benext-gray-600 text-white rounded hover:bg-benext-gray-500"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 btn-orange rounded"
              onClick={handleSave}
              disabled={!signatureText.trim()}
            >
              Apply Signature
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignatureModal;