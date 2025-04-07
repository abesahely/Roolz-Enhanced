import React from "react";

const Header: React.FC = () => {
  return (
    <header className="bg-benext-blue shadow-md">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold text-benext-orange">Roolz</h1>
          <span className="ml-2 text-xs px-2 py-1 bg-benext-orange text-benext-blue rounded-full font-medium">
            CORE
          </span>
        </div>
        <nav>
          <button className="p-2 text-benext-orange hover:text-white focus:outline-none">
            <i className="fas fa-question-circle"></i>
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Header;
