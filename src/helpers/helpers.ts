const { readdirSync } = require('fs');

export function getDirectories(source: string) {
  return readdirSync(source, { withFileTypes: true })
    .filter((dirent: any) => dirent.isDirectory())
    .map((dirent: any) => dirent.name);
}