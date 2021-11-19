import { Injectable } from "@nestjs/common";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { ElasticService } from "src/common/elastic/elastic.service";
import { QueryPagination } from "src/common/entities/query.pagination";
import { GatewayService } from "src/common/gateway/gateway.service";
import { BinaryUtils } from "src/utils/binary.utils";
import { EsdtService } from "../esdt/esdt.service";
import { AddresCollectionRoles } from "./entities/address.collection.roles";
import { CollectionAccountFilter } from "./entities/collection.account.filter";
import { CollectionFilter } from "./entities/collection.filter";
import { NftCollection } from "./entities/nft.collection";
import { NftType } from "../nfts/entities/nft.type";
import { TokenAssetService } from "../tokens/token.asset.service";
import { VmQueryService } from "../vm.query/vm.query.service";
import { NftCollectionAccount } from "./entities/nft.collection.account";

@Injectable()
export class CollectionService {
  constructor(
    private readonly gatewayService: GatewayService,
    private readonly apiConfigService: ApiConfigService,
    private readonly elasticService: ElasticService,
    private readonly esdtService: EsdtService,
    private readonly tokenAssetService: TokenAssetService,
    private readonly vmQueryService: VmQueryService,
  ) { }

  async getNftCollections(pagination: QueryPagination, filter: CollectionFilter): Promise<NftCollection[]> {
    if (filter.creator) {
      let creatorResult = await this.gatewayService.get(`address/${filter.creator}/esdts-with-role/ESDTRoleNFTCreate`);
      filter.identifiers = creatorResult.tokens;
    }

    let tokenCollections = await this.elasticService.getTokenCollections(pagination, filter);

    let nftCollections: NftCollection[] = [];
    for (let tokenCollection of tokenCollections) {
      let nftCollection = new NftCollection();
      nftCollection.name = tokenCollection.name;
      nftCollection.type = tokenCollection.type;
      nftCollection.collection = tokenCollection.token;
      nftCollection.timestamp = tokenCollection.timestamp;

      let collectionProperties = await this.esdtService.getEsdtTokenProperties(nftCollection.collection);
      if (collectionProperties) {
        nftCollection.owner = collectionProperties.owner;
        nftCollection.canFreeze = collectionProperties.canFreeze;
        nftCollection.canWipe = collectionProperties.canWipe;
        nftCollection.canPause = collectionProperties.canPause;
        nftCollection.canTransferRole = collectionProperties.canTransferNFTCreateRole;

        if (nftCollection.type === NftType.MetaESDT) {
          nftCollection.decimals = collectionProperties.decimals;
          nftCollection.assets = await this.tokenAssetService.getAssets(nftCollection.collection);
        }
      }

      nftCollection.ticker = nftCollection.assets ? tokenCollection.ticker : nftCollection.collection;

      nftCollections.push(nftCollection);
    }

    return nftCollections;
  }

  async getNftCollectionCount(filter: CollectionFilter): Promise<number> {
    const { search, type } = filter || {};

    return await this.elasticService.getTokenCollectionCount(search, type);
  }

  async getNftCollection(collection: string): Promise<NftCollection | undefined> {
    let result = await this.getNftCollections({ from: 0, size: 1}, { collection });
    if (result.length === 0 || result[0].collection.toLowerCase() !== collection.toLowerCase()) {
      return undefined;
    }

    let nftCollection = result[0];

    await this.applySpecialRoles(nftCollection);

    return nftCollection;
  }

  private async applySpecialRoles(nftCollection: NftCollection) {
    const collectionRolesEncoded = await this.vmQueryService.vmQuery(
      this.apiConfigService.getEsdtContractAddress(), 
      'getSpecialRoles', 
      undefined, 
      [ BinaryUtils.stringToHex(nftCollection.collection) ]
    );

    if (!collectionRolesEncoded) {
      return;
    }

    for (let rolesForAddressEncoded of collectionRolesEncoded) {
      const rolesForAddressDecoded = BinaryUtils.base64Decode(rolesForAddressEncoded);
      const components = rolesForAddressDecoded.split(':');

      const roleForAddress = new AddresCollectionRoles();
      roleForAddress.address = components[0];
      roleForAddress.roles = components[1].split(',');

      nftCollection.roles.push(roleForAddress);
    }
  }

