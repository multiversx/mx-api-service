import { NftType } from "./nft.type";

export class NftFilter {
  constructor(init?: Partial<NftFilter>) {
    Object.assign(this, init);
  }

  search?: string;
  identifiers?: string[];
  type?: NftType;
  collection?: string;
  collections?: string[];
  tags?: string[];
  name?: string;
  creator?: string;
  hasUris?: boolean;
  includeFlagged?: boolean;
  before?: number;
  after?: number;
  isWhitelistedStorage?: boolean;
  isNsfw?: boolean;
}
