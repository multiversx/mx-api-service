import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { QueryPagination } from "src/common/entities/query.pagination";
import { EsdtService } from "../esdt/esdt.service";
import { CollectionFilter } from "./entities/collection.filter";
import { NftCollection } from "./entities/nft.collection";
import { NftType } from "../nfts/entities/nft.type";
import { AssetsService } from "../../common/assets/assets.service";
import { VmQueryService } from "../vm.query/vm.query.service";
import { NftCollectionRole } from "./entities/nft.collection.role";
import { TokenProperties } from "../tokens/entities/token.properties";
import { CacheInfo } from "src/utils/cache.info";
import { TokenAssets } from "../../common/assets/entities/token.assets";
import { EsdtAddressService } from "../esdt/esdt.address.service";
import { CollectionRoles } from "../tokens/entities/collection.roles";
import { TokenUtils } from "src/utils/token.utils";
import { NftCollectionAccount } from "./entities/nft.collection.account";
import { ApiUtils, BinaryUtils, RecordUtils, CachingService, ElasticQuery, QueryType, QueryOperator, QueryConditionOptions } from "@elrondnetwork/erdnest";
import { IndexerService } from "src/common/indexer/indexer.service";

@Injectable()
export class CollectionService {
  constructor(
    private readonly apiConfigService: ApiConfigService,
    private readonly indexerService: IndexerService,
    private readonly esdtService: EsdtService,
    private readonly assetsService: AssetsService,
    private readonly vmQueryService: VmQueryService,
    private readonly cachingService: CachingService,
    @Inject(forwardRef(() => EsdtAddressService))
    private readonly esdtAddressService: EsdtAddressService,
  ) { }

  buildCollectionRolesFilter(filter: CollectionFilter, address?: string) {
    let elasticQuery = ElasticQuery.create();
    elasticQuery = elasticQuery.withMustNotExistCondition('identifier');

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

    if (this.apiConfigService.getIsIndexerV3FlagActive()) {
      if (filter.canCreate !== undefined) {
        elasticQuery = this.getRoleCondition(elasticQuery, 'ESDTRoleNFTCreate', address, filter.canCreate);
      }

      if (filter.canBurn !== undefined) {
        elasticQuery = this.getRoleCondition(elasticQuery, 'ESDTRoleNFTBurn', address, filter.canBurn);
      }

      if (filter.canAddQuantity !== undefined) {
        elasticQuery = this.getRoleCondition(elasticQuery, 'ESDTRoleNFTAddQuantity', address, filter.canAddQuantity);
      }

      if (filter.canUpdateAttributes !== undefined) {
        elasticQuery = this.getRoleCondition(elasticQuery, 'ESDTRoleNFTUpdateAttributes', address, filter.canUpdateAttributes);
      }

      if (filter.canAddUri !== undefined) {
        elasticQuery = this.getRoleCondition(elasticQuery, 'ESDTRoleNFTAddURI', address, filter.canAddUri);
      }

      if (filter.canTransferRole !== undefined) {
        elasticQuery = this.getRoleCondition(elasticQuery, 'ESDTTransferRole', address, filter.canTransferRole);
      }
    }

    return elasticQuery.withMustMatchCondition('token', filter.collection, QueryOperator.AND)
      .withMustMultiShouldCondition(filter.identifiers, identifier => QueryType.Match('token', identifier, QueryOperator.AND))
      .withSearchWildcardCondition(filter.search, ['token', 'name'])
      .withMustMultiShouldCondition(filter.type, type => QueryType.Match('type', type))
      .withMustMultiShouldCondition([NftType.SemiFungibleESDT, NftType.NonFungibleESDT, NftType.MetaESDT], type => QueryType.Match('type', type));
  }

  private getRoleCondition(query: ElasticQuery, name: string, address: string | undefined, value: string | boolean) {
    const condition = value === false ? QueryConditionOptions.mustNot : QueryConditionOptions.must;
    const targetAddress = typeof value === 'string' ? value : address;

    return query.withCondition(condition, QueryType.Nested('roles', { [`roles.${name}`]: targetAddress }));
  }

  async isCollection(identifier: string): Promise<boolean> {
    const collection = await this.indexerService.getItem('tokens', '_id', identifier);
    return collection !== undefined;
  }

  async getNftCollections(pagination: QueryPagination, filter: CollectionFilter): Promise<NftCollection[]> {
    const tokenCollections = await this.indexerService.getNftCollections(pagination, filter);
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

      nftCollection.type = indexedCollection.type;
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
      nftCollection.canTransferNftCreateRole = collectionProperties.canTransferNFTCreateRole;
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
          result[collectionIdentifier] = await this.esdtService.getEsdtTokenProperties(collectionIdentifier);
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
          result[collectionIdentifier] = await this.assetsService.getAssets(collectionIdentifier);
        }

