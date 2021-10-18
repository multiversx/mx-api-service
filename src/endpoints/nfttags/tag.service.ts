import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { QueryPagination } from "src/common/entities/query.pagination";
import { CachingService } from "src/common/caching/caching.service";
import { ElasticQuery } from "src/common/entities/elastic/elastic.query";
import { ElasticSortOrder } from "src/common/entities/elastic/elastic.sort.order";
import { ApiUtils } from "src/utils/api.utils";
import { Constants } from "src/utils/constants";
import { Tag } from "./entities/tag";
import { ElasticService } from "src/common/external-calls-services/elastic.service";

@Injectable()
export class TagService {

  constructor(
    private readonly elasticService: ElasticService,
    @Inject(forwardRef(() => CachingService))
    private readonly cachingService: CachingService,
  ){}

  async getNftTags(pagination: QueryPagination): Promise<Tag[]> {
    return this.cachingService.getOrSetCache(
      'nftTags',
      async() => await this.getNftTagsRaw(pagination),
      Constants.oneHour(),
    )
  }

  async getNftTagsRaw(pagination: QueryPagination): Promise<Tag[]> {
    const elasticQuery = ElasticQuery.create()
      .withPagination(pagination)
      .withSort([{ name: 'count', order: ElasticSortOrder.descending }])

    let result = await this.elasticService.getList('tags', 'tag', elasticQuery);

    let nftTags: Tag[] = result.map(item => ApiUtils.mergeObjects(new Tag(), item));

    return nftTags;
  }

  async getNftTag(tag: string): Promise<Tag> {
    let result = await this.elasticService.getItem('tags', 'tag', tag);

    return ApiUtils.mergeObjects(new Tag(), result);
  }
}