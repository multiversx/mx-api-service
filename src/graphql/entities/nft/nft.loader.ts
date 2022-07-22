import { Injectable, Scope } from "@nestjs/common";

import DataLoader from "dataloader";

import { CollectionService } from "src/endpoints/collections/collection.service";
import { NftCollection } from "src/endpoints/collections/entities/nft.collection";

@Injectable({
  scope: Scope.REQUEST,
})
export class NftLoader {
  constructor(protected readonly collectionService: CollectionService) {}

  public async getCollection(identifier: string): Promise<Array<NftCollection | null>> {
    return await this.nftDataLoader.load(identifier);
  }

  private readonly nftDataLoader: any = new DataLoader(async identifiers => {
    // @ts-ignore
    return await this.collectionService.getNftCollectionsForAddresses(identifiers);
  });
}
