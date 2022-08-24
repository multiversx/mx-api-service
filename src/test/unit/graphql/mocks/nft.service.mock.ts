import { randomInt } from "crypto";

import { NftAccount } from "src/endpoints/nfts/entities/nft.account";
import { NftFilter } from "src/endpoints/nfts/entities/nft.filter";
import { QueryPagination } from "src/common/entities/query.pagination";

export class NftServiceMock {
  private static readonly count = randomInt(25, 100);

  private static readonly generateNft = (address: string) => {
    return new NftAccount({
      owner: address,
    });
  };

  public static readonly generateNfts = (address: string) => {
    NftServiceMock.nfts[address] = Array.from({ length: NftServiceMock.count }, () => NftServiceMock.generateNft(address));
  };

  static readonly nfts: { [address: string]: NftAccount[] } = {};

  public getNftsForAddress(address: string, queryPagination: QueryPagination, _: NftFilter): NftAccount[] | null {
    return NftServiceMock.nfts[address]?.slice(queryPagination.from, queryPagination.size) ?? null;
  }
}
