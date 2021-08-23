const { readdirSync } = require('fs');

export class FileUtils {
  static getDirectories(source: string) {
    return readdirSync(source, { withFileTypes: true })
      .filter((dirent: any) => dirent.isDirectory())
      .map((dirent: any) => dirent.name);
  }
}