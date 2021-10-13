import { NftType } from "./nft.type";

export class CollectionAccountFilter {
  search?: string;
  type?: NftType;
  owner?: string;
  canCreate?: boolean;
  canBurn?: boolean;
  canAddQuantity?: boolean;
}