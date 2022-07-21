import { Module } from "@nestjs/common";

import { CollectionModule as InternalCollectionModule } from "src/endpoints/collections/collection.module";
import { CollectionResolver } from "src/graphql/entities/collection/collection.resolver";

@Module({
  imports: [InternalCollectionModule],
  providers: [CollectionResolver],
})
export class CollectionModule {}
