/**
 * Type declarations for third-party modules
 */

declare module 'multer' {
  import { Request } from 'express';
  
  interface File {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    destination?: string;
    filename?: string;
    path?: string;
    buffer?: Buffer;
  }
  
  interface MulterRequest extends Request {
    file: File;
    files?: {
      [fieldname: string]: File[];
    } | File[];
  }
  
  namespace multer {
    interface Field {
      name: string;
      maxCount?: number;
    }
    
    interface Options {
      dest?: string;
      limits?: {
        fieldNameSize?: number;
        fieldSize?: number;
        fields?: number;
        fileSize?: number;
        files?: number;
        parts?: number;
        headerPairs?: number;
      };
      fileFilter?(req: Request, file: File, callback: (error: Error | null, acceptFile: boolean) => void): void;
      storage?: StorageEngine;
    }
    
    interface StorageEngine {
      _handleFile(req: Request, file: File, callback: (error?: any, info?: Partial<File>) => void): void;
      _removeFile(req: Request, file: File, callback: (error: Error) => void): void;
    }
    
    function memoryStorage(): StorageEngine;
    function diskStorage(options: { destination?: string | ((req: Request, file: File, callback: (error: Error | null, destination: string) => void) => void), filename?: (req: Request, file: File, callback: (error: Error | null, filename: string) => void) => void }): StorageEngine;
  }

  function multer(options?: multer.Options): {
    single(fieldname: string): (req: Request, res: any, next: any) => void;
    array(fieldname: string, maxCount?: number): (req: Request, res: any, next: any) => void;
    fields(fields: multer.Field[]): (req: Request, res: any, next: any) => void;
    none(): (req: Request, res: any, next: any) => void;
  };

  export = multer;
}