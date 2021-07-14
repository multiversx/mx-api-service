import { NftType } from "./nft.type";

export class CollectionFilter {
  search: string | undefined;
  type: NftType | undefined;
  issuer: string | undefined;
}