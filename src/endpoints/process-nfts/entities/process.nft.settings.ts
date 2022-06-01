export class ProcessNftSettings {
  forceRefreshMedia: boolean = false;
  forceRefreshMetadata: boolean = false;
  forceRefreshThumbnail: boolean = false;
  skipRefreshThumbnail: boolean = false;

  constructor(init?: Partial<ProcessNftSettings>) {
    Object.assign(this, init);
  }
}
