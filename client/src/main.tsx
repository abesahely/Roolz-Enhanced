// Import worker setup first to ensure early initialization
// Following SimplePDF.com approach
import './pdfjs-worker-setup';

import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Import Dancing Script font for signatures
import "@fontsource/dancing-script/400.css";
import "@fontsource/dancing-script/700.css";

createRoot(document.getElementById("root")!).render(<App />);
