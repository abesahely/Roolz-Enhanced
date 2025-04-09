# PDF Viewer Component Mapping

## Current vs. New Architecture

This document maps the current PDFViewer implementation components to the new React-PDF based architecture we're planning to implement.

## Component Structure Overview

### Current Architecture
```
PDFViewer
├── PDF Rendering (canvas)
├── Navigation Controls
├── Zoom Controls
└── Download Controls

PDFEditor
├── PDFViewer
├── Fabric.js Canvas Layer
├── Annotation Handlers
└── Save PDF Logic

AnnotationTools
├── Text Tool
├── Signature Tool
└── Checkbox Tool

SignatureModal
└── Signature Input

CheckboxTool
└── Checkbox Component
```

### New Architecture
```
PDFViewerContainer (Error Boundary)
├── PDFContext Provider
├── PDFControlBar
│   ├── NavigationControls
│   ├── ZoomControls
│   └── DownloadControls
├── PDFDocument
│   ├── React-PDF Document Component
│   ├── Page Renderer
│   └── LoadingState
└── AnnotationLayerContainer
    ├── AnnotationContext Provider
    ├── AnnotationCanvas
    ├── AnnotationToolbar
    │   ├── TextTool
    │   ├── SignatureTool
    │   └── CheckboxTool
    └── AnnotationModals
        └── SignatureModal
```

## Detailed Component Mapping

### Core PDF Components

| Current Component | New Component | Notes |
|-------------------|---------------|-------|
| `PDFViewer` (main) | `PDFViewerContainer` | High-level container with error handling |
| PDF.js canvas rendering | `PDFDocument` using React-PDF | Handles PDF loading and rendering |
| Page navigation logic | `NavigationControls` | Extracted into dedicated component |
| Zoom control logic | `ZoomControls` | Separated for better modularity |
| Auto-scaling logic | `ZoomControls` with responsive hooks | Enhanced with better responsive behavior |
| Mobile optimization | `MobileOptimizationProvider` | Context for device-specific features |
| Error handling | `PDFErrorBoundary` | Dedicated error boundary component |
| Viewport calculations | `useViewport` hook | Abstracted logic into reusable hook |

### Annotation Components

| Current Component | New Component | Notes |
|-------------------|---------------|-------|
| Fabric.js canvas | `AnnotationCanvas` | Still uses Fabric.js but more encapsulated |
| Canvas initialization | `useAnnotationCanvas` hook | Logic moved to custom hook |
| Annotation positioning | `useVisibleArea` hook | Better separation of concerns |
| Text annotations | `TextAnnotation` component | More focused component |
| Signature handling | `SignatureAnnotation` component | Cleaner signature implementation |
| Checkbox handling | `CheckboxAnnotation` component | Improved checkbox implementation |
| Annotation tools UI | `AnnotationToolbar` | Redesigned toolbar interface |
| Save PDF logic | `useSavePDF` hook | Abstracted save logic into hook |

### User Interface Components

| Current Component | New Component | Notes |
|-------------------|---------------|-------|
| Control bar UI | `PDFControlBar` | Enhanced control bar with better UI |
| Modal overlay | `ModalProvider` + specific modals | More generic modal system |
| Loading indicators | `LoadingIndicator` | Consistent loading behavior |
| Notifications | `NotificationSystem` | Centralized notifications |
| Tool selection | `ToolSelector` | Improved tool selection interface |

## State Management

### Current Approach
- Local component state
- Prop drilling for coordination
- Global window references for cross-component communication

### New Approach
- React Context for PDF state
- React Context for annotation state
- Custom hooks for logic encapsulation
- No global window references
- Clear state ownership patterns

## Key Improvements

1. **Separation of Concerns**: Clearer responsibilities for each component
2. **Modular Architecture**: Components can be developed and tested in isolation
3. **Improved Performance**: Better memory management and rendering optimization
4. **Enhanced Mobile Experience**: Dedicated mobile optimizations
5. **Maintainability**: Smaller, more focused components are easier to understand and modify
6. **Type Safety**: Better TypeScript integration throughout the codebase
7. **Testing**: More testable component architecture
