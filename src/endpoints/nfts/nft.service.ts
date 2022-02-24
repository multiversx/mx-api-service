import { forwardRef, Inject, Injectable, Logger } from "@nestjs/common";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { QueryPagination } from "src/common/entities/query.pagination";
import { ApiUtils } from "src/utils/api.utils";
import { BinaryUtils } from "src/utils/binary.utils";
import { TokenUtils } from "src/utils/token.utils";
import { Nft } from "./entities/nft";
import { NftAccount } from "./entities/nft.account";
import { NftFilter } from "./entities/nft.filter";
import { NftOwner } from "./entities/nft.owner";
import { NftType } from "./entities/nft.type";
import { NftQueryOptions } from "./entities/nft.query.options";
import { ElasticService } from "src/common/elastic/elastic.service";
import { EsdtService } from "../esdt/esdt.service";
import { TokenAssetService } from "../tokens/token.asset.service";
import { ElasticQuery } from "src/common/elastic/entities/elastic.query";
import { QueryConditionOptions } from "src/common/elastic/entities/query.condition.options";
import { QueryType } from "src/common/elastic/entities/query.type";
import { QueryOperator } from "src/common/elastic/entities/query.operator";
import { CachingService } from "src/common/caching/caching.service";
import { Constants } from "src/utils/constants";
import { PluginService } from "src/common/plugins/plugin.service";
import { NftMetadataService } from "src/queue.worker/nft.worker/queue/job-services/metadata/nft.metadata.service";
import { NftMediaService } from "src/queue.worker/nft.worker/queue/job-services/media/nft.media.service";
import { ElasticSortOrder } from "src/common/elastic/entities/elastic.sort.order";
import { NftMedia } from "./entities/nft.media";
import { CacheInfo } from "src/common/caching/entities/cache.info";
import { PersistenceInterface } from "src/common/persistence/persistence.interface";
import { RecordUtils } from "src/utils/record.utils";
import { EsdtSupply } from "../esdt/entities/esdt.supply";
import { EsdtDataSource } from "../esdt/entities/esdt.data.source";
import { EsdtAddressService } from "../esdt/esdt.address.service";

@Injectable()
export class NftService {
  private readonly logger: Logger;
  private readonly NFT_THUMBNAIL_PREFIX: string;
  private readonly DEFAULT_MEDIA: NftMedia[];

  constructor(
    private readonly apiConfigService: ApiConfigService,
    private readonly elasticService: ElasticService,
    private readonly esdtService: EsdtService,
    private readonly tokenAssetService: TokenAssetService,
    private readonly cachingService: CachingService,
    @Inject(forwardRef(() => PluginService))
    private readonly pluginService: PluginService,
    private readonly nftMetadataService: NftMetadataService,
    private readonly nftMediaService: NftMediaService,
    @Inject('PersistenceService')
    private readonly persistenceService: PersistenceInterface,
    @Inject(forwardRef(() => EsdtAddressService))
    private readonly esdtAddressService: EsdtAddressService,
  ) {
    this.logger = new Logger(NftService.name);
    this.NFT_THUMBNAIL_PREFIX = this.apiConfigService.getExternalMediaUrl() + '/nfts/asset';
    this.DEFAULT_MEDIA = [
      {
        url: 'https://media.elrond.com/nfts/thumbnail/default.png',
        originalUrl: 'https://media.elrond.com/nfts/thumbnail/default.png',
        thumbnailUrl: 'https://media.elrond.com/nfts/thumbnail/default.png',
        fileType: 'image/png',
        fileSize: 29512,
      },
    ];
  }

