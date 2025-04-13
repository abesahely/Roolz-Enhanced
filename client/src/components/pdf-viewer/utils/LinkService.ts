/**
 * PDF.js LinkService Implementation
 * 
 * This module provides a simplified implementation of PDF.js LinkService
 * which is required for proper annotation functionality.
 */

/**
 * SimpleLinkService - A minimal implementation of the PDF.js LinkService
 * that provides just enough functionality for annotations to work properly.
 */
export class SimpleLinkService {
  // Properties required by PDF.js
  pagesCount: number = 0;
  page: number = 1;
  rotation: number = 0;
  
  // Event callbacks
  onNavigate: ((dest: any) => void) | null = null;
  onUpdateCurrentPage: ((page: number) => void) | null = null;
  
  /**
   * Set the current page number
   */
  setPage(val: number): void {
    if (val >= 1 && val <= this.pagesCount) {
      this.page = val;
      if (this.onUpdateCurrentPage) {
        this.onUpdateCurrentPage(val);
      }
    }
  }
  
  /**
   * Get the current page number
   */
  get pageNumber(): number {
    return this.page;
  }
  
  /**
   * Set the rotation of the current page
   */
  setRotation(rotation: number): void {
    this.rotation = rotation;
  }
  
  /**
   * Get current rotation
   */
  get pagesRotation(): number {
    return this.rotation;
  }
  
  /**
   * Navigate to a specific destination
   */
  navigateTo(dest: any): void {
    if (this.onNavigate) {
      this.onNavigate(dest);
    }
  }
  
  /**
   * Set the document reference
   */
  setDocument(pdfDocument: any): void {
    if (pdfDocument && pdfDocument.numPages) {
      this.pagesCount = pdfDocument.numPages;
    } else {
      this.pagesCount = 0;
    }
  }
  
  /**
   * Reset the service (e.g., when document is closed)
   */
  reset(): void {
    this.page = 1;
    this.pagesCount = 0;
    this.rotation = 0;
    this.onNavigate = null;
    this.onUpdateCurrentPage = null;
  }

  /**
   * Add attributes to a link element for external links
   * Required by PDF.js for proper link handling
   */
  addLinkAttributes(link: HTMLAnchorElement, url: string, newWindow: boolean = false): void {
    link.href = url;
    link.rel = "noopener noreferrer";
    if (newWindow) {
      link.target = "_blank";
    }
    // Add any additional attributes needed for security or tracking
    link.setAttribute("data-from-pdf", "true");
  }
  
  /**
   * Navigate to a specific destination or named destination
   */
  goToDestination(dest: any): Promise<void> {
    return new Promise<void>((resolve) => {
      if (typeof dest === 'string') {
        // Handle named destination (not implemented in simple version)
        resolve();
      } else if (Array.isArray(dest)) {
        // Handle explicit destination
        const destRef = dest[0];
        let pageNumber = destRef instanceof Object ? 
          this.pagesCount : // Page reference (simplified)
          (destRef + 1);    // Page index
        
        if (pageNumber > this.pagesCount || pageNumber < 1) {
          pageNumber = 1;
        }
        
        this.setPage(pageNumber);
        resolve();
      } else {
        resolve();
      }
    });
  }
}