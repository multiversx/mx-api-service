import { BadRequestException, forwardRef, Inject, Injectable } from "@nestjs/common";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { QueryPagination } from "src/common/entities/query.pagination";
import { GatewayComponentRequest } from "src/common/gateway/entities/gateway.component.request";
import { GatewayService } from "src/common/gateway/gateway.service";
import { ProtocolService } from "src/common/protocol/protocol.service";
import { TokenHelpers } from "src/utils/token.helpers";
import { EsdtDataSource } from "./entities/esdt.data.source";
import { EsdtService } from "./esdt.service";
import { GatewayNft } from "../nfts/entities/gateway.nft";
import { NftAccount } from "../nfts/entities/nft.account";
import { NftFilter } from "../nfts/entities/nft.filter";
import { NftType } from "../nfts/entities/nft.type";
import { NftExtendedAttributesService } from "../nfts/nft.extendedattributes.service";
import { NftCollectionWithRoles } from "../collections/entities/nft.collection.with.roles";
import { CollectionService } from "../collections/collection.service";
import { CollectionFilter } from "../collections/entities/collection.filter";
import { CollectionRoles } from "../tokens/entities/collection.roles";
import { AddressUtils, ApiUtils, BinaryUtils, CachingService, MetricsService } from "@elrondnetwork/erdnest";
import { IndexerService } from "src/common/indexer/indexer.service";
import { OriginLogger } from "@elrondnetwork/erdnest";

@Injectable()
export class EsdtAddressService {
  private readonly logger = new OriginLogger(EsdtAddressService.name);
  private readonly NFT_THUMBNAIL_PREFIX: string;

  constructor(
    private readonly apiConfigService: ApiConfigService,
    private readonly esdtService: EsdtService,
    private readonly indexerService: IndexerService,
    private readonly gatewayService: GatewayService,
    private readonly cachingService: CachingService,
    private readonly metricsService: MetricsService,
    private readonly protocolService: ProtocolService,
    private readonly nftExtendedAttributesService: NftExtendedAttributesService,
    @Inject(forwardRef(() => CollectionService))
    private readonly collectionService: CollectionService,
  ) {
    this.NFT_THUMBNAIL_PREFIX = this.apiConfigService.getExternalMediaUrl() + '/nfts/asset';
  }

  async getNftsForAddress(address: string, filter: NftFilter, pagination: QueryPagination, source?: EsdtDataSource): Promise<NftAccount[]> {
    if (filter.identifiers && filter.identifiers.length === 1) {
      return await this.getNftsForAddressFromGateway(address, filter, pagination);
    }

    if (source === EsdtDataSource.elastic || AddressUtils.isSmartContractAddress(address)) {
      return await this.getNftsForAddressFromElastic(address, filter, pagination);
    }

    return await this.getNftsForAddressFromGateway(address, filter, pagination);
  }

  async getNftCountForAddressFromElastic(address: string, filter: NftFilter): Promise<number> {
    return await this.indexerService.getNftCountForAddress(address, filter);
  }

  async getCollectionCountForAddressFromElastic(address: string, filter: CollectionFilter): Promise<number> {
    return await this.indexerService.getCollectionCountForAddress(address, filter);
  }

  private async getNftsForAddressFromElastic(address: string, filter: NftFilter, pagination: QueryPagination): Promise<NftAccount[]> {
    const esdts = await this.indexerService.getNftsForAddress(address, filter, pagination) as any;

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
        nft.timestamp = esdt.timestamp;
      }

