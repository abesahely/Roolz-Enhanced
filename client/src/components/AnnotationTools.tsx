import React, { useState } from "react";

interface AnnotationToolsProps {
  onAddText: (options: {
    text: string;
    font: string;
    size: string;
    isBold: boolean;
    isItalic: boolean;
    isUnderline: boolean;
  }) => void;
  onShowSignatureModal: () => void;
}

const AnnotationTools: React.FC<AnnotationToolsProps> = ({
  onAddText,
  onShowSignatureModal,
}) => {
  const [activeTab, setActiveTab] = useState<"text" | "draw" | "signature">("text");
  const [textOptions, setTextOptions] = useState({
    font: "Roboto",
    size: "small",
    isBold: false,
    isItalic: false,
    isUnderline: false,
  });

  const handleAddText = () => {
    onAddText({
      text: "Type here",
      ...textOptions,
    });
  };

  const handleTabClick = (tab: "text" | "draw" | "signature") => {
    setActiveTab(tab);
    if (tab === "signature") {
      onShowSignatureModal();
    }
  };

  return (
    <div className="w-full lg:w-72 bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-4 shadow-lg">
      <h3 className="font-bold mb-4">Annotation Tools</h3>

      {/* Tool Tabs */}
      <div className="flex border-b border-benext-gray-600 mb-4">
        <button
          className={`flex-1 py-2 text-center ${
            activeTab === "text"
              ? "text-benext-teal border-b-2 border-benext-teal font-medium"
              : "text-benext-gray-400 hover:text-white"
          }`}
          onClick={() => handleTabClick("text")}
        >
          Text
        </button>
        <button
          className={`flex-1 py-2 text-center ${
            activeTab === "draw"
              ? "text-benext-teal border-b-2 border-benext-teal font-medium"
              : "text-benext-gray-400 hover:text-white"
          }`}
          onClick={() => handleTabClick("draw")}
        >
          Draw
        </button>
        <button
          className={`flex-1 py-2 text-center ${
            activeTab === "signature"
              ? "text-benext-teal border-b-2 border-benext-teal font-medium"
              : "text-benext-gray-400 hover:text-white"
          }`}
          onClick={() => handleTabClick("signature")}
        >
          Signature
        </button>
      </div>

      {/* Text Tool Options */}
      {activeTab === "text" && (
        <div id="textToolOptions">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Font</label>
            <select
              className="w-full bg-benext-blue border border-benext-gray-600 rounded p-2 text-white"
              value={textOptions.font}
              onChange={(e) =>
                setTextOptions({ ...textOptions, font: e.target.value })
              }
            >
              <option>Roboto</option>
              <option>Arial</option>
              <option>Times New Roman</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Size</label>
            <div className="flex space-x-2">
              <button
                className={`flex-1 ${
                  textOptions.size === "small"
                    ? "btn-teal"
                    : "bg-benext-gray-600 text-white hover:bg-benext-gray-500"
                } py-1 rounded`}
                onClick={() =>
                  setTextOptions({ ...textOptions, size: "small" })
                }
              >
                Small
              </button>
              <button
                className={`flex-1 ${
                  textOptions.size === "medium"
                    ? "btn-teal"
                    : "bg-benext-gray-600 text-white hover:bg-benext-gray-500"
                } py-1 rounded`}
                onClick={() =>
                  setTextOptions({ ...textOptions, size: "medium" })
                }
              >
                Medium
              </button>
              <button
                className={`flex-1 ${
                  textOptions.size === "large"
                    ? "btn-teal"
                    : "bg-benext-gray-600 text-white hover:bg-benext-gray-500"
                } py-1 rounded`}
                onClick={() =>
                  setTextOptions({ ...textOptions, size: "large" })
                }
              >
                Large
              </button>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Style</label>
            <div className="flex space-x-2">
              <button
                className={`w-10 h-10 ${
                  textOptions.isBold
                    ? "btn-teal"
                    : "bg-benext-gray-600 hover:bg-benext-gray-500"
                } rounded flex items-center justify-center`}
                title="Bold"
                onClick={() =>
                  setTextOptions({
                    ...textOptions,
                    isBold: !textOptions.isBold,
                  })
                }
              >
                <i className="fas fa-bold"></i>
              </button>
              <button
                className={`w-10 h-10 ${
                  textOptions.isItalic
                    ? "btn-teal"
                    : "bg-benext-gray-600 hover:bg-benext-gray-500"
                } rounded flex items-center justify-center`}
                title="Italic"
                onClick={() =>
                  setTextOptions({
                    ...textOptions,
                    isItalic: !textOptions.isItalic,
                  })
                }
              >
                <i className="fas fa-italic"></i>
              </button>
              <button
                className={`w-10 h-10 ${
                  textOptions.isUnderline
                    ? "btn-teal"
                    : "bg-benext-gray-600 hover:bg-benext-gray-500"
                } rounded flex items-center justify-center`}
                title="Underline"
                onClick={() =>
                  setTextOptions({
                    ...textOptions,
                    isUnderline: !textOptions.isUnderline,
                  })
                }
              >
                <i className="fas fa-underline"></i>
              </button>
              <button
                className="w-10 h-10 btn-teal rounded flex items-center justify-center"
                title="Color"
              >
                <i className="fas fa-palette"></i>
              </button>
            </div>
          </div>

          <div className="mb-6">
            <button
              className="w-full btn-teal py-2 rounded flex items-center justify-center"
              onClick={handleAddText}
            >
              <i className="fas fa-plus mr-2"></i> Add Text
            </button>
          </div>
        </div>
      )}

      {/* Recently Used */}
      <div>
        <h4 className="text-sm font-medium mb-2">Recently Used</h4>
        <div className="space-y-2">
          <div className="p-2 bg-benext-blue border border-benext-gray-600 rounded flex items-center justify-between group hover:border-benext-teal cursor-pointer">
            <div className="flex items-center">
              <i className="fas fa-font text-benext-teal mr-2"></i>
              <span className="text-sm">Signature Text</span>
            </div>
            <i className="fas fa-plus text-benext-teal opacity-0 group-hover:opacity-100"></i>
          </div>
          <div className="p-2 bg-benext-blue border border-benext-gray-600 rounded flex items-center justify-between group hover:border-benext-teal cursor-pointer">
            <div className="flex items-center">
              <i className="fas fa-signature text-benext-teal mr-2"></i>
              <span className="text-sm">John Signature</span>
            </div>
            <i className="fas fa-plus text-benext-teal opacity-0 group-hover:opacity-100"></i>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnnotationTools;
