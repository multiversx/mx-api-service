import { NftType } from "../../nfts/entities/nft.type";

export class CollectionFilter {
  collection?: string;
  identifiers?: string[];
  search?: string;
  type?: NftType;
  creator?: string;
}