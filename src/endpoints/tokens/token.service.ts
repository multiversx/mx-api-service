import { Injectable, Logger } from "@nestjs/common";
import { ApiConfigService } from "src/common/api.config.service";
import { CachingService } from "src/common/caching.service";
import { GatewayService } from "src/common/gateway.service";
import { VmQueryService } from "src/endpoints/vm.query/vm.query.service";
import { Token } from "./entities/token";
import { TokenWithBalance } from "./entities/token.with.balance";
import { TokenDetailed } from "./entities/token.detailed";
import { TokenProperties } from "./entities/token.properties";
import { NftType } from "./entities/nft.type";
import { ElasticService } from "src/common/elastic.service";
import { Nft } from "./entities/nft";
import { NftDetailed } from "./entities/nft.detailed";
import { NftOwner } from "./entities/nft.owner";
import { NftAccount } from "./entities/nft.account";
import { TokenAssetService } from "src/common/token.asset.service";
import { NftCollection } from "./entities/nft.collection";
import { NftFilter } from "./entities/nft.filter";
import { QueryPagination } from "src/common/entities/query.pagination";
import { CollectionFilter } from "./entities/collection.filter";
import { Constants } from "src/utils/constants";
import { AddressUtils } from "src/utils/address.utils";
import { BinaryUtils } from "src/utils/binary.utils";
import { ApiUtils } from "src/utils/api.utils";
import { TokenFilter } from "./entities/token.filter";
import { TokenUtils } from "src/utils/tokens.utils";
import { NftThumbnailService } from "src/common/nft.thumbnail.service";
import { NftExtendedAttributesService } from "src/common/nft.extendedattributes.service";
import { MetricsService } from "../metrics/metrics.service";

@Injectable()
export class TokenService {
  private readonly logger: Logger
  private readonly NFT_THUMBNAIL_PREFIX: string;

  constructor(
    private readonly gatewayService: GatewayService,
    private readonly apiConfigService: ApiConfigService,
    private readonly cachingService: CachingService,
    private readonly vmQueryService: VmQueryService,
    private readonly elasticService: ElasticService,
    private readonly tokenAssetService: TokenAssetService,
    private readonly nftThumbnailService: NftThumbnailService,
    private readonly nftExtendedAttributesService: NftExtendedAttributesService,
    private readonly metricsService: MetricsService,
  ) {
    this.logger = new Logger(TokenService.name);
    this.NFT_THUMBNAIL_PREFIX = this.apiConfigService.getExternalMediaUrl() + '/nfts/asset';
  }

  async getToken(identifier: string): Promise<TokenDetailed | undefined> {
    let tokens = await this.getAllTokens();
    let token = tokens.find(x => x.identifier === identifier);
    if (token) {
      token.assets = await this.tokenAssetService.getAssets(token.identifier);

      return ApiUtils.mergeObjects(new TokenDetailed(), token);
    }

    return undefined;
  }

  async getTokens(queryPagination: QueryPagination, filter: TokenFilter): Promise<TokenDetailed[]> {
    const { from, size } = queryPagination;

    let tokens = await this.getFilteredTokens(filter);

    tokens = tokens.slice(from, from + size);

    for (let token of tokens) {
      token.assets = await this.tokenAssetService.getAssets(token.identifier);
    }

    return tokens.map(item => ApiUtils.mergeObjects(new TokenDetailed(), item));
  }

  async getFilteredTokens(filter: TokenFilter): Promise<TokenDetailed[]> {
    let tokens = await this.getAllTokens();

    if (filter.search) {
      let searchLower = filter.search.toLowerCase();

      tokens = tokens.filter(token => token.name.toLowerCase().includes(searchLower) || token.identifier.toLowerCase().includes(searchLower));
    }

    if (filter.name) {
      let nameLower = filter.name.toLowerCase();

      tokens = tokens.filter(token => token.name.toLowerCase().includes(nameLower));
    }

    if (filter.identifier) {
      let identifierLower = filter.identifier.toLowerCase();

      tokens = tokens.filter(token => token.identifier.toLowerCase().includes(identifierLower));
    }

    if (filter.identifiers) {
      const identifierArray = filter.identifiers.split(',').map(identifier => identifier.toLowerCase());

      tokens = tokens.filter(token => identifierArray.includes(token.identifier.toLowerCase()));
    }
    
    return tokens;
  }