  buildElasticNftFilter(filter: NftFilter, identifier?: string, address?: string) {
    let elasticQuery = ElasticQuery.create()
      .withCondition(QueryConditionOptions.must, QueryType.Exists('identifier'));

    if (address) {
      elasticQuery = elasticQuery.withMustCondition(QueryType.Match('address', address));
    }

    if (filter.search !== undefined) {
      elasticQuery = elasticQuery.withMustCondition(QueryType.Wildcard('token', `*${filter.search}*`));
    }

    if (filter.type !== undefined) {
      elasticQuery = elasticQuery.withMustCondition(QueryType.Match('type', filter.type));
    }

    if (identifier !== undefined) {
      elasticQuery = elasticQuery.withMustCondition(QueryType.Match('identifier', identifier, QueryOperator.AND));
    }

    if (filter.collection !== undefined && filter.collection !== '') {
      elasticQuery = elasticQuery.withMustCondition(QueryType.Match('token', filter.collection, QueryOperator.AND));
    }

    if (filter.collections !== undefined && filter.collections.length !== 0) {
      elasticQuery = elasticQuery.withMustCondition(QueryType.Should(filter.collections.map(collection => QueryType.Match('token', collection, QueryOperator.AND))));
    }

    if (filter.name !== undefined && filter.name !== '') {
      elasticQuery = elasticQuery.withMustCondition(QueryType.Nested('data', { "data.name": filter.name }));
    }

    if (filter.hasUris !== undefined) {
      elasticQuery = elasticQuery.withMustCondition(QueryType.Nested('data', { "data.nonEmptyURIs": filter.hasUris }));
    }

    if (filter.tags) {
      elasticQuery = elasticQuery.withMustCondition(QueryType.Should(filter.tags.map(tag => QueryType.Nested("data", { "data.tags": tag }))));
    }

    if (filter.creator !== undefined) {
      elasticQuery = elasticQuery.withMustCondition(QueryType.Nested("data", { "data.creator": filter.creator }));
    }

    if (filter.identifiers) {
      elasticQuery = elasticQuery.withMustCondition(QueryType.Should(filter.identifiers.map(identifier => QueryType.Match('identifier', identifier, QueryOperator.AND))));
    }

    if (filter.isWhitelistedStorage !== undefined && this.apiConfigService.getIsIndexerV3FlagActive()) {
      elasticQuery = elasticQuery.withMustCondition(QueryType.Nested("data", { "data.whiteListedStorage": filter.isWhitelistedStorage }));
    }

    if (filter.before || filter.after) {
      elasticQuery = elasticQuery.withFilter([QueryType.Range('timestamp', filter.before ?? Date.now(), filter.after ?? 0)]);
    }

    return elasticQuery;
  }

  async getNfts(queryPagination: QueryPagination, filter: NftFilter, queryOptions?: NftQueryOptions): Promise<Nft[]> {
    const { from, size } = queryPagination;

    const nfts = await this.getNftsInternal(from, size, filter);

    for (const nft of nfts) {
      await this.applyAssetsAndTicker(nft);
    }

    if (queryOptions && queryOptions.withOwner) {
      const nonFungibleNftIdentifiers = nfts.filter(x => x.type === NftType.NonFungibleESDT).map(x => x.identifier);

      const accountsEsdts = await this.elasticService.getAccountEsdtByIdentifiers(nonFungibleNftIdentifiers);

      for (const nft of nfts) {
        if (nft.type === NftType.NonFungibleESDT) {
          const accountEsdt = accountsEsdts.find((accountEsdt: any) => accountEsdt.identifier == nft.identifier);
          if (accountEsdt) {
            nft.owner = accountEsdt.address;
          }
        }
      }
    }

    if (queryOptions && queryOptions.withSupply) {
      await this.batchApplySupply(nfts);
    }

    await this.batchProcessNfts(nfts);

    return nfts;
  }

  private async batchProcessNfts(nfts: Nft[]) {
    await Promise.all([
      this.batchApplyMedia(nfts),
      this.batchApplyMetadata(nfts),
    ]);

    await this.pluginService.batchProcessNfts(nfts);
  }

  private async applyNftOwner(nft: Nft): Promise<void> {
    if (nft.type === NftType.NonFungibleESDT) {
      const accountsEsdt = await this.elasticService.getAccountEsdtByIdentifier(nft.identifier);
      if (accountsEsdt.length > 0) {
        nft.owner = accountsEsdt[0].address;
      }
    }
  }

  private async batchApplySupply(nfts: Nft[]) {
    await this.cachingService.batchApply(
      nfts,
      nft => CacheInfo.TokenLockedSupply(nft.identifier).key,
      async nfts => {
        const result: Record<string, EsdtSupply> = {};

        for (const nft of nfts) {
          result[nft.identifier] = await this.esdtService.getTokenSupply(nft.identifier);
        }

        return RecordUtils.mapKeys(result, identifier => CacheInfo.TokenLockedSupply(identifier).key);
      },
      (nft, value) => nft.supply = value.totalSupply,
      CacheInfo.TokenLockedSupply('').ttl,
    );
  }