  async getCollectionForAddress(address: string, collection: string): Promise<NftCollectionAccount | undefined> {
    let filter: CollectionAccountFilter = { collection };

    let collections = await this.getFilteredCollectionsForAddress(address, filter);
    if (collections.length === 0) {
      return undefined;
    }

    return collections[0];
  }

  private async getFilteredCollectionsForAddress(address: string, filter: CollectionAccountFilter): Promise<NftCollectionAccount[]> {
    let esdtResult = await this.gatewayService.get(`address/${address}/registered-nfts`);
    let rolesResult = await this.gatewayService.get(`address/${address}/esdts/roles`);

    let tokenIdentifiers = esdtResult.tokens;
    if (tokenIdentifiers.length === 0) {
      return [];
    }

    if (filter.collection) {
      if (!tokenIdentifiers.includes(filter.collection)) {
        return [];
      }

      tokenIdentifiers = [ filter.collection ];
    }

    let roles = rolesResult.roles;

    let nftCollections: NftCollectionAccount[] = [];
    for (let tokenIdentifier of tokenIdentifiers) {
      let collectionProperties = await this.esdtService.getEsdtTokenProperties(tokenIdentifier);
      if (!collectionProperties) {
        continue;
      }

      let nftCollection = new NftCollectionAccount();

      // @ts-ignore
      delete nftCollection.timestamp;

      // @ts-ignore
      nftCollection.type = collectionProperties.type;
      nftCollection.name = collectionProperties.name;
      nftCollection.collection = tokenIdentifier.split('-').slice(0, 2).join('-');
      nftCollection.ticker = tokenIdentifier.split('-')[0];
      nftCollection.canFreeze = collectionProperties.canFreeze;
      nftCollection.canWipe = collectionProperties.canWipe;
      nftCollection.canPause = collectionProperties.canPause;
      nftCollection.canTransferRole = collectionProperties.canTransferNFTCreateRole;

      let role = roles[tokenIdentifier];
      nftCollection.canCreate = role ? role.includes('ESDTRoleNFTCreate') : false;
      nftCollection.canBurn = role ? role.includes('ESDTRoleNFTBurn') : false;
      
      if (nftCollection.type === NftType.SemiFungibleESDT) {
        nftCollection.canAddQuantity = role ? role.includes('ESDTRoleNFTAddQuantity') : false;
      } else if (nftCollection.type === NftType.MetaESDT) {
        nftCollection.decimals = collectionProperties.decimals;
        nftCollection.assets = await this.tokenAssetService.getAssets(nftCollection.collection);
      }

      nftCollection.ticker = nftCollection.assets ? tokenIdentifier.split('-')[0] : nftCollection.collection;

      nftCollections.push(nftCollection);
    }

    if (filter.type !== undefined) {
      nftCollections = nftCollections.filter(x => x.type === filter.type);
    }

    if (filter.search !== undefined) {
      let searchLower = filter.search.toLowerCase();

      nftCollections = nftCollections.filter(x => x.name.toLowerCase().includes(searchLower) || x.collection.toLowerCase().includes(searchLower));
    }

    if (filter.canCreate !== undefined) {
      nftCollections = nftCollections.filter(x => x.canCreate === filter.canCreate);
    }

    if (filter.canBurn !== undefined) {
      nftCollections = nftCollections.filter(x => x.canBurn === filter.canBurn);
    }

    if (filter.canAddQuantity !== undefined) {
      nftCollections = nftCollections.filter(x => x.canAddQuantity === filter.canAddQuantity);
    }

    return nftCollections;
  }
  
  async getCollectionsForAddress(address: string, filter: CollectionAccountFilter, pagination: QueryPagination): Promise<NftCollectionAccount[]> {
    let collections = await this.getFilteredCollectionsForAddress(address, filter);

    collections = collections.slice(pagination.from, pagination.from + pagination.size);

    return collections;
  }

  async getCollectionCountForAddress(address: string, filter: CollectionAccountFilter): Promise<number> {
    let nftCollections = await this.getFilteredCollectionsForAddress(address, filter);

    return nftCollections.length;
  }
}