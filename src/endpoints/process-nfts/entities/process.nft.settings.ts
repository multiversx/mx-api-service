import { ProcessNftRequest } from "./process.nft.request";

export class ProcessNftSettings {
  forceRefreshMedia: boolean = false;
  forceRefreshMetadata: boolean = false;
  forceRefreshThumbnail: boolean = false;
  skipRefreshThumbnail: boolean = false;

  constructor(init?: Partial<ProcessNftSettings>) {
    Object.assign(this, init);
  }

  static fromRequest(processNftRequest: ProcessNftRequest): ProcessNftSettings {
    const settings: ProcessNftSettings = {
      forceRefreshMedia: processNftRequest.forceRefreshMedia ?? false,
      forceRefreshMetadata: processNftRequest.forceRefreshMetadata ?? false,
      forceRefreshThumbnail: processNftRequest.forceRefreshThumbnail ?? false,
      skipRefreshThumbnail: processNftRequest.skipRefreshThumbnail ?? false,
    };
    return settings;
  }
}
