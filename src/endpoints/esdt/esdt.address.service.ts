import { forwardRef, Inject, Injectable, Logger } from "@nestjs/common";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { CachingService } from "src/common/caching/caching.service";
import { ElasticService } from "src/common/elastic/elastic.service";
import { QueryPagination } from "src/common/entities/query.pagination";
import { GatewayComponentRequest } from "src/common/gateway/entities/gateway.component.request";
import { GatewayService } from "src/common/gateway/gateway.service";
import { MetricsService } from "src/common/metrics/metrics.service";
import { ProtocolService } from "src/common/protocol/protocol.service";
import { BinaryUtils } from "src/utils/binary.utils";
import { TokenUtils } from "src/utils/token.utils";
import { EsdtDataSource } from "./entities/esdt.data.source";
import { EsdtService } from "./esdt.service";
import { GatewayNft } from "../nfts/entities/gateway.nft";
import { NftAccount } from "../nfts/entities/nft.account";
import { NftFilter } from "../nfts/entities/nft.filter";
import { NftType } from "../nfts/entities/nft.type";
import { NftExtendedAttributesService } from "../nfts/nft.extendedattributes.service";
import { NftService } from "../nfts/nft.service";
import { ElasticSortOrder } from "src/common/elastic/entities/elastic.sort.order";

@Injectable()
export class EsdtAddressService {
  private readonly logger: Logger;
  private readonly NFT_THUMBNAIL_PREFIX: string;

  constructor(
    private readonly apiConfigService: ApiConfigService,
    private readonly esdtService: EsdtService,
    private readonly elasticService: ElasticService,
    private readonly gatewayService: GatewayService,
    private readonly cachingService: CachingService,
    private readonly metricsService: MetricsService,
    private readonly protocolService: ProtocolService,
    private readonly nftExtendedAttributesService: NftExtendedAttributesService,
    @Inject(forwardRef(() => NftService))
    private readonly nftService: NftService,
  ) {
    this.logger = new Logger(EsdtAddressService.name);
    this.NFT_THUMBNAIL_PREFIX = this.apiConfigService.getExternalMediaUrl() + '/nfts/asset';
  }

  async getEsdtsForAddress(address: string, filter: NftFilter, pagination: QueryPagination, source?: EsdtDataSource): Promise<NftAccount[]> {
    if (source === EsdtDataSource.elastic && this.apiConfigService.getIsIndexerV3FlagActive()) {
      return await this.getEsdtsForAddressFromElastic(address, filter, pagination);
    }

    return await this.getEsdtsForAddressFromGateway(address, filter, pagination);
  }

  async getEsdtsCountForAddressFromElastic(address: string, filter: NftFilter): Promise<number> {
    const elasticQuery = this.nftService.buildElasticNftFilter(filter, undefined, address);

    return await this.elasticService.getCount('accountsesdt', elasticQuery);
  }


  private async getEsdtsForAddressFromElastic(address: string, filter: NftFilter, pagination: QueryPagination): Promise<NftAccount[]> {
    let elasticQuery = this.nftService.buildElasticNftFilter(filter, undefined, address);
    elasticQuery = elasticQuery
      .withSort([{ name: "timestamp", order: ElasticSortOrder.descending }])
      .withPagination(pagination);

    const esdts = await this.elasticService.getList('accountsesdt', 'identifier', elasticQuery);

    const gatewayNfts: GatewayNft[] = [];

    for (const esdt of esdts) {
      const isToken = esdt.tokenNonce === undefined;
      const gatewayNft = new GatewayNft();
      if (isToken) {
        gatewayNft.balance = esdt.balance;
        gatewayNft.tokenIdentifier = esdt.token;
      } else {
        gatewayNft.attributes = esdt.data?.attributes;
        gatewayNft.balance = esdt.balance;
        gatewayNft.creator = esdt.data?.creator;
        gatewayNft.name = esdt.data?.name;
        gatewayNft.nonce = esdt.tokenNonce;
        gatewayNft.royalties = esdt.data?.royalties;
        gatewayNft.tokenIdentifier = esdt.identifier;
        gatewayNft.uris = esdt.data?.uris;
      }

      gatewayNfts.push(gatewayNft);
    }

    const mapped: GatewayNft[] = Object.values(gatewayNfts).map(x => x as any).filter(x => x.tokenIdentifier.split('-').length === 3);

    const nftAccounts: NftAccount[] = await this.mapToNftAccount(mapped);

    return nftAccounts;
  }

  private async getEsdtsForAddressFromGateway(address: string, filter: NftFilter, pagination: QueryPagination): Promise<NftAccount[]> {
    const esdts = await this.getAllEsdtsForAddressFromGateway(address);

    const mapped: GatewayNft[] = Object.values(esdts).map(x => x as any).filter(x => x.tokenIdentifier.split('-').length === 3);

    const nftAccounts: NftAccount[] = await this.mapToNftAccount(mapped);

    return this.filterEsdtsForAddressFromGateway(filter, pagination, nftAccounts);
  }

