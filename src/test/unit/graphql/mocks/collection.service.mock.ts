import { randomInt } from "crypto";

import { CollectionFilter } from "src/endpoints/collections/entities/collection.filter";
import { NftCollectionAccount } from "src/endpoints/collections/entities/nft.collection.account";
import { QueryPagination } from "src/common/entities/query.pagination";

export class CollectionServiceMock {
  private static readonly count = randomInt(25, 100);

  private static readonly generateCollection = (address: string) => {
    return new NftCollectionAccount({
      owner: address,
    });
  };

  public static readonly generateCollections = (address: string) => {
    CollectionServiceMock.collections[address] = Array.from({ length: CollectionServiceMock.count }, () => CollectionServiceMock.generateCollection(address));
  };

  static readonly collections: { [address: string]: NftCollectionAccount[] } = {};

  public getCollectionsForAddress(address: string, _: CollectionFilter, queryPagination: QueryPagination): NftCollectionAccount[] | null {
    return CollectionServiceMock.collections[address]?.slice(queryPagination.from, queryPagination.size) ?? null;
  }
}
