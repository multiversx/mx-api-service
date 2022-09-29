import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { QueryPagination } from "src/common/entities/query.pagination";
import { Tag } from "./entities/tag";
import { ApiUtils, CachingService } from "@elrondnetwork/erdnest";
import { IndexerService } from "src/common/indexer/indexer.service";
import { CacheInfo } from "src/utils/cache.info";

@Injectable()
export class TagService {

  constructor(
    private readonly indexerService: IndexerService,
    @Inject(forwardRef(() => CachingService))
    private readonly cachingService: CachingService,
  ) { }

  async getNftTags(pagination: QueryPagination, search?: string): Promise<Tag[]> {
    if (search) {
      return await this.getNftTagsRaw(pagination, search);
    }

    return await this.cachingService.getOrSetCache(
      CacheInfo.NftTags(pagination).key,
      async () => await this.getNftTagsRaw(pagination),
      CacheInfo.NftTags(pagination).ttl
    );
  }

  async getNftTagCount(search?: string): Promise<number> {
    if (search) {
      return this.getNftTagCountRaw(search);
    }

    return await this.cachingService.getOrSetCache(
      CacheInfo.NftTagCount.key,
      async () => await this.getNftTagCountRaw(),
      CacheInfo.NftTagCount.ttl
    );
  }

  private async getNftTagCountRaw(search?: string): Promise<number> {
    return await this.indexerService.getNftTagCount(search);
  }

  async getNftTagsRaw(pagination: QueryPagination, search?: string): Promise<Tag[]> {
    const result = await this.indexerService.getNftTags(pagination, search);

    return result.map(item => ApiUtils.mergeObjects(new Tag(), item));
  }

  async getNftTag(tag: string): Promise<Tag> {
    const result = await this.indexerService.getTag(tag);

    return ApiUtils.mergeObjects(new Tag(), result);
  }
}
