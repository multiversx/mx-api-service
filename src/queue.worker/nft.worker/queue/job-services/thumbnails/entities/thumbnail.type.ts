export class ThumbnailType {
  static isImage(fileType: string): boolean {
    return fileType.startsWith("image");
  }

  static isVideo(fileType: string): boolean {
    return fileType.startsWith("video");
  }

  static isAudio(fileType: string): boolean {
    return fileType.startsWith("audio");
  }
}
