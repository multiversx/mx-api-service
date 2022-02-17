import { BadRequestException, forwardRef, Inject, Injectable, Logger } from "@nestjs/common";
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
import { CollectionAccountFilter } from "../collections/entities/collection.account.filter";
import { NftCollectionAccount } from "../collections/entities/nft.collection.account";
import { CollectionService } from "../collections/collection.service";
import { NftCollection } from "../collections/entities/nft.collection";

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
    @Inject(forwardRef(() => CollectionService))
    private readonly collectionService: CollectionService,
  ) {
    this.logger = new Logger(EsdtAddressService.name);
    this.NFT_THUMBNAIL_PREFIX = this.apiConfigService.getExternalMediaUrl() + '/nfts/asset';
  }

  async getEsdtsForAddress(address: string, filter: NftFilter, pagination: QueryPagination, source?: EsdtDataSource): Promise<NftAccount[]> {
    if (source === EsdtDataSource.elastic) {
      return await this.getEsdtsForAddressFromElastic(address, filter, pagination);
    }

    return await this.getEsdtsForAddressFromGateway(address, filter, pagination);
  }

  async getEsdtCollectionsForAddress(address: string, filter: CollectionAccountFilter, pagination: QueryPagination, source?: EsdtDataSource): Promise<NftCollectionAccount[]> {
    if (source === EsdtDataSource.elastic) {
      return await this.getEsdtCollectionsForAddressFromElastic(address, filter, pagination);
    }

    return await this.getEsdtCollectionsForAddressFromGateway(address, filter, pagination);
  }

  async getEsdtsCountForAddressFromElastic(address: string, filter: NftFilter): Promise<number> {
    const elasticQuery = this.nftService.buildElasticNftFilter(filter, undefined, address);

    return await this.elasticService.getCount('accountsesdt', elasticQuery);
  }

  async getEsdtCollectionsCountForAddressFromElastic(address: string, filter: CollectionAccountFilter): Promise<number> {
    const elasticQuery = this.collectionService.buildCollectionFilter(filter, address);

    return await this.elasticService.getCount('tokens', elasticQuery);
  }

  private async getEsdtsForAddressFromElastic(address: string, filter: NftFilter, pagination: QueryPagination): Promise<NftAccount[]> {
    let elasticQuery = this.nftService.buildElasticNftFilter(filter, undefined, address)
      .withPagination(pagination);

    if (this.apiConfigService.getIsIndexerV3FlagActive()) {
      elasticQuery = elasticQuery.withSort([{ name: "timestamp", order: ElasticSortOrder.descending }]);
    }

    const esdts = await this.elasticService.getList('accountsesdt', 'identifier', elasticQuery);

    const gatewayNfts: GatewayNft[] = [];

    for (const esdt of esdts) {
      const isToken = esdt.tokenNonce === undefined;
      const nft = new GatewayNft();
      if (isToken) {
        nft.balance = esdt.balance;
        nft.tokenIdentifier = esdt.token;
      } else {
        nft.attributes = esdt.data?.attributes;
        nft.balance = esdt.balance;
        nft.creator = esdt.data?.creator;
        nft.name = esdt.data?.name;
        nft.nonce = esdt.tokenNonce;
        nft.royalties = esdt.data?.royalties;
        nft.tokenIdentifier = esdt.identifier;
        nft.uris = esdt.data?.uris;
        nft.timestamp = esdt.data?.timestamp;
      }

      gatewayNfts.push(nft);
    }

    const nfts: GatewayNft[] = Object.values(gatewayNfts).map(x => x as any).filter(x => x.tokenIdentifier.split('-').length === 3);

    const nftAccounts: NftAccount[] = await this.mapToNftAccount(nfts);

    return nftAccounts;
  }

  private async getEsdtCollectionsForAddressFromGateway(address: string, filter: CollectionAccountFilter, pagination: QueryPagination): Promise<NftCollectionAccount[]> {
    const esdtResult = await this.gatewayService.get(`address/${address}/registered-nfts`, GatewayComponentRequest.addressNfts);

    let collectionsIdentifiers = esdtResult.tokens;
    if (collectionsIdentifiers.length === 0) {
      return [];
    }

    if (filter.collection) {
      if (!collectionsIdentifiers.includes(filter.collection)) {
        return [];
      }

      collectionsIdentifiers = [filter.collection];
    }

    const accountCollections: NftCollection[] = await this.collectionService.applyPropertiesToCollections(collectionsIdentifiers);

    const accountCollectionsWithRoles: NftCollectionAccount[] = await this.applyRolesToAccountCollections(address, accountCollections);

    const filteredColections: NftCollectionAccount[] = this.filterEsdtCollectionsForAddress(accountCollectionsWithRoles, filter, pagination);

    return filteredColections;
  }

  private async getEsdtCollectionsForAddressFromElastic(address: string, filter: CollectionAccountFilter, pagination: QueryPagination): Promise<NftCollectionAccount[]> {
    if (filter.canCreate !== undefined || filter.canBurn !== undefined || filter.canAddQuantity !== undefined) {
      throw new BadRequestException('canCreate / canBurn / canAddQuantity filter not supported when fetching account collections from elastic');
    }

    const elasticQuery = this.collectionService.buildCollectionFilter(filter, address)
      .withSort([{ name: 'timestamp', order: ElasticSortOrder.descending }])
      .withPagination(pagination);

    const tokenCollections = await this.elasticService.getList('tokens', 'identifier', elasticQuery);
    const collectionsIdentifiers = tokenCollections.map((collection) => collection.token);

    const indexedCollections: Record<string, any> = {};
    for (const collection of tokenCollections) {
      indexedCollections[collection.token] = collection;
    }

    const accountCollections = await this.collectionService.applyPropertiesToCollections(collectionsIdentifiers);

    for (const accountCollection of accountCollections) {
      const indexedCollection = indexedCollections[accountCollection.collection];
      if (indexedCollection) {
        accountCollection.timestamp = indexedCollection.timestamp;
      }

      delete accountCollection.owner;
    }

    const accountCollectionsWithRoles: NftCollectionAccount[] = await this.applyRolesToAccountCollections(address, accountCollections);

    return accountCollectionsWithRoles;
  }

  private filterEsdtCollectionsForAddress(collections: NftCollectionAccount[], filter: CollectionAccountFilter, pagination: QueryPagination): NftCollectionAccount[] {
    if (filter.type !== undefined) {
      collections = collections.filter(x => x.type === filter.type);
    }

    if (filter.search !== undefined) {
      const searchLower = filter.search.toLowerCase();

      collections = collections.filter(x => x.name.toLowerCase().includes(searchLower) || x.collection.toLowerCase().includes(searchLower));
    }

    if (filter.owner !== undefined) {
      collections = collections.filter(x => x.owner === filter.owner);
    }

    if (filter.canCreate !== undefined) {
      collections = collections.filter(x => x.canCreate === filter.canCreate);
    }

    if (filter.canBurn !== undefined) {
      collections = collections.filter(x => x.canBurn === filter.canBurn);
    }

    if (filter.canAddQuantity !== undefined) {
      collections = collections.filter(x => x.canAddQuantity === filter.canAddQuantity);
    }

    collections = collections.slice(pagination.from, pagination.from + pagination.size);

    return collections;
  }

  private async applyRolesToAccountCollections(address: string, collections: NftCollection[]): Promise<NftCollectionAccount[]> {
    const rolesResult = await this.gatewayService.get(`address/${address}/esdts/roles`, GatewayComponentRequest.addressEsdtAllRoles);
    const roles = rolesResult.roles;

    const nftCollections: NftCollectionAccount[] = [];
    for (const collection of collections) {
      let accountCollection: NftCollectionAccount = new NftCollectionAccount();
      const role = roles[collection.collection];
      accountCollection.canCreate = role ? role.includes('ESDTRoleNFTCreate') : false;
      accountCollection.canBurn = role ? role.includes('ESDTRoleNFTBurn') : false;

      if (collection.type === NftType.SemiFungibleESDT) {
        accountCollection.canAddQuantity = role ? role.includes('ESDTRoleNFTAddQuantity') : false;
      }

      accountCollection = { ...accountCollection, ...collection };

      if (accountCollection.timestamp === 0) {
        // @ts-ignore
        delete accountCollection.timestamp;
      }

      // @ts-ignore
      delete accountCollection.owner;

      nftCollections.push(accountCollection);
    }

    return nftCollections;
  }

  private async getEsdtsForAddressFromGateway(address: string, filter: NftFilter, pagination: QueryPagination): Promise<NftAccount[]> {
    const esdts = await this.getAllEsdtsForAddressFromGateway(address);

    const nfts: GatewayNft[] = Object.values(esdts).map(x => x as any).filter(x => x.tokenIdentifier.split('-').length === 3);

    const nftAccounts: NftAccount[] = await this.mapToNftAccount(nfts);

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
