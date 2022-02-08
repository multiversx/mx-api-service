import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { QueryPagination } from "src/common/entities/query.pagination";
import { CachingService } from "src/common/caching/caching.service";
import { ApiUtils } from "src/utils/api.utils";
import { Constants } from "src/utils/constants";
import { Tag } from "./entities/tag";
import { ElasticService } from "src/common/elastic/elastic.service";
import { ElasticSortOrder } from "src/common/elastic/entities/elastic.sort.order";
import { ElasticQuery } from "src/common/elastic/entities/elastic.query";

@Injectable()
export class TagService {

  constructor(
    private readonly elasticService: ElasticService,
    @Inject(forwardRef(() => CachingService))
    private readonly cachingService: CachingService,
  ) { }

  async getNftTags(pagination: QueryPagination): Promise<Tag[]> {
    return await this.cachingService.getOrSetCache(
      'nftTags',
      async () => await this.getNftTagsRaw(pagination),
      Constants.oneHour(),
    );
  }

  async getNftTagsRaw(pagination: QueryPagination): Promise<Tag[]> {
    const elasticQuery = ElasticQuery.create()
      .withPagination(pagination)
      .withSort([{ name: 'count', order: ElasticSortOrder.descending }]);

    const result = await this.elasticService.getList('tags', 'tag', elasticQuery);

    const nftTags: Tag[] = result.map(item => ApiUtils.mergeObjects(new Tag(), item));

    return nftTags;
  }

  async getNftTag(tag: string): Promise<Tag> {
    const result = await this.elasticService.getItem('tags', 'tag', tag);

    return ApiUtils.mergeObjects(new Tag(), result);
  }
}
