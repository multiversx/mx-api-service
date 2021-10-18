import { NftType } from "./nft.type";

export class CollectionAccountFilter {
  search?: string;
  type?: NftType;
  owner?: string;
  collection?: string;
  canCreate?: boolean;
  canBurn?: boolean;
  canAddQuantity?: boolean;
}