  private async batchApplyMedia(nfts: Nft[]) {
    await this.cachingService.batchApply(
      nfts,
      nft => CacheInfo.NftMedia(nft.identifier).key,
      async nfts => {
        const getMediaResults = await this.persistenceService.batchGetMedia(nfts.map(x => x.identifier));

        return RecordUtils.mapKeys(getMediaResults, identifier => CacheInfo.NftMedia(identifier).key);
      },
      (nft, media) => nft.media = media,
      CacheInfo.NftMedia('').ttl,
    );

    for (const nft of nfts) {
      if (!TokenUtils.hasMedia(nft)) {
        nft.media = this.DEFAULT_MEDIA;
      }
    }
  }

  private async batchApplyMetadata(nfts: Nft[]) {
    await this.cachingService.batchApply(
      nfts,
      nft => CacheInfo.NftMetadata(nft.identifier).key,
      async nfts => {
        const getMetadataResults = await this.persistenceService.batchGetMetadata(nfts.map(x => x.identifier));

        return RecordUtils.mapKeys(getMetadataResults, identifier => CacheInfo.NftMetadata(identifier).key);
      },
      (nft, metadata) => nft.metadata = metadata,
      CacheInfo.NftMetadata('').ttl
    );
  }

  private async processNft(nft: Nft) {
    await Promise.all([
      this.applyMedia(nft),
      this.applyMetadata(nft),
      this.pluginService.processNft(nft),
    ]);

    if (!TokenUtils.hasMedia(nft)) {
      nft.media = this.DEFAULT_MEDIA;
    }
  }

  async applyAssetsAndTicker(token: Nft) {
    token.assets = await this.tokenAssetService.getAssets(token.collection);

    if (token.assets) {
      token.ticker = token.collection.split('-')[0];
    } else {
      token.ticker = token.collection;
    }
  }

  async getSingleNft(identifier: string): Promise<Nft | undefined> {
    const nfts = await this.getNftsInternal(0, 1, new NftFilter(), identifier);
    if (nfts.length === 0) {
      return undefined;
    }

    const nft: Nft = ApiUtils.mergeObjects(new Nft(), nfts[0]);

    if (nft.identifier.toLowerCase() !== identifier.toLowerCase()) {
      return undefined;
    }

    await this.applySupply(nft);

    await this.applyNftOwner(nft);

    await this.applyAssetsAndTicker(nft);

    await this.processNft(nft);

    return nft;
  }

  private async applyMedia(nft: Nft) {
    nft.media = await this.nftMediaService.getMedia(nft) ?? undefined;
  }

  private async applyMetadata(nft: Nft) {
    nft.metadata = await this.nftMetadataService.getMetadata(nft) ?? undefined;
  }

  async getNftOwners(identifier: string, pagination: QueryPagination): Promise<NftOwner[] | undefined> {
    const accountsEsdt = await this.elasticService.getAccountEsdtByIdentifier(identifier, pagination);

    return accountsEsdt.map((esdt: any) => {
      const owner = new NftOwner();
      owner.address = esdt.address;
      owner.balance = esdt.balance;

      return owner;
    });
  }

