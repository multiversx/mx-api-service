import { Injectable, Logger } from "@nestjs/common";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { CachingService } from "src/common/caching/caching.service";
import { QueryPagination } from "src/common/entities/query.pagination";
import { NftExtendedAttributesService } from "src/endpoints/nfts/nft.extendedattributes.service";
import { ApiUtils } from "src/utils/api.utils";
import { BinaryUtils } from "src/utils/binary.utils";
import { Constants } from "src/utils/constants";
import { TokenUtils } from "src/utils/tokens.utils";
import { CollectionFilter } from "./entities/collection.filter";
import { Nft } from "./entities/nft";
import { NftAccount } from "./entities/nft.account";
import { NftCollection } from "./entities/nft.collection";
import { NftDetailed } from "./entities/nft.detailed";
import { NftFilter } from "./entities/nft.filter";
import { NftOwner } from "./entities/nft.owner";
import { NftType } from "./entities/nft.type";
import { TokenProperties } from "../tokens/entities/token.properties";
import { NftQueryOptions } from "./entities/nft.query.options";
import { NftCollectionAccount } from "./entities/nft.collection.account";
import { CollectionAccountFilter } from "./entities/collection.account.filter";
import { GatewayService } from "src/common/gateway/gateway.service";
import { ElasticService } from "src/common/elastic/elastic.service";
import { EsdtService } from "../esdt/esdt.service";
import { TokenAssetService } from "../tokens/token.asset.service";
import { GatewayNft } from "./entities/gateway.nft";
import { VmQueryService } from "../vm.query/vm.query.service";
import { AddresCollectionRoles } from "./entities/address.collection.roles";

@Injectable()
export class NftService {
  private readonly logger: Logger
  private readonly NFT_THUMBNAIL_PREFIX: string;

  constructor(
    private readonly gatewayService: GatewayService,
    private readonly apiConfigService: ApiConfigService,
    private readonly cachingService: CachingService,
    private readonly elasticService: ElasticService,
    private readonly nftExtendedAttributesService: NftExtendedAttributesService,
    private readonly esdtService: EsdtService,
    private readonly tokenAssetService: TokenAssetService,
    private readonly vmQueryService: VmQueryService,
  ) {
    this.logger = new Logger(NftService.name);
    this.NFT_THUMBNAIL_PREFIX = this.apiConfigService.getExternalMediaUrl() + '/nfts/asset';
  }

  async getCollectionProperties(identifier: string): Promise<TokenProperties | undefined> {
    let properties = await this.cachingService.getOrSetCache(
      `collection:${identifier}`,
      async () => await this.esdtService.getEsdtTokenProperties(identifier),
      Constants.oneWeek(),
      Constants.oneDay()
    );

    if (!properties) {
      return undefined;
    }

    return ApiUtils.mergeObjects(new TokenProperties(), properties);
  }

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

      let collectionProperties = await this.getCollectionProperties(nftCollection.collection);
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

  async getNfts(queryPagination: QueryPagination, filter: NftFilter, queryOptions?: NftQueryOptions): Promise<Nft[] | NftDetailed[]> {
    const { from, size } = queryPagination;

    let nfts =  await this.getNftsInternal(from, size, filter, undefined);

    for (let nft of nfts) {
      await this.applyAssetsAndTicker(nft);
    }
   
    if (queryOptions && queryOptions.withOwner) {
      let nonFungibleNftIdentifiers = nfts.filter(x => x.type === NftType.NonFungibleESDT).map(x => x.identifier);

      const accountsEsdts = await this.elasticService.getAccountEsdtByIdentifiers(nonFungibleNftIdentifiers);

      for (let nft of nfts) {
        if (nft.type === NftType.NonFungibleESDT) {
          const accountEsdt = accountsEsdts.find((accountEsdt: any) => accountEsdt.identifier == nft.identifier);
          if (accountEsdt) {
            nft.owner = accountEsdt.address;
          }
        }
      }
    }

    if (queryOptions && queryOptions.withSupply) {
      for (let nft of nfts) {
        if (nft.type === NftType.SemiFungibleESDT) {
          nft.supply = await this.esdtService.getTokenSupply(nft.identifier);
        }
      }
    }
    
    return nfts;
  }

  async applyAssetsAndTicker(token: Nft) {
    token.assets = await this.tokenAssetService.getAssets(token.collection);

    if (token.assets) {
      token.ticker = token.collection.split('-')[0];
    } else {
      token.ticker = token.collection;
    }
  }

