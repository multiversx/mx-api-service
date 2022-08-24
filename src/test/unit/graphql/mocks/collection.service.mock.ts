import { CollectionFilter } from "src/endpoints/collections/entities/collection.filter";
import { NftCollectionAccount } from "src/endpoints/collections/entities/nft.collection.account";
import { QueryPagination } from "src/common/entities/query.pagination";

export class CollectionServiceMock {
  public static readonly generateCollections = (address: string) => {
    CollectionServiceMock.collections[address] = [
      new NftCollectionAccount({
        owner: address,
      }),
      new NftCollectionAccount({
        owner: address,
      }),
      new NftCollectionAccount({
        owner: address,
      }),
    ];
  };

  static readonly collections: { [address: string]: NftCollectionAccount[] } = {};

  public getCollectionsForAddress(address: string, _: CollectionFilter, queryPagination: QueryPagination): NftCollectionAccount[] | null {
    return CollectionServiceMock.collections[address]?.slice(queryPagination.from, queryPagination.size) ?? null;
  }
}
