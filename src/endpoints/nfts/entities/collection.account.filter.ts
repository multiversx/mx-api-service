import { NftType } from "./nft.type";

export class CollectionAccountFilter {
  search?: string;
  type?: NftType;
  canCreate?: boolean;
  canBurn?: boolean;
  canAddQuantity?: boolean;
}