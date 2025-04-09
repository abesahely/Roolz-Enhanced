# PDF Viewer Migration Plan

## Overview
This document tracks the migration from our custom PDF viewer implementation to a more standard architecture using React-PDF and a cleaner component structure.

## Current Status
**Phase:** Analysis and Setup  
**Last Updated:** April 9, 2025  
**Completion:** 30%

## Migration Checklist

### Phase 1: Analysis and Setup
- [x] Complete feature inventory of current implementation
- [x] Create component mapping documentation
- [ ] Set up new directory structure
- [ ] Install required dependencies
- [ ] Configure PDF.js worker
- [ ] Implement feature flag toggle mechanism

#### Current Implementation Feature Inventory

##### PDF Viewer Core (PDFViewer.tsx)
1. **PDF Loading & Rendering**
   - Loads PDF from File object
   - Uses pdf.js for rendering
   - Canvas-based rendering approach
   - Maintains current page state

2. **Page Navigation**
   - Previous/Next page controls
   - Current page indicator
   - Total pages display
   - Page navigation callbacks for parent components

3. **Zoom & Scaling**
   - Manual zoom in/out controls
   - Auto-scaling based on container size
   - Toggle between auto and manual scaling
   - Scale synchronization with annotation layer
   - Mobile-specific scaling optimizations

4. **Mobile Optimizations**
   - Device detection for different behaviors
   - Loading indicators specifically for mobile
   - Touch-friendly controls
   - Scrolling optimizations
   - iOS Safari-specific fixes
   - Error recovery mechanisms

5. **Error Handling**
   - PDF loading error handling
   - Rendering error recovery
   - Fallback rendering for problematic pages
   - Console logging for debugging

6. **Download Functionality**
   - Original PDF download
   - User-friendly notifications
   - Multiple download methods for cross-browser compatibility

##### PDF Editor (PDFEditor.tsx)
1. **Annotation Layer Management**
   - Fabric.js canvas initialization
   - Canvas synchronization with PDF dimensions
   - Positioning relative to PDF content
   - Event handling (keyboard, mouse)
   - Page changes synchronization

2. **Text Annotations**
   - Add text boxes at visible screen area
   - Font selection
   - Font size selection
   - Text styling
   - Drag, resize, and edit capabilities

3. **Signature Annotations**
   - Custom modal for signature input
   - Signature font styling (Dancing Script)
   - Positioning and scaling
   - Customizable appearance

4. **Checkbox Annotations**
   - Interactive checkbox creation
   - Toggle state management
   - Visual feedback for state changes
   - Custom group structure for organization

5. **PDF Saving with Annotations**
   - Capture annotations as image overlay
   - Embed into original PDF
   - Background handling for better visual display
   - Multiple download methods
   - Error handling and user feedback
   - Cross-browser/device compatibility

##### Annotation Tools (AnnotationTools.tsx)
1. **Tool Selection Interface**
   - Text tool with customizable font size
   - Signature tool with modal integration
   - Checkbox tool with toggle functionality

2. **Style Customization**
   - Font size selector for text annotations
   - beNext.io branded styling (colors, appearance)

3. **User Guidance**
   - Tool tips for annotation usage
   - Visual feedback for selected tools

### Phase 2: Core Implementation
- [ ] Implement PDFViewerContainer with error boundary
- [ ] Implement basic PDFDocument component with React-PDF
- [ ] Implement page navigation controls
- [ ] Add zoom functionality
- [ ] Create mobile-specific optimizations
- [ ] Implement memory management utilities
- [ ] Add basic error handling

### Phase 3: Annotation Integration
- [ ] Create AnnotationLayer component
- [ ] Implement synchronization with PDF pages
- [ ] Port text annotation functionality
- [ ] Port signature functionality
- [ ] Port checkbox functionality
- [ ] Implement proper position scaling on zoom

### Phase 4: Testing and Optimization
- [ ] Create test cases for all core functionality
- [ ] Test across different browsers (Chrome, Firefox, Safari)
- [ ] Test on mobile devices (iOS, Android)
- [ ] Implement performance optimizations
- [ ] Benchmark against current implementation
- [ ] Fix any identified issues

### Phase 5: Integration and Rollout
- [ ] Replace PDFViewer imports with toggle component
- [ ] Test integrated solution
- [ ] Gradually increase feature flag percentage
- [ ] Monitor for errors
- [ ] Full rollout
- [ ] Remove legacy implementation

## Technical Decisions & References

### Component Structure
```
PDFViewerContainer/ (Error Boundary Wrapper)
├── PDFViewer/ (Main Container)
│   ├── PDFDocumentLoader (Worker initialization & error handling)
│   ├── PDFDocument (Using React-PDF with optimizations)
│   │   ├── DocumentControls (Navigation, zoom)
│   │   └── PageRenderer (Single page with memory management)
│   └── AnnotationLayerManager (Coordinates Fabric.js integration)
│       └── AnnotationLayer (Fabric.js implementation)
└── ErrorFallback (Graceful degradation component)
```

### Key Implementation Challenges
1. **Worker Loading**: Ensuring PDF.js worker is properly loaded
2. **Memory Management**: Preventing memory leaks with large documents
3. **Mobile Safari Support**: Addressing iOS-specific rendering issues
4. **Fabric.js Integration**: Synchronizing annotation layer with PDF pages
5. **Performance Optimization**: Ensuring smooth experience on mobile

### Mobile-Specific Considerations
1. **Touch Handling**: Implement proper touch events for smooth scrolling and zooming
2. **Optimized Rendering**: Use progressive loading and reduced quality on initial render
3. **Memory Constraints**: Be extra careful with memory usage on mobile devices
4. **Platform Detection**: Apply iOS-specific fixes for Safari
5. **Loading Indicators**: Provide clear visual feedback for all operations

### Memory Management Strategy
- Track and clean up pages that are not in view
- Implement proper unmount cleanup
- Monitor memory usage during development
- Use worker threads for heavy processing

### Links & Resources
- [React-PDF Documentation](https://react-pdf-viewer.dev/)
- [PDF.js Documentation](https://mozilla.github.io/pdf.js/)
- [Fabric.js Documentation](http://fabricjs.com/)

## Known Issues in Current Implementation
- Infinite update loop causing performance issues
- PDFs sometimes displaying in reverse
- Zoom functionality broken on mobile
- Inconsistent auto-scaling
- Erratic scrolling behavior on mobile
- "Page loading" popups occasionally staying displayed

## Progress Log

### April 9, 2025
- Created component mapping document (component-mapping.md) outlining new architecture
- Created migration plan
- Completed initial analysis of current implementation
- Identified key challenges and mitigation strategies

### [Next Update Date]
- [Progress updates to be added here]

## Pull Request Process
Each PR related to this migration should:
1. Reference specific items from the migration checklist
2. Update this document with progress
3. Include thorough testing documentation
4. Use the tag `pdf-migration` in commit messages

## Progress Log

### April 9, 2025
- Created component mapping document (component-mapping.md) outlining new architecture
- Completed feature inventory of current implementation
- Identified key components and functionality
- Documented existing architectural patterns
- Created detailed breakdown of features to preserve in migration
