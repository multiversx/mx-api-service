import { Resolver } from "@nestjs/graphql";

import { CollectionService } from "src/endpoints/collections/collection.service";
import { NftCollectionQuery } from "src/graphql/entities/nft.collection/nft.collection.query";
import { NftCollection } from "src/endpoints/collections/entities/nft.collection";

@Resolver(() => NftCollection)
export class NftCollectionResolver extends NftCollectionQuery {
  constructor(collectionService: CollectionService) {
    super(collectionService);
  }
}
