import { NftType } from "./nft.type";

export class NftFilter {
  search: string | undefined;
  type: NftType | undefined;
  collection: string | undefined;
  tags: string | undefined;
  creator: string | undefined;
}