  async getNftsInternal(from: number, size: number, filter: NftFilter, identifier?: string): Promise<Nft[]> {
    const elasticQuery = this.buildElasticNftFilter(filter, identifier);
    elasticQuery
      .withPagination({ from, size })
      .withSort([{ name: 'timestamp', order: ElasticSortOrder.descending }]);

    const elasticNfts = await this.elasticService.getList('tokens', 'identifier', elasticQuery);

    const nfts: Nft[] = [];

    for (const elasticNft of elasticNfts) {
      const nft = new Nft();
      nft.identifier = elasticNft.identifier;
      nft.collection = elasticNft.token;
      nft.nonce = parseInt('0x' + nft.identifier.split('-')[2]);
      nft.timestamp = elasticNft.timestamp;

      const elasticNftData = elasticNft.data;
      if (elasticNftData) {
        nft.name = elasticNftData.name;
        nft.creator = elasticNftData.creator;
        nft.royalties = elasticNftData.royalties / 100; // 10.000 => 100%
        nft.attributes = elasticNftData.attributes;

        if (elasticNftData.uris) {
          nft.uris = elasticNftData.uris;
        }

        if (elasticNftData.tags) {
          nft.tags = elasticNftData.tags;
        }

        if (nft.uris && nft.uris.length > 0) {
          try {
            nft.url = TokenUtils.computeNftUri(BinaryUtils.base64Decode(nft.uris[0]), this.NFT_THUMBNAIL_PREFIX);
          } catch (error) {
            this.logger.error(error);
          }
        }

        if (this.apiConfigService.getIsIndexerV3FlagActive()) {
          nft.isWhitelistedStorage = elasticNft.data.whiteListedStorage;
        } else {
          nft.isWhitelistedStorage = nft.url.startsWith(this.NFT_THUMBNAIL_PREFIX);
        }

        if (elasticNftData.metadata) {
          nft.attributes = BinaryUtils.base64Encode(`metadata:${elasticNftData.metadata}`);
        }
      }

      nfts.push(nft);
    }

    for (const nft of nfts) {
      const collectionProperties = await this.esdtService.getEsdtTokenProperties(nft.collection);

      if (collectionProperties) {
        if (!nft.name) {
          nft.name = collectionProperties.name;
        }

        // @ts-ignore
        nft.type = collectionProperties.type;

        if (nft.type === NftType.MetaESDT) {
          nft.decimals = collectionProperties.decimals;
          // @ts-ignore
          delete nft.royalties;
          // @ts-ignore
          delete nft.uris;
        }
      }
    }

    return nfts;
  }

  async getNftOwnersCount(identifier: string): Promise<number> {
    return await this.cachingService.getOrSetCache(
      `nftOwnerCount:${identifier}`,
      async () => await this.getNftOwnersCountRaw(identifier),
      Constants.oneMinute()
    );
  }

  async getNftOwnersCountRaw(identifier: string): Promise<number> {
    const elasticQuery = ElasticQuery.create()
      .withCondition(QueryConditionOptions.mustNot, [QueryType.Match('address', 'pending')])
      .withCondition(QueryConditionOptions.must, [QueryType.Match('identifier', identifier, QueryOperator.AND)]);

    return await this.elasticService.getCount('accountsesdt', elasticQuery);
  }

  async getNftCount(filter: NftFilter): Promise<number> {
    const elasticQuery = this.buildElasticNftFilter(filter);

    return await this.elasticService.getCount('tokens', elasticQuery);
  }

  async getNftsForAddress(address: string, queryPagination: QueryPagination, filter: NftFilter, queryOptions?: NftQueryOptions, source?: EsdtDataSource): Promise<NftAccount[]> {
    const nfts = await this.esdtAddressService.getEsdtsForAddress(address, filter, queryPagination, source);

    for (const nft of nfts) {
      await this.applyAssetsAndTicker(nft);
    }

    if (queryOptions && queryOptions.withSupply) {
      await this.batchApplySupply(nfts);
    }

    await this.batchProcessNfts(nfts);

    return nfts;
  }

  async getNftCountForAddress(address: string, filter: NftFilter): Promise<number> {
    const count = await this.esdtAddressService.getEsdtsCountForAddressFromElastic(address, filter);

    return count;
  }

  async getNftForAddress(address: string, identifier: string): Promise<NftAccount | undefined> {
    const filter = new NftFilter();
    filter.identifiers = [identifier];

    const nfts = await this.esdtAddressService.getEsdtsForAddress(address, filter, { from: 0, size: 1 });
    if (nfts.length === 0) {
      return undefined;
    }

    const nft = nfts[0];

    if (nft.type === NftType.SemiFungibleESDT) {
      await this.applySupply(nft);
    }

    nft.assets = await this.tokenAssetService.getAssets(nft.collection);

    await this.processNft(nft);

    return nft;
  }

  async applySupply(nft: Nft): Promise<void> {
    const { totalSupply } = await this.esdtService.getTokenSupply(nft.identifier);

    nft.supply = totalSupply;
  }

  async getNftSupply(identifier: string): Promise<string | undefined> {
    if (identifier.split('-').length !== 3) {
      return undefined;
    }

    const nfts = await this.getNftsInternal(0, 1, new NftFilter(), identifier);
    if (nfts.length === 0) {
      return undefined;
    }

    const supply = await this.esdtService.getTokenSupply(identifier);

    return supply.totalSupply;
  }
}
