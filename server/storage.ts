import { documents, type Document, type InsertDocument } from "@shared/schema";

// Storage interface for documents
export interface IStorage {
  // User-related methods from original interface
  getUser(id: number): Promise<any | undefined>;
  getUserByUsername(username: string): Promise<any | undefined>;
  createUser(user: any): Promise<any>;
  
  // Document-related methods
  getAllDocuments(): Promise<Document[]>;
  getDocument(id: number): Promise<Document | undefined>;
  createDocument(document: Document): Promise<Document>;
  updateDocument(id: number, document: Partial<Document>): Promise<Document | undefined>;
  deleteDocument(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, any>;
  private docs: Map<number, Document>;
  currentUserId: number;
  currentDocId: number;

  constructor() {
    this.users = new Map();
    this.docs = new Map();
    this.currentUserId = 1;
    this.currentDocId = 1;
  }

  // User methods (kept from original implementation)
  async getUser(id: number): Promise<any | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<any | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: any): Promise<any> {
    const id = this.currentUserId++;
    const user = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Document methods
  async getAllDocuments(): Promise<Document[]> {
    return Array.from(this.docs.values()).sort((a, b) => {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }

  async getDocument(id: number): Promise<Document | undefined> {
    return this.docs.get(id);
  }

  async createDocument(document: Document): Promise<Document> {
    const id = this.currentDocId++;
    const now = new Date().toISOString();
    
    const newDocument: Document = {
      ...document,
      id,
      createdAt: now,
      updatedAt: now
    };
    
    this.docs.set(id, newDocument);
    return newDocument;
  }

  async updateDocument(id: number, document: Partial<Document>): Promise<Document | undefined> {
    const existingDocument = this.docs.get(id);
    if (!existingDocument) return undefined;
    
    const updatedDocument: Document = {
      ...existingDocument,
      ...document,
      updatedAt: new Date().toISOString()
    };
    
    this.docs.set(id, updatedDocument);
    return updatedDocument;
  }

  async deleteDocument(id: number): Promise<boolean> {
    return this.docs.delete(id);
  }
}

export const storage = new MemStorage();