  private async mapToNftAccount(nfts: GatewayNft[]): Promise<NftAccount[]> {
    nfts.sort((a: GatewayNft, b: GatewayNft) => a.tokenIdentifier.localeCompare(b.tokenIdentifier, 'en', { sensitivity: 'base' }));

    const nftAccounts: NftAccount[] = [];

    for (const dataSourceNft of nfts) {
      const nft = new NftAccount();
      nft.identifier = dataSourceNft.tokenIdentifier;
      nft.collection = dataSourceNft.tokenIdentifier.split('-').slice(0, 2).join('-');
      nft.nonce = dataSourceNft.nonce;
      nft.creator = dataSourceNft.creator;
      nft.royalties = Number(dataSourceNft.royalties) / 100; // 10.000 => 100%
      nft.uris = dataSourceNft.uris ? dataSourceNft.uris.filter((x: any) => x) : [];
      nft.name = dataSourceNft.name;
      nft.timestamp = dataSourceNft.timestamp;

      if (nft.uris && nft.uris.length > 0) {
        try {
          nft.url = TokenUtils.computeNftUri(BinaryUtils.base64Decode(nft.uris[0]), this.NFT_THUMBNAIL_PREFIX);
        } catch (error) {
          this.logger.error(error);
        }
      }

      nft.isWhitelistedStorage = nft.url.startsWith(this.NFT_THUMBNAIL_PREFIX);

      nft.attributes = dataSourceNft.attributes;

      if (dataSourceNft.attributes) {
        nft.tags = this.nftExtendedAttributesService.getTags(dataSourceNft.attributes);
      }

      const collectionDetails = await this.esdtService.getEsdtTokenProperties(nft.collection);
      if (collectionDetails) {
        // @ts-ignore
        nft.type = collectionDetails.type;

        if (nft.type === NftType.MetaESDT) {
          nft.decimals = collectionDetails.decimals;
          // @ts-ignore
          delete nft.royalties;
          // @ts-ignore
          delete nft.uris;
        }

        if (!nft.name) {
          nft.name = collectionDetails.name;
        }
      }

      if ([NftType.SemiFungibleESDT, NftType.MetaESDT].includes(nft.type)) {
        nft.balance = dataSourceNft.balance;
      }

      nftAccounts.push(nft);
    }

    return nftAccounts;
  }

  private async getAllEsdtsForAddressFromGatewayRaw(address: string): Promise<{ [key: string]: any }> {
    // eslint-disable-next-line require-await
    const esdtResult = await this.gatewayService.get(`address/${address}/esdt`, GatewayComponentRequest.addressEsdt, async (error) => {
      const errorMessage = error?.response?.data?.error;
      if (errorMessage && errorMessage.includes('account was not found')) {
        return true;
      }

      return false;
    });

    if (!esdtResult) {
      return {};
    }

    return esdtResult.esdts;
  }

  private pendingRequestsDictionary: { [key: string]: any; } = {};

  async getAllEsdtsForAddressFromGateway(address: string): Promise<{ [key: string]: any }> {
    let pendingRequest = this.pendingRequestsDictionary[address];
    if (pendingRequest) {
      const result = await pendingRequest;
      this.metricsService.incrementPendingApiHit('Gateway.AccountEsdts');
      return result;
    }

    const cachedValue = await this.cachingService.getCacheLocal<{ [key: string]: any }>(`address:${address}:esdts`);

    if (cachedValue) {
      this.metricsService.incrementCachedApiHit('Gateway.AccountEsdts');
      return cachedValue;
    }

    pendingRequest = this.getAllEsdtsForAddressFromGatewayRaw(address);
    this.pendingRequestsDictionary[address] = pendingRequest;

    let esdts: { [key: string]: any };
    try {
      esdts = await pendingRequest;
    } finally {
      delete this.pendingRequestsDictionary[address];
    }

    const ttl = await this.protocolService.getSecondsRemainingUntilNextRound();

    await this.cachingService.setCacheLocal(`address:${address}:esdts`, esdts, ttl);

    return esdts;
  }

  private filterEsdtsForAddressFromGateway(filter: NftFilter, pagination: QueryPagination, nfts: NftAccount[]): NftAccount[] {
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();

      nfts = nfts.filter(x => x.name.toLowerCase().includes(searchLower) || x.identifier.toLowerCase().includes(searchLower));
    }

    if (filter.identifiers) {
      nfts = nfts.filter(x => filter.identifiers?.includes(x.identifier));
    }

    if (filter.type) {
      const types = filter.type;

      nfts = nfts.filter(x => types.includes(x.type));
    }

    if (filter.collection) {
      nfts = nfts.filter(x => x.collection === filter.collection);
    }

    if (filter.name) {
      const searchedNameLower = filter.name.toLowerCase();

      nfts = nfts.filter(x => x.name.toLowerCase().includes(searchedNameLower));
    }

    if (filter.collections) {
      const collectionsArray = filter.collections;
      nfts = nfts.filter(x => collectionsArray.includes(x.collection));
    }

    if (filter.tags) {
      const tagsArray = filter.tags;
      nfts = nfts.filter(nft => tagsArray.filter(tag => nft.tags.includes(tag)).length === tagsArray.length);
    }

    if (filter.creator) {
      nfts = nfts.filter(x => x.creator === filter.creator);
    }

    if (filter.hasUris === true) {
      nfts = nfts.filter(x => x.uris && x.uris.length > 0);
    } else if (filter.hasUris === false) {
      nfts = nfts.filter(x => x.uris && x.uris.length === 0);
    }

    if (filter.includeFlagged !== true) {
      nfts = nfts.filter(x => !x.scamInfo);
    }

    const { from, size } = pagination;

    if (nfts.length > from + size) {
      nfts = nfts.slice(from, from + size);
    }

    return nfts;
  }
}
