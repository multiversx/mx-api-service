const { readdirSync, readFileSync } = require('fs');
const { readFile, stat, unlink, writeFile } = require('fs').promises;
import { Logger } from '@nestjs/common';

export class FileUtils {
  static getDirectories(source: string) {
    return readdirSync(source, { withFileTypes: true })
      .filter((dirent: any) => dirent.isDirectory())
      .map((dirent: any) => dirent.name);
  }

  static getFiles(source: string) {
    return readdirSync(source, { withFileTypes: true })
      .filter((dirent: any) => !dirent.isDirectory())
      .map((dirent: any) => dirent.name);
  }

  static parseJSONFile(source: string) {
    return JSON.parse(readFileSync(source, { encoding: 'utf8' }));
  }

  static async writeFile(buffer: Buffer, path: string): Promise<void> {
    await writeFile(path, buffer);
  }

  static async readFile(path: string): Promise<Buffer> {
    return await readFile(path);
  }

  static async deleteFile(path: string): Promise<void> {
    await unlink(path);
  }

  static async getFileSize(path: string): Promise<number> {
    const statistics = await stat(path);
    return statistics.size;
  }

  static async exists(path: string): Promise<boolean> {
    try {
      await stat(path);
      return true;
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        const logger = new Logger(FileUtils.name);
        logger.error(`Unknown error when performing file exists check`);
        logger.error(error);
      }

      return false;
    }
  }
}
