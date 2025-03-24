import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import { randomUUID } from "crypto";

// Configure multer for in-memory file storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== '.pdf') {
      return cb(new Error('Only PDF files are allowed'));
    }
    cb(null, true);
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all documents
  app.get('/api/documents', async (_req, res) => {
    try {
      const documents = await storage.getAllDocuments();
      res.json(documents);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch documents', error: (error as Error).message });
    }
  });

  // Get a document by ID
  app.get('/api/documents/:id', async (req, res) => {
    try {
      const document = await storage.getDocument(parseInt(req.params.id));
      
      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${document.filename}"`);
      res.send(document.data);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch document', error: (error as Error).message });
    }
  });

  // Upload a document
  app.post('/api/documents/upload', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      
      const { originalname, buffer, size, mimetype } = req.file;
      
      const newDocument = await storage.createDocument({
        filename: originalname,
        data: buffer,
        size,
        mimeType: mimetype,
        id: 0, // Will be assigned by storage
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      res.status(201).json({ 
        id: newDocument.id,
        filename: newDocument.filename,
        size: newDocument.size,
        createdAt: newDocument.createdAt,
        updatedAt: newDocument.updatedAt
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to upload document', error: (error as Error).message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
