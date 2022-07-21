import { Resolver } from "@nestjs/graphql";

import { CollectionService } from "src/endpoints/collections/collection.service";
import { CollectionQuery } from "src/graphql/entities/collection/collection.query";
import { NftCollection } from "src/endpoints/collections/entities/nft.collection";

@Resolver(() => NftCollection)
export class CollectionResolver extends CollectionQuery {
  constructor(collectionService: CollectionService) {
    super(collectionService);
  }
}