  async getSingleNft(identifier: string): Promise<NftDetailed | undefined> {
    let nfts = await this.getNftsInternal(0, 1, new NftFilter(), identifier);
    if (nfts.length === 0) {
      return undefined;
    }

    let nft: NftDetailed = ApiUtils.mergeObjects(new NftDetailed(), nfts[0]);

    if (nft.identifier.toLowerCase() !== identifier.toLowerCase()) {
      return undefined;
    }

    nft.supply = await this.esdtService.getTokenSupply(nft.identifier);

    await this.applyAssetsAndTicker(nft);

    return nft;
  }

  async getNftOwners(identifier: string, pagination: QueryPagination): Promise<NftOwner[] | undefined> {
    let accountsEsdt = await this.elasticService.getAccountEsdtByIdentifier(identifier);
    if (accountsEsdt.length === 0) {
      return;
    }

    const { from, size } = pagination;
    accountsEsdt = accountsEsdt.slice(from, from + size);
    
    return accountsEsdt.map((esdt: any) => {
      let owner = new NftOwner();
      owner.address = esdt.address;
      owner.balance = esdt.balance;

      return owner;
    });
  }

  async getNftOwnersCount(identifier: string): Promise<number> {
    let accountsEsdt = await this.elasticService.getAccountEsdtByIdentifier(identifier);
    return accountsEsdt.length;
  }

  async getNftsInternal(from: number, size: number, filter: NftFilter, identifier: string | undefined): Promise<Nft[]> {
    let elasticNfts = await this.elasticService.getTokens(from, size, filter, identifier);

    let nfts: Nft[] = [];

    for (let elasticNft of elasticNfts) {
      let nft = new Nft();
      nft.identifier = elasticNft.identifier;
      nft.collection = elasticNft.token;
      nft.nonce = parseInt('0x' + nft.identifier.split('-')[2]);
      nft.timestamp = elasticNft.timestamp;

      let elasticNftData = elasticNft.data;
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

        if (elasticNftData.metadata) {
          nft.metadata = await this.nftExtendedAttributesService.tryGetExtendedAttributesFromMetadata(elasticNftData.metadata);
        } else {
          nft.metadata = undefined;
        }
      }

      nfts.push(nft);
    }

    this.updateThumbnailUrlForNfts(nfts);

