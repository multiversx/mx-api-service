export class Logo {
  constructor(init?: Partial<Logo>) {
    Object.assign(this, init);
  }

  svgUrl?: string;
  pngUrl?: string;
}