      gatewayNfts.push(nft);
    }

    const nfts: GatewayNft[] = Object.values(gatewayNfts).map(x => x as any).filter(x => x.tokenIdentifier.split('-').length === 3);

    const nftAccounts: NftAccount[] = await this.mapToNftAccount(nfts);

    return nftAccounts;
  }

  async getCollectionsForAddress(address: string, filter: CollectionFilter, pagination: QueryPagination): Promise<NftCollectionWithRoles[]> {
    if (!this.apiConfigService.getIsIndexerV3FlagActive() && (filter.canCreate !== undefined || filter.canBurn !== undefined || filter.canAddQuantity !== undefined || filter.canUpdateAttributes !== undefined || filter.canAddUri !== undefined || filter.canTransferRole !== undefined)) {
      throw new BadRequestException('canCreate / canBurn / canAddQuantity / canUpdateAttributes / canAddUri / canTransferRole filter not supported when fetching account collections from elastic');
    }

    const tokenCollections = await this.indexerService.getNftCollections(pagination, filter, address);
    const collectionsIdentifiers = tokenCollections.map((collection) => collection.token);

    const indexedCollections: Record<string, any> = {};
    for (const collection of tokenCollections) {
      indexedCollections[collection.token] = collection;
    }

    const accountCollections = await this.collectionService.applyPropertiesToCollections(collectionsIdentifiers);

    const collectionsWithRoles: NftCollectionWithRoles[] = [];

    for (const accountCollection of accountCollections) {
      const indexedCollection = indexedCollections[accountCollection.collection];
      if (indexedCollection) {
        accountCollection.timestamp = indexedCollection.timestamp;

        const collectionWithRoles = ApiUtils.mergeObjects(new NftCollectionWithRoles(), accountCollection);

        if (indexedCollection.roles) {
          if (!indexedCollection.roles['ESDTTransferRole']) {
            collectionWithRoles.canTransfer = true;
          }

          const addressRoles: CollectionRoles = new CollectionRoles();
          if (collectionWithRoles.canTransfer === false) {
            addressRoles.canTransfer = false;
          }

          for (const role of Object.keys(indexedCollection.roles)) {
            const addresses = indexedCollection.roles[role].distinct();
            if (addresses.includes(address)) {
              TokenHelpers.setCollectionRole(addressRoles, role);
            }
          }

          collectionWithRoles.roles = addressRoles;

          // temporary, until we enforce deprecation for roles on the root element
          const clonedRoles = new CollectionRoles(collectionWithRoles.roles);
          // @ts-ignore
          delete clonedRoles.roles;
          delete clonedRoles.canTransfer;

          Object.assign(collectionWithRoles, clonedRoles);

          collectionsWithRoles.push(collectionWithRoles);
        }
      }
    }

    if (this.apiConfigService.getIsIndexerV3FlagActive()) {
      for (const collection of collectionsWithRoles) {
        if (collection.type === NftType.NonFungibleESDT) {
          //@ts-ignore
          delete collection.canAddQuantity;
        }

        if (collection.timestamp === 0) {
          // @ts-ignore
          delete accountCollection.timestamp;
        }
      }

      return collectionsWithRoles;
    } else {
      await this.applyRolesToAccountCollections(address, collectionsWithRoles);
    }

    return collectionsWithRoles;
  }

  private async applyRolesToAccountCollections(address: string, collections: NftCollectionWithRoles[]): Promise<void> {
    const rolesResult = await this.gatewayService.get(`address/${address}/esdts/roles`, GatewayComponentRequest.addressEsdtAllRoles);
    const roles = rolesResult.roles;

    for (const collection of collections) {
      const role = roles[collection.collection];
      collection.roles.canCreate = role ? role.includes('ESDTRoleNFTCreate') : false;
      collection.roles.canBurn = role ? role.includes('ESDTRoleNFTBurn') : false;
      collection.roles.canUpdateAttributes = role ? role.includes('ESDTRoleNFTUpdateAttributes') : false;
      collection.roles.canAddUri = role ? role.includes('ESDTRoleNFTAddURI') : false;
      collection.roles.canTransfer = role ? role.includes('ESDTTransferRole') : false;

      if (collection.type === NftType.SemiFungibleESDT) {
        collection.roles.canAddQuantity = role ? role.includes('ESDTRoleNFTAddQuantity') : false;
      }

      if (collection.timestamp === 0) {
        // @ts-ignore
        delete collection.timestamp;
      }
    }
  }

  private async getNftsForAddressFromGateway(address: string, filter: NftFilter, pagination: QueryPagination): Promise<NftAccount[]> {
    let esdts: Record<string, any> = {};

    if (filter.identifiers && filter.identifiers.length === 1) {
      const identifier = filter.identifiers[0];
      const collection = identifier.split('-').slice(0, 2).join('-');
      const nonceHex = identifier.split('-')[2];
      const nonceNumeric = BinaryUtils.hexToNumber(nonceHex);

      let result: any;
      try {
        result = await this.gatewayService.get(`address/${address}/nft/${collection}/nonce/${nonceNumeric}`, GatewayComponentRequest.addressNftByNonce);
      } catch (error: any) {
        if (error.response.error.includes('account was not found')) {
          return [];
        }

        throw error;
      }

      if (!result || !result.tokenData || result.tokenData.balance === '0') {
        return [];
      }

      result.tokenData.tokenIdentifier = identifier;

      esdts[identifier] = result.tokenData;
    } else {
      esdts = await this.getAllEsdtsForAddressFromGateway(address);
    }

    const nfts: GatewayNft[] = Object.values(esdts).map(x => x as any).filter(x => x.tokenIdentifier.split('-').length === 3);

    const collator = new Intl.Collator('en', { sensitivity: 'base' });
    nfts.sort((a: GatewayNft, b: GatewayNft) => collator.compare(a.tokenIdentifier, b.tokenIdentifier));

    const nftAccounts: NftAccount[] = await this.mapToNftAccount(nfts);

    return this.filterEsdtsForAddressFromGateway(filter, pagination, nftAccounts);
  }

  private async mapToNftAccount(nfts: GatewayNft[]): Promise<NftAccount[]> {
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
          nft.url = TokenHelpers.computeNftUri(BinaryUtils.base64Decode(nft.uris[0]), this.NFT_THUMBNAIL_PREFIX);
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
      const types = (filter.type ?? '').split(',');

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

    if (filter.excludeMetaESDT === true) {
      nfts = nfts.filter(x => x.type.in(NftType.NonFungibleESDT, NftType.SemiFungibleESDT));
    }

    const { from, size } = pagination;

    nfts = nfts.slice(from, from + size);

    return nfts;
  }
}