  async getTokenCount(filter: TokenFilter): Promise<number> {
    let tokens = await this.getFilteredTokens(filter);

    return tokens.length;
  }

  async getCollection(identifier: string): Promise<TokenProperties | undefined> {
    let properties = await this.cachingService.getOrSetCache(
      `nft:${identifier}`,
      async () => await this.getTokenProperties(identifier),
      Constants.oneWeek(),
      Constants.oneDay()
    );

    if (!properties) {
      return undefined;
    }

    return ApiUtils.mergeObjects(new TokenProperties(), properties);
  }

  async getNftCollections(queryPagination: QueryPagination, filter: CollectionFilter): Promise<NftCollection[]> {
    const { from, size } = queryPagination;

    let tokenCollections = await this.elasticService.getTokenCollections(from, size, filter.search, filter.type, undefined, filter.issuer, filter.identifiers);

    let nftCollections: NftCollection[] = [];
    for (let tokenCollection of tokenCollections) {
      let nftCollection = new NftCollection();
      nftCollection.collection = tokenCollection.token;

      ApiUtils.mergeObjects(nftCollection, tokenCollection);

      let nft = await this.getCollection(nftCollection.collection);
      if (nft) {
        ApiUtils.mergeObjects(nftCollection, nft);
      }

      nftCollections.push(nftCollection);
    }

    return nftCollections;
  }

  async getNftCollectionCount(filter: CollectionFilter): Promise<number> {
    const { search, type } = filter || {};

    return await this.elasticService.getTokenCollectionCount(search, type);
  }

  async getNftCollection(collection: string): Promise<NftCollection | undefined> {
    let tokenCollections = await this.elasticService.getTokenCollections(0, 1, undefined, undefined, collection, undefined, []);
    if (tokenCollections.length === 0) {
      return undefined;
    }

    let tokenCollection = tokenCollections[0];
    let nftCollection = new NftCollection();
    nftCollection.collection = tokenCollection.token;

    ApiUtils.mergeObjects(nftCollection, tokenCollection);

    let nft = await this.getCollection(nftCollection.collection);
    if (nft) {
      ApiUtils.mergeObjects(nftCollection, nft);
    }

    return nftCollection;
  }

  async getTokenSupply(identifier: string) {
    const { supply } = await this.gatewayService.get(`network/esdt/supply/${identifier}`);

    return supply;
  }

  async getNfts(queryPagination: QueryPagination, filter: NftFilter, withOwner: boolean = false, withSupply: boolean = false): Promise<Nft[] | NftDetailed[]> {
    const { from, size } = queryPagination;

    let nfts = await this.getNftsInternal(from, size, filter, undefined);

    if (withOwner) {
      const accountsEsdts = await this.elasticService.getAccountEsdtByIdentifiers(nfts.map(({identifier}) => identifier));

      for (let nft of nfts) {
        if (nft.type === NftType.NonFungibleESDT) {
          const accountEsdt = accountsEsdts.find((accountEsdt: any) => accountEsdt.identifier == nft.identifier);
          if (accountEsdt) {
            nft.owner = accountEsdt.address;
          }
        } else if (nft.type === NftType.SemiFungibleESDT) {
          nft.balance = accountsEsdts.filter((x: any) => x.identifier === nft.identifier)
          .map((x: any) => BigInt(x.balance))
          .reduce((previous: BigInt, current: BigInt) => previous.valueOf() + current.valueOf(), BigInt(0))
          .toString();
        }
      }
    }

    if (withSupply) {
      for (let nft of nfts) {
        if (nft.type === NftType.SemiFungibleESDT && withSupply) {
          nft.supply = await this.cachingService.getOrSetCache(
            `tokenSupply:${nft.identifier}`,
            async () => await this.getTokenSupply(nft.identifier),
            Constants.oneHour()
          );
        }
      }
    }
    
    return nfts;
  }

  private async getTokenDistribution(identifier: string, nftDetailed: NftDetailed): Promise<NftDetailed> {
    let accountsEsdt = await this.elasticService.getAccountEsdtByIdentifier(identifier);
    if (nftDetailed.type === NftType.NonFungibleESDT) {
      nftDetailed.owner = accountsEsdt[0].address;

      // @ts-ignore
      delete nftDetailed.owners;
    } else {
      nftDetailed.owners = accountsEsdt.map((esdt: any) => {
        let owner = new NftOwner();
        owner.address = esdt.address;
        owner.balance = esdt.balance;

        return owner;
      });

      // @ts-ignore
      delete nftDetailed.owner;
    }

    return nftDetailed;
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

    nft = await this.getTokenDistribution(nft.identifier, nft);

    return nft;
  }

