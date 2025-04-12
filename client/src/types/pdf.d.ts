/**
 * Type declarations for PDF.js modules
 */

declare module 'pdfjs-dist/build/pdf' {
  export interface PDFDocumentProxy {
    numPages: number;
    getPage: (pageNumber: number) => Promise<PDFPageProxy>;
    destroy: () => Promise<void>;
  }

  export interface PDFPageProxy {
    getViewport: (options: { scale: number }) => PDFViewport;
    render: (options: {
      canvasContext: CanvasRenderingContext2D;
      viewport: PDFViewport;
    }) => PDFRenderTask;
  }

  export interface PDFViewport {
    width: number;
    height: number;
  }

  export interface PDFRenderTask {
    promise: Promise<void>;
  }

  export interface PDFWorkerOptions {
    workerSrc: string;
  }

  export interface GlobalWorkerOptions {
    workerSrc: string;
  }

  export interface PDFDocumentLoadingTask {
    promise: Promise<PDFDocumentProxy>;
  }

  export interface GetDocumentOptions {
    url?: string;
    data?: ArrayBuffer;
    useWorkerFetch?: boolean;
    enableXfa?: boolean;
  }

  export function getDocument(options: GetDocumentOptions): PDFDocumentLoadingTask;
  
  export const GlobalWorkerOptions: GlobalWorkerOptions;
}

declare module 'pdfjs-dist/build/pdf.worker.entry' {}