        return RecordUtils.mapKeys(result, identifier => CacheInfo.EsdtAssets(identifier).key);
      },
      (collectionIdentifier, properties) => collectionsAssets[collectionIdentifier] = properties,
      CacheInfo.EsdtAssets('').ttl
    );

    return collectionsAssets;
  }

  async getNftCollectionCount(filter: CollectionFilter): Promise<number> {
    return await this.indexerService.getNftCollectionCount(filter);
  }

  async getNftCollection(identifier: string): Promise<NftCollection | undefined> {
    const elasticCollection = await this.indexerService.getItem('tokens', '_id', identifier);
    if (!elasticCollection) {
      return undefined;
    }

    const [collection] = await this.applyPropertiesToCollections([identifier]);

    if (!collection) {
      return undefined;
    }

    collection.type = elasticCollection.type;
    collection.timestamp = elasticCollection.timestamp;
    collection.roles = await this.getNftCollectionRoles(elasticCollection);

    return collection;
  }

  async getNftCollectionRoles(elasticCollection: any): Promise<CollectionRoles[]> {
    if (!this.apiConfigService.getIsIndexerV3FlagActive()) {
      return await this.getNftCollectionRolesFromEsdtContract(elasticCollection.token);
    }

    return this.getNftCollectionRolesFromElasticResponse(elasticCollection);
  }

  private getNftCollectionRolesFromElasticResponse(elasticCollection: any): CollectionRoles[] {
    if (!elasticCollection.roles) {
      return [];
    }

    const allRoles: CollectionRoles[] = [];
    for (const role of Object.keys(elasticCollection.roles)) {
      const addresses = elasticCollection.roles[role].distinct();

      for (const address of addresses) {
        const foundAddressRoles = allRoles.find((addressRole) => addressRole.address === address);
        if (foundAddressRoles) {
          TokenUtils.setCollectionRole(foundAddressRoles, role);
          continue;
        }

        const addressRole = new CollectionRoles();
        addressRole.address = address;
        TokenUtils.setCollectionRole(addressRole, role);

        allRoles.push(addressRole);
      }
    }

    return allRoles;
  }

  private async getNftCollectionRolesFromEsdtContract(identifier: string): Promise<CollectionRoles[]> {
    const collectionRolesEncoded = await this.vmQueryService.vmQuery(
      this.apiConfigService.getEsdtContractAddress(),
      'getSpecialRoles',
      undefined,
      [BinaryUtils.stringToHex(identifier)]
    );

    if (!collectionRolesEncoded) {
      return [];
    }

    const allRoles: CollectionRoles[] = [];

    for (const rolesForAddressEncoded of collectionRolesEncoded) {
      const rolesForAddressDecoded = BinaryUtils.base64Decode(rolesForAddressEncoded);
      const components = rolesForAddressDecoded.split(':');

      const roleForAddress = new CollectionRoles();
      roleForAddress.address = components[0];
      const roles = components[1].split(',');
      for (const role of roles) {
        TokenUtils.setCollectionRole(roleForAddress, role);
      }

      allRoles.push(roleForAddress);
    }

    return allRoles;
  }

  async getCollectionForAddressWithRole(address: string, collection: string): Promise<NftCollectionRole | undefined> {
    const filter: CollectionFilter = { collection };

    const collections = await this.esdtAddressService.getCollectionsForAddress(address, filter, new QueryPagination({ from: 0, size: 1 }));
    if (collections.length === 0) {
      return undefined;
    }

    return collections[0];
  }

  async getCollectionsWithRolesForAddress(address: string, filter: CollectionFilter, pagination: QueryPagination): Promise<NftCollectionRole[]> {
    return await this.esdtAddressService.getCollectionsForAddress(address, filter, pagination);
  }

  async getCollectionCountForAddress(address: string, filter: CollectionFilter): Promise<number> {
    const collections = await this.getCollectionsForAddress(address, filter, new QueryPagination({ from: 0, size: 10000 }));

    return collections.length;
  }

  async getCollectionForAddress(address: string, identifier: string): Promise<NftCollectionAccount | undefined> {
    const collections = await this.getCollectionsForAddress(address, new CollectionFilter({ collection: identifier }), new QueryPagination({ from: 0, size: 1 }));

    return collections.find(x => x.collection === identifier);
  }

  async getCollectionsForAddress(address: string, filter: CollectionFilter, pagination: QueryPagination): Promise<NftCollectionAccount[]> {
    const collectionsRaw = await this.indexerService.getCollectionsForAddress(address, filter, pagination);

    const collections = await this.getNftCollections(
      new QueryPagination({ from: 0, size: collectionsRaw.length }),
      new CollectionFilter({ identifiers: collectionsRaw.map((x: any) => x.collection) })
    );
    const accountCollections = collections.map(collection => ApiUtils.mergeObjects(new NftCollectionAccount(), collection));

    for (const collection of accountCollections) {
      const item = collectionsRaw.find(x => x.collection === collection.collection);
      if (item) {
        collection.count = item.count;
      }
    }

    return accountCollections;
  }

  async getCollectionCountForAddressWithRoles(address: string, filter: CollectionFilter): Promise<number> {
    return await this.esdtAddressService.getCollectionCountForAddressFromElastic(address, filter);
  }
}
