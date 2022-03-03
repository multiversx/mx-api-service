import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { ElasticService } from "src/common/elastic/elastic.service";
import { QueryPagination } from "src/common/entities/query.pagination";
import { GatewayService } from "src/common/gateway/gateway.service";
import { BinaryUtils } from "src/utils/binary.utils";
import { EsdtService } from "../esdt/esdt.service";
import { CollectionFilter } from "./entities/collection.filter";
import { NftCollection } from "./entities/nft.collection";
import { NftType } from "../nfts/entities/nft.type";
import { TokenAssetService } from "../tokens/token.asset.service";
import { VmQueryService } from "../vm.query/vm.query.service";
import { NftCollectionAccount } from "./entities/nft.collection.account";
import { GatewayComponentRequest } from "src/common/gateway/entities/gateway.component.request";
import { QueryType } from "src/common/elastic/entities/query.type";
import { QueryOperator } from "src/common/elastic/entities/query.operator";
import { ElasticQuery } from "src/common/elastic/entities/elastic.query";
import { ElasticSortOrder } from "src/common/elastic/entities/elastic.sort.order";
import { TokenProperties } from "../tokens/entities/token.properties";
import { CachingService } from "src/common/caching/caching.service";
import { CacheInfo } from "src/common/caching/entities/cache.info";
import { RecordUtils } from "src/utils/record.utils";
import { TokenAssets } from "../tokens/entities/token.assets";
import { EsdtAddressService } from "../esdt/esdt.address.service";
import { EsdtDataSource } from "../esdt/entities/esdt.data.source";
import { TokenAddressRoles } from "../tokens/entities/token.address.roles";

@Injectable()
export class CollectionService {
  constructor(
    private readonly gatewayService: GatewayService,
    private readonly apiConfigService: ApiConfigService,
    private readonly elasticService: ElasticService,
    private readonly esdtService: EsdtService,
    private readonly tokenAssetService: TokenAssetService,
    private readonly vmQueryService: VmQueryService,
    private readonly cachingService: CachingService,
    @Inject(forwardRef(() => EsdtAddressService))
    private readonly esdtAddressService: EsdtAddressService,
  ) { }

  buildCollectionFilter(filter: CollectionFilter, address?: string) {
    let elasticQuery = ElasticQuery.create();
    elasticQuery = elasticQuery.withMustNotCondition(QueryType.Exists('identifier'));

    if (address) {
      if (this.apiConfigService.getIsIndexerV3FlagActive()) {
        elasticQuery = elasticQuery.withMustCondition(QueryType.Should(
          [
            QueryType.Match('currentOwner', address),
            QueryType.Nested('roles', { 'roles.ESDTRoleNFTCreate': address }),
            QueryType.Nested('roles', { 'roles.ESDTRoleNFTBurn': address }),
            QueryType.Nested('roles', { 'roles.ESDTRoleNFTAddQuantity': address }),
            QueryType.Nested('roles', { 'roles.ESDTRoleNFTUpdateAttributes': address }),
            QueryType.Nested('roles', { 'roles.ESDTRoleNFTAddURI': address }),
            QueryType.Nested('roles', { 'roles.ESDTTransferRole': address }),
          ]
        ));
      } else {
        elasticQuery = elasticQuery.withMustCondition(QueryType.Match('currentOwner', address));
      }
    }

    return elasticQuery.withMustMatchCondition('token', filter.collection, QueryOperator.AND)
      .withMustMultiShouldCondition(filter.identifiers, identifier => QueryType.Match('token', identifier, QueryOperator.AND))
      .withMustWildcardCondition('token', filter.search)
      .withMustMatchCondition('type', filter.type)
      .withMustMultiShouldCondition([NftType.SemiFungibleESDT, NftType.NonFungibleESDT, NftType.MetaESDT], type => QueryType.Match('type', type));
  }

