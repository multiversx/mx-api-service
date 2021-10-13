import { NftType } from "./nft.type";

export class CollectionFilter {
  collection?: string;
  search?: string;
  type?: NftType;
  owner?: string;
}