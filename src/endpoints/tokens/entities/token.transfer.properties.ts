import { TokenType } from "./token.type";

export class TokenTransferProperties {
  constructor(init?: Partial<TokenTransferProperties>) {
    Object.assign(this, init);
  }

  type: TokenType = TokenType.FungibleESDT;
  token?: string;
  collection?: string;
  identifier?: string;
  ticker: string = '';
  decimals?: number = 0;
  name: string = '';
  svgUrl: string = '';
}