  async getNftCollections(pagination: QueryPagination, filter: CollectionFilter): Promise<NftCollection[]> {
    if (filter.creator) {
      const creatorResult = await this.gatewayService.get(`address/${filter.creator}/esdts-with-role/ESDTRoleNFTCreate`, GatewayComponentRequest.addressEsdtWithRole);
      filter.identifiers = creatorResult.tokens;
    }

    const elasticQuery = this.buildCollectionFilter(filter)
      .withPagination(pagination)
      .withSort([{ name: 'timestamp', order: ElasticSortOrder.descending }]);

    const tokenCollections = await this.elasticService.getList('tokens', 'identifier', elasticQuery);
    const collectionsIdentifiers = tokenCollections.map((collection) => collection.token);

    const indexedCollections: Record<string, any> = {};
    for (const collection of tokenCollections) {
      indexedCollections[collection.token] = collection;
    }

    const nftColections: NftCollection[] = await this.applyPropertiesToCollections(collectionsIdentifiers);

    for (const nftCollection of nftColections) {
      const indexedCollection = indexedCollections[nftCollection.collection];
      if (!indexedCollection) {
        continue;
      }

      nftCollection.timestamp = indexedCollection.timestamp;
    }

    return nftColections;
  }

  async applyPropertiesToCollections(collectionsIdentifiers: string[]): Promise<NftCollection[]> {
    const nftCollections: NftCollection[] = [];
    const collectionsProperties = await this.batchGetCollectionsProperties(collectionsIdentifiers);
    const collectionsAssets = await this.batchGetCollectionsAssets(collectionsIdentifiers);

    for (const collectionIdentifier of collectionsIdentifiers) {
      const collectionProperties = collectionsProperties[collectionIdentifier];
      if (!collectionProperties) {
        continue;
      }

      const nftCollection = new NftCollection();

      // @ts-ignore
      nftCollection.type = collectionProperties.type;
      nftCollection.name = collectionProperties.name;
      nftCollection.collection = collectionIdentifier.split('-').slice(0, 2).join('-');
      nftCollection.ticker = collectionIdentifier.split('-')[0];
      nftCollection.canFreeze = collectionProperties.canFreeze;
      nftCollection.canWipe = collectionProperties.canWipe;
      nftCollection.canPause = collectionProperties.canPause;
      nftCollection.canTransferRole = collectionProperties.canTransferNFTCreateRole;
      nftCollection.owner = collectionProperties.owner;

      if (nftCollection.type === NftType.MetaESDT) {
        nftCollection.decimals = collectionProperties.decimals;
      }

      nftCollection.assets = collectionsAssets[collectionIdentifier];
      nftCollection.ticker = nftCollection.assets ? collectionIdentifier.split('-')[0] : nftCollection.collection;

      nftCollections.push(nftCollection);
    }

    return nftCollections;
  }

  async batchGetCollectionsProperties(collectionsIdentifiers: string[]): Promise<{ [key: string]: TokenProperties | undefined }> {
    const collectionsProperties: { [key: string]: TokenProperties | undefined } = {};
    await this.cachingService.batchApply(
      collectionsIdentifiers,
      collectionIdentifier => CacheInfo.EsdtProperties(collectionIdentifier).key,
      async collectionsIdentifiers => {
        const result: { [key: string]: TokenProperties | undefined } = {};

        for (const collectionIdentifier of collectionsIdentifiers) {
          const collectionProperties = await this.esdtService.getEsdtTokenProperties(collectionIdentifier);
          result[collectionIdentifier] = collectionProperties;
        }

        return RecordUtils.mapKeys(result, identifier => CacheInfo.EsdtProperties(identifier).key);
      },
      (collectionIdentifier, properties) => collectionsProperties[collectionIdentifier] = properties,
      CacheInfo.EsdtProperties('').ttl
    );

    return collectionsProperties;
  }

