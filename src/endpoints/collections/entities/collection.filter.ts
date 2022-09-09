import { NftType } from "../../nfts/entities/nft.type";

export class CollectionFilter {
  constructor(init?: Partial<CollectionFilter>) {
    Object.assign(this, init);
  }

  collection?: string;
  name?: string;
  identifiers?: string[];
  search?: string;
  type?: NftType[];
  owner?: string;
  before?: number;
  after?: number;
  canCreate?: boolean | string;
  canBurn?: boolean | string;
  canAddQuantity?: boolean | string;
  canUpdateAttributes?: boolean | string;
  canAddUri?: boolean | string;
  canTransferRole?: boolean | string;
}
