import { Module } from "@nestjs/common";

import { CollectionModule } from "src/endpoints/collections/collection.module";
import { NftLoader } from "src/graphql/entities/nft/nft.loader";
import { NftResolver } from "src/graphql/entities/nft/nft.resolver";
import { NftModule as InternalNftModule } from "src/endpoints/nfts/nft.module";

@Module({
  imports: [CollectionModule, InternalNftModule],
  providers: [NftLoader, NftResolver],
})
export class NftModule {}
