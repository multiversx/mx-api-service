import { NftAccount } from "src/endpoints/nfts/entities/nft.account";
import { NftFilter } from "src/endpoints/nfts/entities/nft.filter";
import { QueryPagination } from "src/common/entities/query.pagination";

export class NftServiceMock {
  public static readonly generateNfts = (address: string) => {
    NftServiceMock.nfts[address] = [
      new NftAccount({
        owner: address,
      }),
      new NftAccount({
        owner: address,
      }),
      new NftAccount({
        owner: address,
      }),
    ];
  };

  static readonly nfts: { [address: string]: NftAccount[] } = {};

  public getNftsForAddress(address: string, queryPagination: QueryPagination, _: NftFilter): NftAccount[] | null {
    return NftServiceMock.nfts[address]?.slice(queryPagination.from, queryPagination.size) ?? null;
  }
}
