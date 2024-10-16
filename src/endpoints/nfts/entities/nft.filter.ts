import { SortOrder } from "src/common/entities/sort.order";
import { SortCollectionNfts } from "src/endpoints/collections/entities/sort.collection.nfts";
import { NftType } from "./nft.type";
import { ScamType } from "src/common/entities/scam-type.enum";
import { NftSubType } from "./nft.sub.type";

export class NftFilter {
  constructor(init?: Partial<NftFilter>) {
    Object.assign(this, init);
  }

  search?: string;
  identifiers?: string[];
  type?: NftType[];
  subType?: NftSubType[];
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
  isScam?: boolean;
  scamType?: ScamType;
  traits?: Record<string, string>;
  excludeMetaESDT?: boolean;

  sort?: SortCollectionNfts | string;
  order?: SortOrder;
}
