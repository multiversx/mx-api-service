export class CollectionLogo {
  constructor(init?: Partial<CollectionLogo>) {
    Object.assign(this, init);
  }

  pngUrl?: string;
  svgUrl?: string;
}
