const { readdirSync, readFileSync } = require('fs');

export class FileUtils {
  static getDirectories(source: string) {
    return readdirSync(source, { withFileTypes: true })
      .filter((dirent: any) => dirent.isDirectory())
      .map((dirent: any) => dirent.name);
  }

  static parseJSONFile(source: string) {
    return JSON.parse(readFileSync(source, {encoding:'utf8'}));
  }
}