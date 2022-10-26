import { SortOrder } from "src/common/entities/sort.order";
import { SortCollectionNfts } from "src/endpoints/collections/entities/sort.collection.nfts";
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
  nonceBefore?: number;
  nonceAfter?: number;
  isWhitelistedStorage?: boolean;
  isNsfw?: boolean;
  traits?: Record<string, string>;

  sort?: SortCollectionNfts | string;
  order?: SortOrder;
}
