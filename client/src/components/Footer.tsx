import React from "react";

const Footer: React.FC = () => {
  return (
    <footer className="bg-benext-blue-900 border-t border-benext-blue-700 py-4">
      <div className="container mx-auto px-4 text-center text-benext-gray-400 text-sm">
        <p>© {new Date().getFullYear()} beNext.io. All rights reserved.</p>
        <p className="mt-1">Roolz Core v1.0</p>
      </div>
    </footer>
  );
};

export default Footer;
