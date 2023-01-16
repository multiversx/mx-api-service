import { EsdtType } from "../../esdt/entities/esdt.type";

export class TokenTransferProperties {
  constructor(init?: Partial<TokenTransferProperties>) {
    Object.assign(this, init);
  }

  type: EsdtType = EsdtType.FungibleESDT;
  token?: string;
  collection?: string;
  identifier?: string;
  ticker: string = '';
  decimals?: number = 0;
  name: string = '';
  svgUrl: string = '';
}
