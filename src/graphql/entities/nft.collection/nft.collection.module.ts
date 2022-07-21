import { Module } from "@nestjs/common";

import { CollectionModule } from "src/endpoints/collections/collection.module";
import { NftCollectionResolver } from "src/graphql/entities/nft.collection/nft.collection.resolver";

@Module({
  imports: [CollectionModule],
  providers: [NftCollectionResolver],
})
export class NftCollectionModule {}
