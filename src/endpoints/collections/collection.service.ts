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
import { TokenHelpers } from "src/utils/token.helpers";
import { NftCollectionAccount } from "./entities/nft.collection.account";
import { ApiUtils, BinaryUtils, CachingService, TokenUtils } from "@elrondnetwork/erdnest";
import { IndexerService } from "src/common/indexer/indexer.service";
import { Collection } from "src/common/indexer/entities";

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

  async isCollection(identifier: string): Promise<boolean> {
    const collection = await this.indexerService.getCollection(identifier);
    return collection !== undefined;
  }

  async getNftCollections(pagination: QueryPagination, filter: CollectionFilter): Promise<NftCollection[]> {
    const tokenCollections = await this.indexerService.getNftCollections(pagination, filter);
    return await this.processNftCollections(tokenCollections);
  }

  async getNftCollectionsByIds(identifiers: Array<string>): Promise<NftCollection[]> {
    const tokenCollections = await this.indexerService.getNftCollectionsByIds(identifiers);
    return await this.processNftCollections(tokenCollections);
  }

  private async processNftCollections(tokenCollections: Collection[]): Promise<NftCollection[]> {
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

  async batchGetCollectionsProperties(identifiers: string[]): Promise<{ [key: string]: TokenProperties | undefined }> {
    const collectionsProperties: { [key: string]: TokenProperties | undefined } = {};
    await this.cachingService.batchApplyAll(
      identifiers,
      identifier => CacheInfo.EsdtProperties(identifier).key,
      identifier => this.esdtService.getEsdtTokenProperties(identifier),
      (identifier, properties) => collectionsProperties[identifier] = properties,
      CacheInfo.EsdtProperties('').ttl
    );

    return collectionsProperties;
  }

  async batchGetCollectionsAssets(identifiers: string[]): Promise<{ [key: string]: TokenAssets | undefined }> {
    const collectionsAssets: { [key: string]: TokenAssets | undefined } = {};

    await this.cachingService.batchApplyAll(
      identifiers,
      identifier => CacheInfo.EsdtAssets(identifier).key,
      identifier => this.assetsService.getTokenAssets(identifier),
      (identifier, properties) => collectionsAssets[identifier] = properties,
      CacheInfo.EsdtAssets('').ttl
    );

    return collectionsAssets;
  }

  async getNftCollectionCount(filter: CollectionFilter): Promise<number> {
    return await this.indexerService.getNftCollectionCount(filter);
  }

  async getNftCollection(identifier: string): Promise<NftCollection | undefined> {
    const elasticCollection = await this.indexerService.getCollection(identifier);
    if (!elasticCollection) {
      return undefined;
    }

    if (!TokenUtils.isCollection(identifier)) {
      return undefined;
    }

    if (![NftType.MetaESDT, NftType.NonFungibleESDT, NftType.SemiFungibleESDT].includes(elasticCollection.type as NftType)) {
      return undefined;
    }

    const [collection] = await this.applyPropertiesToCollections([identifier]);

    if (!collection) {
      return undefined;
    }

    collection.type = elasticCollection.type as NftType;
    collection.timestamp = elasticCollection.timestamp;
    collection.roles = await this.getNftCollectionRoles(elasticCollection);
    collection.traits = elasticCollection.nft_traitSummary ?? [];

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
          TokenHelpers.setCollectionRole(foundAddressRoles, role);
          continue;
        }

        const addressRole = new CollectionRoles();
        addressRole.address = address;
        TokenHelpers.setCollectionRole(addressRole, role);

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
        TokenHelpers.setCollectionRole(roleForAddress, role);
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

    if (!TokenUtils.isCollection(identifier)) {
      return undefined;
    }

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
