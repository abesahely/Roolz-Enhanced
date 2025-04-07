import React, { useState } from "react";

interface CheckboxToolProps {
  checked: boolean;
  onChange: (isChecked: boolean) => void;
}

const CheckboxTool: React.FC<CheckboxToolProps> = ({ checked, onChange }) => {
  const handleClick = () => {
    onChange(!checked);
  };

  return (
    <div 
      className="inline-flex items-center cursor-pointer"
      onClick={handleClick}
    >
      <div className={`w-5 h-5 border-2 border-black mr-2 flex items-center justify-center ${checked ? 'bg-white' : 'bg-white'}`}>
        {checked && <i className="fas fa-check text-black text-xs"></i>}
      </div>
    </div>
  );
};

export default CheckboxTool;