import { NftType } from "./nft.type";

export class NftFilter {
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
}
