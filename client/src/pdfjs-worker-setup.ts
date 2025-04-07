import * as pdfjsLib from 'pdfjs-dist';

// Try using a direct reference to the static worker file from the CDN
// Make sure the version matches the installed package version
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.10.111/build/pdf.worker.min.js';

export { pdfjsLib };