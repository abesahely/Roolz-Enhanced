// Initialize PDF.js worker using SimplePDF.com's dynamic import approach
import { initializeWorker } from "./components/pdf-viewer/utils/pdfWorkerLoader";

// Start worker initialization immediately
// This is an async operation but we don't need to wait for it
initializeWorker().catch(error => {
  console.error("Failed to initialize PDF.js worker:", error);
});

import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Import Dancing Script font for signatures
import "@fontsource/dancing-script/400.css";
import "@fontsource/dancing-script/700.css";

createRoot(document.getElementById("root")!).render(<App />);