  async getNftsInternal(from: number, size: number, filter: NftFilter, identifier: string | undefined): Promise<Nft[]> {
    let elasticNfts = await this.elasticService.getTokens(from, size, filter, identifier);

    let nfts: Nft[] = [];

    for (let elasticNft of elasticNfts) {
      let nft = new Nft();
      nft.identifier = elasticNft.identifier;
      nft.collection = elasticNft.token;
      nft.type = elasticNft.type;
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
            nft.url = TokenUtils.computeNftUri(nft.url, this.NFT_THUMBNAIL_PREFIX);
          } catch (error) {
            this.logger.error(error);
          }
        }

        if (elasticNftData.metadata) {
          try {
            nft.metadata = await this.nftExtendedAttributesService.getExtendedAttributesFromMetadata(elasticNftData.metadata);
          } catch (error) {
            this.logger.error(`Error when getting extended attributes for NFT '${nft.identifier}'`);
            this.logger.error(error);
            nft.metadata = undefined;
          }
        } else {
          nft.metadata = undefined;
        }
      }

      nfts.push(nft);
    }

    await this.nftThumbnailService.updateThumbnailUrlForNfts(nfts);

    for (let nft of nfts) {
      if (!nft.name || !nft.type) {
        let gatewayNft = await this.getCollection(nft.collection);
        if (gatewayNft) {
          if (!nft.name) {
            nft.name = gatewayNft.name;
          }

          if (!nft.type) {
            nft.type = gatewayNft.type;
          }
        }
      }
    }

    return nfts;
  }

  async getNftCount(filter: NftFilter): Promise<number> {
    return await this.elasticService.getTokenCount(filter);
  }

  async getTokenCountForAddress(address: string): Promise<number> {
    let tokens = await this.getAllTokensForAddress(address, new TokenFilter());
    return tokens.length;
  }

  async getTokensForAddress(address: string, queryPagination: QueryPagination, filter: TokenFilter): Promise<TokenWithBalance[]> {
    const { from, size } = queryPagination;
    
    let tokens = await this.getAllTokensForAddress(address, filter);

    tokens = tokens.slice(from, from + size);

    for (let token of tokens) {
      token.assets = await this.tokenAssetService.getAssets(token.identifier);
    }

    return tokens.map(token => ApiUtils.mergeObjects(new TokenWithBalance(), token));
  }

  async getCollectionsForAddress(address: string, queryPagination: QueryPagination): Promise<NftCollection[]> {
    let esdtResult = await this.gatewayService.get(`address/${address}/registered-nfts`);

    if (esdtResult.tokens.length === 0) {
      return [];
    }

    let filter = new CollectionFilter();
    filter.identifiers = esdtResult.tokens;

    return await this.getNftCollections(queryPagination, filter);
  }

  async getCollectionCountForAddress(address: string): Promise<number> {
    let esdtResult = await this.gatewayService.get(`address/${address}/registered-nfts`);

    return esdtResult.tokens.length;
  }

  async getTokenForAddress(address: string, tokenIdentifier: string): Promise<TokenWithBalance | undefined> {
    let allTokens = await this.getAllTokensForAddress(address, new TokenFilter());

    let foundToken = allTokens.find(x => x.identifier === tokenIdentifier);
    if (!foundToken) {
      return undefined;
    }

    foundToken.assets = await this.tokenAssetService.getAssets(tokenIdentifier);

    return foundToken;
  }
  
  private async getAllEsdtsRaw(address: string): Promise<{ [ key: string]: any }> {
    try {
      let esdtResult = await this.gatewayService.get(`address/${address}/esdt`);
      return esdtResult.esdts;
    } catch (error) {
      let errorMessage = error?.response?.data?.error;
      if (errorMessage && errorMessage.includes('account was not found')) {
        return {};
      }
      
      throw error;
    }
  }

  private pendingRequestsDictionary: { [ key: string]: any; } = {};
  
  async getAllEsdts(address: string): Promise<{ [ key: string]: any }> {
    let pendingRequest = this.pendingRequestsDictionary[address];
    if (pendingRequest) {
      let result = await pendingRequest;
      this.metricsService.incrementPendingApiHit('Gateway.AccountEsdts');
      return result;
    }

    let cachedValue = await this.cachingService.getCacheLocal<{ [ key: string]: any }>(`address:${address}:esdts`);
    if (cachedValue) {
      this.metricsService.incrementCachedApiHit('Gateway.AccountEsdts');
      return cachedValue;
    }

    pendingRequest = this.getAllEsdtsRaw(address);
    this.pendingRequestsDictionary[address] = pendingRequest;

    let esdts: { [ key: string]: any };
    try {
      esdts = await pendingRequest;
    } finally {
      delete this.pendingRequestsDictionary[address];
    }

    let ttl = await this.cachingService.getSecondsRemainingUntilNextRound();

    await this.cachingService.setCacheLocal(`address:${address}:esdts`, esdts, ttl);
    return esdts;
  }

  async getAllTokensForAddress(address: string, filter: TokenFilter): Promise<TokenWithBalance[]> {
    let tokens = await this.getFilteredTokens(filter);

    let tokensIndexed: { [index: string]: Token } = {};
    for (let token of tokens) {
      tokensIndexed[token.identifier] = token;
    }

    let esdts = await this.getAllEsdts(address);

    let tokensWithBalance: TokenWithBalance[] = [];

    for (let tokenIdentifier of Object.keys(esdts)) {
      if (!TokenUtils.isEsdt(tokenIdentifier)) {
        continue;
      }

      let esdt = esdts[tokenIdentifier];
      let token = tokensIndexed[tokenIdentifier];
      if (!token) {
        this.logger.log(`Could not find token with identifier ${tokenIdentifier}`);
        continue;
      }

      let tokenWithBalance = {
        ...token,
        ...esdt,
      };

      tokensWithBalance.push(tokenWithBalance);
    }

    for (let token of tokensWithBalance) {
      // @ts-ignore
      token.identifier = token.tokenIdentifier;
      // @ts-ignore
      delete token.tokenIdentifier;
    }

    return tokensWithBalance;
  }

  async getNftsForAddress(address: string, queryPagination: QueryPagination, filter: NftFilter, withTimestamp: boolean = false): Promise<NftAccount[]> {
    const { from, size }  = queryPagination;

    let nfts = await this.getNftsForAddressInternal(address, filter);

    nfts = nfts.splice(from, from + size);

    if (withTimestamp) {
      let identifiers = nfts.map(x => x.identifier);
      let elasticNfts = await this.elasticService.getTokensByIdentifiers(identifiers);

      for (let nft of nfts) {
        let elasticNft = elasticNfts.find((x: any) => x.identifier === nft.identifier);
        if (elasticNft) {
          nft.timestamp = elasticNft.timestamp;
        }
      }
    }

    return nfts;
  }

  async getNftCountForAddress(address: string, filter: NftFilter): Promise<number> {
    let nfts = await this.getNftsForAddressInternal(address, filter);

    return nfts.length;
  }

  async getNftsForAddressInternal(address: string, filter: NftFilter): Promise<NftAccount[]> {
    let esdts = await this.getAllEsdts(address);

    let gatewayNfts = Object.values(esdts).map(x => x as any);

    let nfts: NftAccount[] = [];

    for (let gatewayNft of gatewayNfts) {
      let components = gatewayNft.tokenIdentifier.split('-');
      if (components.length !== 3) {
        continue;
      }

      let nft = new NftAccount();
      nft.identifier = gatewayNft.tokenIdentifier;
      nft.collection = gatewayNft.tokenIdentifier.split('-').slice(0, 2).join('-');
      nft.nonce = parseInt('0x' + gatewayNft.tokenIdentifier.split('-')[2]);
      nft.creator = gatewayNft.creator;
      nft.royalties = Number(gatewayNft.royalties) / 100; // 10.000 => 100%
      nft.uris = gatewayNft.uris.filter((x: any) => x);
      nft.name = gatewayNft.name;

      if (nft.uris && nft.uris.length > 0) {
        try {
          nft.url = TokenUtils.computeNftUri(BinaryUtils.base64Decode(nft.uris[0]), this.NFT_THUMBNAIL_PREFIX);
        } catch (error) {
          this.logger.error(error);
        }
      }

      nft.attributes = gatewayNft.attributes;
      nft.balance = gatewayNft.balance;

      if (gatewayNft.attributes) {
        nft.tags = this.nftExtendedAttributesService.getTags(gatewayNft.attributes);
        try {
          nft.metadata = await this.nftExtendedAttributesService.getExtendedAttributesFromRawAttributes(gatewayNft.attributes);
        } catch (error) {
          this.logger.error(`Could not get extended attributes for nft '${nft.identifier}'`);
          this.logger.error(error);
        }
      }

      let gatewayNftDetails = await this.getCollection(nft.collection);
      if (gatewayNftDetails) {
        nft.type = gatewayNftDetails.type;
        nft.name = gatewayNftDetails.name;
      }

      nfts.push(nft);
    }

    if (filter.search) {
      let searchLower = filter.search.toLowerCase();

      nfts = nfts.filter(x => x.name.toLowerCase().includes(searchLower));
    }

    if (filter.type) {
      nfts = nfts.filter(x => x.type === filter.type);
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

    await this.nftThumbnailService.updateThumbnailUrlForNfts(nfts);

    return nfts;
  }

  async getNftForAddress(address: string, identifier: string): Promise<NftAccount | undefined> {
    let nfts = await this.getNftsForAddressInternal(address, new NftFilter());
    return nfts.find(x => x.identifier === identifier);
  }

  async getAllTokens(): Promise<TokenDetailed[]> {
    return this.cachingService.getOrSetCache(
      'allTokens',
      async () => await this.getAllTokensRaw(),
      Constants.oneHour()
    );
  }

  async getAllTokensRaw(): Promise<TokenDetailed[]> {
    let tokensIdentifiers: string[];
    try {
      const getFungibleTokensResult = await this.gatewayService.get('network/esdt/fungible-tokens');

      tokensIdentifiers = getFungibleTokensResult.tokens;
    } catch (error) {
      this.logger.error('Error when getting fungible tokens from gateway');
      this.logger.error(error);
      return [];
    }

    let tokens = await this.cachingService.batchProcess(
      tokensIdentifiers,
      token => `tokenProperties:${token}`,
      async (token: string) => await this.getTokenProperties(token),
      Constants.oneDay()
    );

    // @ts-ignore
    return tokens;
  }

  async getTokenProperties(identifier: string) {
    const arg = Buffer.from(identifier, 'utf8').toString('hex');

    const tokenPropertiesEncoded = await this.vmQueryService.vmQuery(
      this.apiConfigService.getEsdtContractAddress(),
      'getTokenProperties',
      undefined,
      [ arg ],
      true
    );

    const tokenProperties = tokenPropertiesEncoded.map((encoded, index) =>
      Buffer.from(encoded, 'base64').toString(index === 2 ? 'hex' : undefined)
    );

    const [
      name,
      type,
      owner,
      minted,
      burnt,
      decimals,
      isPaused,
      canUpgrade,
      canMint,
      canBurn,
      canChangeOwner,
      canPause,
      canFreeze,
      canWipe,
      canAddSpecialRoles,
      canTransferNFTCreateRole,
      NFTCreateStopped,
      wiped,
    ] = tokenProperties;

    const tokenProps = {
      identifier,
      name,
      type,
      owner: AddressUtils.bech32Encode(owner),
      minted,
      burnt,
      decimals: parseInt(decimals.split('-').pop() ?? '0'),
      isPaused: TokenUtils.canBool(isPaused),
      canUpgrade: TokenUtils.canBool(canUpgrade),
      canMint: TokenUtils.canBool(canMint),
      canBurn: TokenUtils.canBool(canBurn),
      canChangeOwner: TokenUtils.canBool(canChangeOwner),
      canPause: TokenUtils.canBool(canPause),
      canFreeze: TokenUtils.canBool(canFreeze),
      canWipe: TokenUtils.canBool(canWipe),
      canAddSpecialRoles: TokenUtils.canBool(canAddSpecialRoles),
      canTransferNFTCreateRole: TokenUtils.canBool(canTransferNFTCreateRole),
      NFTCreateStopped: TokenUtils.canBool(NFTCreateStopped),
      wiped: wiped.split('-').pop(),
    };

    if (type === 'FungibleESDT') {
      // @ts-ignore
      delete tokenProps.canAddSpecialRoles;
      // @ts-ignore
      delete tokenProps.canTransferNFTCreateRole;
      // @ts-ignore
      delete tokenProps.NFTCreateStopped;
      delete tokenProps.wiped;
    }

    return tokenProps;
  };
}