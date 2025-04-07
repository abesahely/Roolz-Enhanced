import React, { useState } from "react";
import { FONT_SIZES, DEFAULT_FONT_SIZE, DEFAULT_FONT } from "@/lib/constants";

interface AnnotationToolsProps {
  onAddText: (options: {
    text: string;
    font: string;
    fontSize: number;
  }) => void;
  onAddSignature: () => void;
  onAddCheckbox: () => void;
}

const AnnotationTools: React.FC<AnnotationToolsProps> = ({
  onAddText,
  onAddSignature,
  onAddCheckbox,
}) => {
  const [fontSize, setFontSize] = useState<number>(DEFAULT_FONT_SIZE);

  return (
    <div className="w-full lg:w-64 bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-4 shadow-lg">
      <h3 className="font-bold mb-4">Annotation Tools</h3>

      {/* Main Tools */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        <button
          className="btn-orange py-2 px-1 rounded flex flex-col items-center justify-center"
          onClick={() => onAddText({ text: "Type here", font: DEFAULT_FONT, fontSize })}
        >
          <i className="fas fa-font text-lg mb-1"></i>
          <span className="text-xs">Text</span>
        </button>
        <button
          className="btn-orange py-2 px-1 rounded flex flex-col items-center justify-center"
          onClick={onAddSignature}
        >
          <i className="fas fa-signature text-lg mb-1"></i>
          <span className="text-xs">Sign</span>
        </button>
        <button
          className="btn-orange py-2 px-1 rounded flex flex-col items-center justify-center"
          onClick={onAddCheckbox}
        >
          <i className="fas fa-check-square text-lg mb-1"></i>
          <span className="text-xs">Check</span>
        </button>
      </div>

      {/* Text Options */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Font Size</label>
        <select
          className="w-full bg-benext-blue border border-benext-gray-600 rounded-md p-2"
          value={fontSize}
          onChange={(e) => setFontSize(Number(e.target.value))}
        >
          {FONT_SIZES.map(size => (
            <option key={size} value={size}>{size} pt</option>
          ))}
        </select>
      </div>

      {/* Tips */}
      <div className="p-3 bg-benext-blue rounded border border-benext-gray-600">
        <h4 className="text-sm font-medium mb-1">Tips:</h4>
        <ul className="text-xs space-y-1 text-benext-gray-300">
          <li>• Click to select</li>
          <li>• Drag corners to resize</li>
          <li>• Double-click to edit text</li>
          <li>• Click checkbox to toggle</li>
        </ul>
      </div>
    </div>
  );
};

export default AnnotationTools;