import * as fs from 'fs';
import * as path from 'path';

export interface StorageAdapter {
  saveFile(file: Express.Multer.File): Promise<string>;
  deleteFile(fileUrl: string): Promise<void>;
}

export class LocalStorageAdapter implements StorageAdapter {
  private uploadDir: string;

  constructor(uploadDir?: string) {
    this.uploadDir = uploadDir || process.env.UPLOAD_DIR || './uploads';
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async saveFile(file: Express.Multer.File): Promise<string> {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const filename = `${file.fieldname}-${uniqueSuffix}${ext}`;
    const destinationPath = path.join(this.uploadDir, filename);

    if (file.buffer) {
      await fs.promises.writeFile(destinationPath, file.buffer);
    } else if (file.path) {
      await fs.promises.copyFile(file.path, destinationPath);
    }

    return `/uploads/${filename}`;
  }

  async deleteFile(fileUrl: string): Promise<void> {
    const filename = path.basename(fileUrl);
    const filePath = path.join(this.uploadDir, filename);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  }
}
