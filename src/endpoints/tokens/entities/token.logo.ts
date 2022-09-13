export class ToenLogo {
  constructor(init?: Partial<ToenLogo>) {
    Object.assign(this, init);
  }

  svgUrl?: string;
  pngUrl?: string;
}
