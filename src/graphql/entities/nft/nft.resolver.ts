import { Resolver } from "@nestjs/graphql";

import { Nft } from "src/endpoints/nfts/entities/nft";
import { NftService } from "src/endpoints/nfts/nft.service";
import { NftQuery } from "src/graphql/entities/nft/nft.query";

@Resolver(() => Nft)
export class NftResolver extends NftQuery {
  constructor(nftService: NftService) {
    super(nftService);
  }
}