    for (let nft of nfts) {
      let collectionProperties = await this.getCollectionProperties(nft.collection);

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

  updateThumbnailUrlForNfts(nfts: Nft[]) {
    let mediaNfts = nfts.filter(nft => nft.type !== NftType.MetaESDT && nft.uris.filter(uri => uri).length > 0);
    for (let mediaNft of mediaNfts) {
      mediaNft.thumbnailUrl = `${this.apiConfigService.getExternalMediaUrl()}/nfts/thumbnail/${mediaNft.identifier}`;
    }
  }


  async getNftCount(filter: NftFilter): Promise<number> {
    return await this.elasticService.getTokenCount(filter);
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
      let collectionProperties = await this.getCollectionProperties(tokenIdentifier);
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

    if (filter.owner !== undefined) {
      nftCollections = nftCollections.filter(x => x.owner === filter.owner);
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

  async getNftsForAddress(address: string, queryPagination: QueryPagination, filter: NftFilter, queryOptions?: NftQueryOptions): Promise<NftAccount[]> {
    const { from, size } = queryPagination;

    let nfts = await this.getNftsForAddressInternal(address, filter);

    nfts = nfts.slice(from, from + size);

    for (let nft of nfts) {
      await this.applyAssetsAndTicker(nft);
    }

    if (queryOptions && queryOptions.withTimestamp) {
      let identifiers = nfts.map(x => x.identifier);
      let elasticNfts = await this.elasticService.getTokensByIdentifiers(identifiers);

      for (let nft of nfts) {
        let elasticNft = elasticNfts.find((x: any) => x.identifier === nft.identifier);
        if (elasticNft) {
          nft.timestamp = elasticNft.timestamp;
        }
      }
    }

    if (queryOptions && queryOptions.withSupply) {
      for (let nft of nfts) {
        if (nft.type === NftType.SemiFungibleESDT) {
          nft.supply = await this.esdtService.getTokenSupply(nft.identifier);
        }
      }
    }

    return nfts;
  }

  async getNftCountForAddress(address: string, filter: NftFilter): Promise<number> {
    let nfts = await this.getNftsForAddressInternal(address, filter);

    return nfts.length;
  }

  private async filterNfts(filter: NftFilter, nfts: NftAccount[]): Promise<NftAccount[]> {
    if (filter.search) {
      let searchLower = filter.search.toLowerCase();

      nfts = nfts.filter(x => x.name.toLowerCase().includes(searchLower) || x.identifier.toLowerCase().includes(searchLower));
    }

    if (filter.type) {
      let types = filter.type.split(',');

      nfts = nfts.filter(x => types.includes(x.type));
    }

    if (filter.collection) {
      nfts = nfts.filter(x => x.collection === filter.collection);
    }

    if (filter.collections) {
      const collectionArray = filter.collections.split(',');
      nfts = nfts.filter(x => collectionArray.includes(x.collection));
    }

    if (filter.tags) {
      let tagsArray = filter.tags.split(',');
      nfts = nfts.filter(nft => tagsArray.filter(tag => nft.tags.includes(tag)).length === tagsArray.length);
    }

    if (filter.creator) {
      nfts = nfts.filter(x => x.creator === filter.creator);
    }

    if (filter.hasUris === true) {
      nfts = nfts.filter(x => x.uris.length > 0);
    } else if (filter.hasUris === false) {
      nfts = nfts.filter(x => x.uris.length === 0);
    }

    return nfts;
  }

  async getGatewayNfts(address: string, filter: NftFilter): Promise<GatewayNft[]> {
    if (filter.identifiers !== undefined) {
      let identifiers = filter.identifiers.split(',');
      if (identifiers.length === 1) {
        let identifier = identifiers[0];
        const collectionIdentifier = identifier.split('-').slice(0, 2).join('-');
        const nonce = parseInt(identifier.split('-')[2], 16);

        const { tokenData: gatewayNft } = await this.gatewayService.get(`address/${address}/nft/${collectionIdentifier}/nonce/${nonce}`);

        // normalizing tokenIdentifier since it doesn't contain the nonce in this particular scenario
        gatewayNft.tokenIdentifier = identifier;

        return [ gatewayNft ];
      } 
      
      if (identifiers.length > 1) {
        let esdts = await this.esdtService.getAllEsdtsForAddress(address);
        return Object.values(esdts).map(x => x as any).filter(x => identifiers.includes(x.tokenIdentifier));
      }
    }

    let esdts = await this.esdtService.getAllEsdtsForAddress(address);
    return Object.values(esdts).map(x => x as any).filter(x => x.tokenIdentifier.split('-').length === 3);
  }

  async getNftsForAddressInternal(address: string, filter: NftFilter): Promise<NftAccount[]> {
    let gatewayNfts = await this.getGatewayNfts(address, filter);

    gatewayNfts.sort((a: GatewayNft, b: GatewayNft) => a.tokenIdentifier.localeCompare(b.tokenIdentifier, 'en', { sensitivity: 'base' }));

    let nfts: NftAccount[] = [];

    for (let gatewayNft of gatewayNfts) {
      let nft = new NftAccount();
      nft.identifier = gatewayNft.tokenIdentifier;
      nft.collection = gatewayNft.tokenIdentifier.split('-').slice(0, 2).join('-');
      nft.nonce = gatewayNft.nonce;
      nft.creator = gatewayNft.creator;
      nft.royalties = Number(gatewayNft.royalties) / 100; // 10.000 => 100%
      nft.uris = gatewayNft.uris.filter((x: any) => x);
      nft.name = gatewayNft.name;

      // @ts-ignore
      delete nft.timestamp;

      if (nft.uris && nft.uris.length > 0) {
        try {
          nft.url = TokenUtils.computeNftUri(BinaryUtils.base64Decode(nft.uris[0]), this.NFT_THUMBNAIL_PREFIX);
        } catch (error) {
          this.logger.error(error);
        }
      }

      nft.attributes = gatewayNft.attributes;

      if (gatewayNft.attributes) {
        nft.tags = this.nftExtendedAttributesService.getTags(gatewayNft.attributes);
        nft.metadata = await this.nftExtendedAttributesService.tryGetExtendedAttributesFromBase64EncodedAttributes(gatewayNft.attributes);
      }

      let collectionDetails = await this.getCollectionProperties(nft.collection);
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

      if ([ NftType.SemiFungibleESDT, NftType.MetaESDT ].includes(nft.type)) {
        nft.balance = gatewayNft.balance;
      }

      nfts.push(nft);
    }

    nfts = await this.filterNfts(filter, nfts);

    this.updateThumbnailUrlForNfts(nfts);

    return nfts;
  }

  async getNftForAddress(address: string, identifier: string): Promise<NftAccount | undefined> {
    let filter = new NftFilter();
    filter.identifiers = identifier;

    let nfts = await this.getNftsForAddressInternal(address, filter);
    if (nfts.length === 0) {
      return undefined;
    }

    let nft = nfts[0];

    if (nft.type === NftType.SemiFungibleESDT) {
      nft.supply = await this.esdtService.getTokenSupply(identifier);
    }

    nft.assets = await this.tokenAssetService.getAssets(nft.collection);

    return nft;
  }

}