  async batchGetCollectionsAssets(collectionsIdentifiers: string[]): Promise<{ [key: string]: TokenAssets | undefined }> {
    const collectionsAssets: { [key: string]: TokenAssets | undefined } = {};

    await this.cachingService.batchApply(
      collectionsIdentifiers,
      collectionIdentifier => CacheInfo.EsdtAssets(collectionIdentifier).key,
      async collectionsIdentifiers => {
        const result: { [key: string]: TokenAssets | undefined } = {};

        for (const collectionIdentifier of collectionsIdentifiers) {
          const collectionAssets = await this.tokenAssetService.getAssets(collectionIdentifier);
          result[collectionIdentifier] = collectionAssets;
        }

        return RecordUtils.mapKeys(result, identifier => CacheInfo.EsdtAssets(identifier).key);
      },
      (collectionIdentifier, properties) => collectionsAssets[collectionIdentifier] = properties,
      CacheInfo.EsdtAssets('').ttl
    );

    return collectionsAssets;
  }


  async getNftCollectionCount(filter: CollectionFilter): Promise<number> {
    const elasticQuery = this.buildCollectionFilter(filter);

    return await this.elasticService.getCount('tokens', elasticQuery);
  }

  async getNftCollection(collection: string): Promise<NftCollection | undefined> {
    const nftCollection = await this.elasticService.getItem('tokens', '_id', collection);
    if (!nftCollection) {
      return undefined;
    }

    const [collectionWithProperties] = await this.applyPropertiesToCollections([nftCollection.token]);

    if (!this.apiConfigService.getIsIndexerV3FlagActive()) {
      await this.applySpecialRoles(collectionWithProperties);

      return collectionWithProperties;
    }

    if (!nftCollection.roles) {
      return collectionWithProperties;
    }

    const roles: TokenAddressRoles[] = [];
    for (const role of Object.keys(nftCollection.roles)) {
      const addresses = nftCollection.roles[role].distinct();

      for (const address of addresses) {
        const foundAddressRoles = roles.find((addressRole) => addressRole.address === address);
        if (foundAddressRoles) {
          foundAddressRoles.roles?.push(role);
          continue;
        }

        const addressRole = new TokenAddressRoles();
        addressRole.address = address;
        addressRole.roles = [role];

        roles.push(addressRole);
      }
    }

    collectionWithProperties.roles = roles;
    return collectionWithProperties;
  }

  private async applySpecialRoles(nftCollection: NftCollection) {
    const collectionRolesEncoded = await this.vmQueryService.vmQuery(
      this.apiConfigService.getEsdtContractAddress(),
      'getSpecialRoles',
      undefined,
      [BinaryUtils.stringToHex(nftCollection.collection)]
    );

    if (!collectionRolesEncoded) {
      return;
    }

    for (const rolesForAddressEncoded of collectionRolesEncoded) {
      const rolesForAddressDecoded = BinaryUtils.base64Decode(rolesForAddressEncoded);
      const components = rolesForAddressDecoded.split(':');

      const roleForAddress = new TokenAddressRoles();
      roleForAddress.address = components[0];
      roleForAddress.roles = components[1].split(',');

      nftCollection.roles.push(roleForAddress);
    }
  }

  async getCollectionForAddress(address: string, collection: string): Promise<NftCollectionAccount | undefined> {
    const filter: CollectionFilter = { collection };

    const collections = await this.esdtAddressService.getEsdtCollectionsForAddress(address, filter, { from: 0, size: 1 });
    if (collections.length === 0) {
      return undefined;
    }

    return collections[0];
  }

  async getCollectionsForAddress(address: string, filter: CollectionFilter, pagination: QueryPagination, source?: EsdtDataSource): Promise<NftCollectionAccount[]> {
    const collections = await this.esdtAddressService.getEsdtCollectionsForAddress(address, filter, pagination, source);

    return collections;
  }

  async getCollectionCountForAddress(address: string, filter: CollectionFilter): Promise<number> {
    const count = await this.esdtAddressService.getEsdtCollectionsCountForAddressFromElastic(address, filter);

    return count;
  }
}
