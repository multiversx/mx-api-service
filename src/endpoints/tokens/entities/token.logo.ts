export class TokenLogo {
  constructor(init?: Partial<TokenLogo>) {
    Object.assign(this, init);
  }

  svgUrl?: string;
  pngUrl?: string;
}
