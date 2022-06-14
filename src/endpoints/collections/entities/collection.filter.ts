import { NftType } from "../../nfts/entities/nft.type";

export class CollectionFilter {
  collection?: string;
  identifiers?: string[];
  search?: string;
  type?: NftType[];
  owner?: string;
  canCreate?: boolean | string;
  canBurn?: boolean | string;
  canAddQuantity?: boolean | string;
  canUpdateAttributes?: boolean | string;
  canAddUri?: boolean | string;
  canTransferRole?: boolean | string;
}
