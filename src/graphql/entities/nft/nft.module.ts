import { Module } from "@nestjs/common";

import { NftModule as InternalNftModule } from "src/endpoints/nfts/nft.module";
import { NftResolver } from "src/graphql/entities/nft/nft.resolver";

@Module({
  imports: [InternalNftModule],
  providers: [NftResolver],
})
export class NftModule {}
