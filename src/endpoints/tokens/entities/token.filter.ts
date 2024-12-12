import { SortOrder } from "src/common/entities/sort.order";
import { TokenType } from "src/common/indexer/entities";
import { TokenSort } from "./token.sort";
import { MexPairType } from "src/endpoints/mex/entities/mex.pair.type";
import { TokenAssetsPriceSourceType } from "src/common/assets/entities/token.assets.price.source.type";
import { NftSubType } from "../../nfts/entities/nft.sub.type";

export class TokenFilter {
  constructor(init?: Partial<TokenFilter>) {
    Object.assign(this, init);
  }

  type?: TokenType;

  subType?: NftSubType;

  search?: string;

  name?: string;

  identifier?: string;

  identifiers?: string[];

  includeMetaESDT?: boolean;

  sort?: TokenSort;

  order?: SortOrder;

  mexPairType?: MexPairType[];

  priceSource?: TokenAssetsPriceSourceType;
}
