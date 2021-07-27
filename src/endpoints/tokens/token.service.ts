import { Injectable, Logger } from "@nestjs/common";
import { ApiConfigService } from "src/helpers/api.config.service";
import { CachingService } from "src/helpers/caching.service";
import { GatewayService } from "src/helpers/gateway.service";
import { base64Decode, bech32Decode, bech32Encode, mergeObjects, oneDay, oneHour, oneWeek } from "src/helpers/helpers";
import { VmQueryService } from "src/endpoints/vm.query/vm.query.service";
import { Token } from "./entities/token";
import { TokenWithBalance } from "./entities/token.with.balance";
import { TokenDetailed } from "./entities/token.detailed";
import { TokenProperties } from "./entities/token.properties";
import { NftType } from "./entities/nft.type";
import { ElasticService } from "src/helpers/elastic.service";
import { Nft } from "./entities/nft";
import { NftDetailed } from "./entities/nft.detailed";
import { NftOwner } from "./entities/nft.owner";
import { NftAccount } from "./entities/nft.account";
import { TokenAssetService } from "src/helpers/token.asset.service";
import { NftCollection } from "./entities/nft.collection";
import { NftFilter } from "./entities/nft.filter";
import { ApiService } from "src/helpers/api.service";
import { QueryPagination } from "src/common/entities/query.pagination";
import { CollectionFilter } from "./entities/collection.filter";
import { NftMetadata } from "./entities/nft.metadata";

@Injectable()
export class TokenService {
  private readonly logger: Logger

  constructor(
    private readonly gatewayService: GatewayService, 
    private readonly apiConfigService: ApiConfigService,
    private readonly cachingService: CachingService,
    private readonly vmQueryService: VmQueryService,
    private readonly elasticService: ElasticService,
    private readonly tokenAssetService: TokenAssetService,
    private readonly apiService: ApiService
  ) {
    this.logger = new Logger(TokenService.name);
  }

  async getToken(identifier: string): Promise<TokenDetailed | undefined> {
    let tokens = await this.getAllTokens();
    let token = tokens.find(x => x.identifier === identifier);
    if (token) {
      token.assets = await this.tokenAssetService.getAssets(token.identifier);

      return mergeObjects(new TokenDetailed(), token);
    }

    return undefined;
  }

  async getTokens(queryPagination: QueryPagination, search: string | undefined): Promise<TokenDetailed[]> {
    const { from, size } = queryPagination;

    let tokens = await this.getAllTokens();

    if (search) {
      let searchLower = search.toLowerCase();

      tokens = tokens.filter(token => token.name.toLowerCase().includes(searchLower) || token.identifier.toLowerCase().includes(searchLower));
    }

    tokens = tokens.slice(from, from + size);

    for (let token of tokens) {
      token.assets = await this.tokenAssetService.getAssets(token.identifier);
    }

    return tokens.map(item => mergeObjects(new TokenDetailed(), item));
  }

  async getTokenCount(search: string | undefined): Promise<number> {
    let tokens = await this.getAllTokens();

    if (search) {
      let searchLower = search.toLowerCase();

      tokens = tokens.filter(token => token.name.toLowerCase().includes(searchLower) || token.identifier.toLowerCase().includes(searchLower));
    }

    return tokens.length;
  }

  async getNft(identifier: string): Promise<TokenProperties | undefined> {
    let properties = await this.cachingService.getOrSetCache(
      `nft:${identifier}`,
      async () => await this.getTokenProperties(identifier),
      oneWeek(),
      oneDay()
    );
    
    if (!properties) {
      return undefined;
    }

    return mergeObjects(new TokenProperties(), properties);
  }

  async getNftCollections(queryPagination: QueryPagination, filter: CollectionFilter): Promise<NftCollection[]> {
    const { from, size } = queryPagination;

    let tokenCollections = await this.elasticService.getTokenCollections(from, size, filter.search, filter.type, undefined, filter.issuer, filter.identifiers);

    let nftCollections: NftCollection[] = [];
    for (let tokenCollection of tokenCollections) {
      let nftCollection = new NftCollection();
      nftCollection.collection = tokenCollection.token;

      mergeObjects(nftCollection, tokenCollection);

      let nft = await this.getNft(nftCollection.collection);
      if (nft) {
        mergeObjects(nftCollection, nft);
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

    mergeObjects(nftCollection, tokenCollection);

    let nft = await this.getNft(nftCollection.collection);
    if (nft) {
      mergeObjects(nftCollection, nft);
    }

    return nftCollection;
  }

  async getNfts(queryPagination: QueryPagination, filter: NftFilter): Promise<Nft[]> {
    const  { from, size } = queryPagination;

    return await this.getNftsInternal(from, size, filter, undefined);
  }

  async getSingleNft(identifier: string): Promise<NftDetailed | undefined> {
    let nfts = await this.getNftsInternal(0, 1, new NftFilter(), identifier);
    if (nfts.length === 0) {
      return undefined;
    }

    let nft: NftDetailed = mergeObjects(new NftDetailed(), nfts[0]);

    if (nft.identifier.toLowerCase() !== identifier.toLowerCase()) {
      return undefined;
    }

    let accountsEsdt = await this.elasticService.getAccountEsdtByIdentifier(nft.identifier);
    if (nft.type === NftType.NonFungibleESDT) {
      nft.owner = accountsEsdt[0].address;
      
      // @ts-ignore
      delete nft.owners;
    } else {
      nft.owners = accountsEsdt.map((esdt: any) => {
        let owner = new NftOwner();
        owner.address = esdt.address;
        owner.balance = esdt.balance;

        return owner;
      });

      // @ts-ignore
      delete nft.owner;
    }

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
            nft.url = base64Decode(nft.uris[0]);
          } catch (error) {
            this.logger.error(error);
          }
        }

        if (elasticNftData.metadata) {
          nft.metadata = await this.getExtendedAttributesFromDescription(elasticNftData.metadata);
        } else {
          nft.metadata = undefined;
        }
      }

      nfts.push(nft);
    }

    await this.updateThumbnailUrlForNfts(nfts);

    for (let nft of nfts) {
      if (nft.type === NftType.SemiFungibleESDT) {
        let gatewayNft = await this.getNft(nft.collection);
        if (gatewayNft) {
          nft.name = gatewayNft.name;
        }
      }
    }

    return nfts;
  }

  async updateThumbnailUrlForNfts(nfts: Nft[]) {
    let confirmations = await this.cachingService.batchProcess(
      nfts,
      nft => `nftCustomThumbnail:${nft.identifier}`,
      async (nft) => await this.hasCustomThumbnail(nft.identifier),
      oneHour()
    );

    for (let [index, nft] of nfts.entries()) {
      let isCustomThumbnail = confirmations[index];
      if (isCustomThumbnail === true) {
        nft.thumbnailUrl = `${this.apiConfigService.getMediaUrl()}/nfts/${nft.identifier}.png`;
      } else if (nft.metadata && nft.metadata.fileType) {
        nft.thumbnailUrl = `${this.apiConfigService.getMediaUrl()}/${nft.metadata.fileType.replace('/', '-')}.png`;
      } else {
        nft.thumbnailUrl = `${this.apiConfigService.getMediaUrl()}/smiley.png`;
      }
    }
  }

  async hasCustomThumbnail(nftIdentifier: string): Promise<boolean> {
    try {
      const { status } = await this.apiService.head(`${this.apiConfigService.getMediaUrl()}/nfts/${nftIdentifier}.png`);

      return status === 200;
    } catch (error) {
      return false;
    }
  }

  async getNftCount(filter: NftFilter): Promise<number> {
    return await this.elasticService.getTokenCount(filter);
  }
  
  async getTokenCountForAddress(address: string): Promise<number> {
    let tokens = await this.getAllTokensForAddress(address);
    return tokens.length;
  }

  async getTokensForAddress(address: string, queryPagination: QueryPagination): Promise<TokenWithBalance[]> {
    const { from, size } = queryPagination;
    
    let tokens = await this.getAllTokensForAddress(address);

    tokens = tokens.slice(from, from + size);

    for (let token of tokens) {
      token.assets = await this.tokenAssetService.getAssets(token.identifier);
    }

    return tokens.map(token => mergeObjects(new TokenWithBalance(), token));
  }

  async getCollectionsForAddress(address: string, queryPagination: QueryPagination): Promise<NftCollection[]> {
    let esdtResult = await this.gatewayService.get(`address/${address}/esdts-with-role/ESDTRoleNFTCreate`);

    if (esdtResult.tokens.length === 0) {
      return [];
    }

    let filter = new CollectionFilter();
    filter.identifiers = esdtResult.tokens;

    return await this.getNftCollections(queryPagination, filter);
  }

  async getCollectionCountForAddress(address: string): Promise<number> {
    let esdtResult = await this.gatewayService.get(`address/${address}/esdts-with-role/ESDTRoleNFTCreate`);

    return esdtResult.tokens.length;
  }

  async getTokenForAddress(address: string, tokenIdentifier: string): Promise<TokenWithBalance | undefined> {
    let allTokens = await this.getAllTokensForAddress(address);

    let foundToken = allTokens.find(x => x.identifier === tokenIdentifier);
    if (!foundToken) {
      return undefined;
    }

    foundToken.assets = await this.tokenAssetService.getAssets(tokenIdentifier);

    return foundToken;
  }

  async getAllTokensForAddress(address: string): Promise<TokenWithBalance[]> {
    let tokens = await this.getAllTokens();

    let tokensIndexed: { [index: string]: Token } = {};
    for (let token of tokens) {
      tokensIndexed[token.identifier] = token;
    }

    let esdtResult = await this.gatewayService.get(`address/${address}/esdt`);

    let tokensWithBalance: TokenWithBalance[] = [];

    for (let tokenIdentifier of Object.keys(esdtResult.esdts)) {
      if (!this.isEsdt(tokenIdentifier)) {
        continue;
      }

      let esdt = esdtResult.esdts[tokenIdentifier];
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

  isEsdt(tokenIdentifier: string) {
    return tokenIdentifier.split('-').length === 2;
  }

  getNftGlobalIdentifier(tokenIdentifier: string) {
    let parts = tokenIdentifier.split('-');
    parts.length = 2;
    return parts.join('-');
  }

  async getNftsForAddress(address: string, queryPagination: QueryPagination, filter: NftFilter): Promise<NftAccount[]> {
    const { from, size }  = queryPagination;

    let nfts = await this.getNftsForAddressInternal(address, filter);

    nfts = nfts.splice(from, from + size);

    let identifiers = nfts.map(x => x.identifier);
    let elasticNfts = await this.elasticService.getTokensByIdentifiers(identifiers);

    for (let nft of nfts) {
      let elasticNft = elasticNfts.find((x: any) => x.identifier === nft.identifier);
      if (elasticNft) {
        nft.timestamp = elasticNft.timestamp;
      }
    }

    return nfts;
  }

  async getNftCountForAddress(address: string, filter: NftFilter): Promise<number> {
    let nfts = await this.getNftsForAddressInternal(address, filter);

    return nfts.length;
  }

  async getNftsForAddressInternal(address: string, filter: NftFilter): Promise<NftAccount[]> {
    let gatewayNftResult = await this.gatewayService.get(`address/${address}/esdt`);

    let gatewayNfts = Object.values(gatewayNftResult['esdts']).map(x => x as any);

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

      if (nft.uris && nft.uris.length > 0) {
        try {
          nft.url = base64Decode(nft.uris[0]);
        } catch (error) {
          this.logger.error(error);
        }
      }

      nft.attributes = gatewayNft.attributes;
      nft.balance = gatewayNft.balance;
      
      if (gatewayNft.attributes) {
        nft.tags = this.getTags(gatewayNft.attributes);
        nft.metadata = await this.getExtendedAttributesFromRawAttributes(gatewayNft.attributes);
      }

      let gatewayNftDetails = await this.getNft(nft.collection);
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

    await this.updateThumbnailUrlForNfts(nfts);

    return nfts;
  }

  async getExtendedAttributesFromRawAttributes(attributes: string): Promise<NftMetadata | undefined> {
    let description = this.getDescription(attributes);
    if (description === undefined) {
      return undefined;
    }

    return this.getExtendedAttributesFromDescription(description);
  }
  
  async getExtendedAttributesFromDescription(description: string): Promise<NftMetadata | undefined> {
    let result = await this.cachingService.getOrSetCache<NftMetadata>(
      `nftExtendedAttributes:${description}`,
      async () => await this.getExtendedAttributesFromIpfs(description ?? ''),
      oneWeek(),
      oneDay()
    );

    if (Object.keys(result).length > 0) {
      return result;
    }

    return undefined;
  }

  async getExtendedAttributesFromIpfs(description: string): Promise<NftMetadata> {
    try {
      let result = await this.apiService.get(`https://ipfs.io/ipfs/${description}`, 1000);
      return result.data;
    } catch (error) {
      this.logger.error(error);
      return new NftMetadata();
    }
  }

  getTags(attributes: string): string[] {
    let decodedAttributes = base64Decode(attributes);
    let match = decodedAttributes.match(/tags:(?<tags>[\w\s\,]*)/);
    if (!match || !match.groups) {
      return [];
    }

    return match.groups['tags'].split(',');
  }

  getDescription(attributes: string): string | undefined {
    let decodedAttributes = base64Decode(attributes);
    let match = decodedAttributes.match(/description:(?<description>[\w]*)/);
    if (!match || !match.groups) {
      return undefined;
    }

    return match.groups['description'];
  }

  async getNftForAddress(address: string, identifier: string): Promise<NftAccount | undefined> {
    let nfts = await this.getNftsForAddressInternal(address, new NftFilter());
    return nfts.find(x => x.identifier === identifier);
  }

  async getStakeForAddress(address: string) {
    const [totalStakedEncoded, unStakedTokensListEncoded] = await Promise.all([
      this.vmQueryService.vmQuery(
        this.apiConfigService.getAuctionContractAddress(),
        'getTotalStaked',
        address,
      ),
      this.vmQueryService.vmQuery(
        this.apiConfigService.getAuctionContractAddress(),
        'getUnStakedTokensList',
        address,
        [ bech32Decode(address) ],
      ),
    ]);

    const data: any = {
      totalStaked: '0',
      unstakedTokens: undefined,
    };

    if (totalStakedEncoded) {
      data.totalStaked = Buffer.from(totalStakedEncoded[0], 'base64').toString('ascii');
    }

    if (unStakedTokensListEncoded) {
      data.unstakedTokens = unStakedTokensListEncoded.reduce((result: any, _, index, array) => {
        if (index % 2 === 0) {
          const [encodedAmount, encodedEpochs] = array.slice(index, index + 2);

          const amountHex = Buffer.from(encodedAmount, 'base64').toString('hex');
          const amount = BigInt(amountHex ? '0x' + amountHex : amountHex).toString();

          const epochsHex = Buffer.from(encodedEpochs, 'base64').toString('hex');
          const epochs = parseInt(BigInt(epochsHex ? '0x' + epochsHex : epochsHex).toString());

          result.push({ amount, epochs });
        }

        return result;
      }, []);

      const networkConfig = await this.getNetworkConfig();

      for (const element of data.unstakedTokens) {
        element.expires = element.epochs
          ? this.getExpires(element.epochs, networkConfig.roundsPassed, networkConfig.roundsPerEpoch, networkConfig.roundDuration)
          : undefined;
        delete element.epochs;
      }
    }

    return data;
  }

  getExpires(epochs: number, roundsPassed: number, roundsPerEpoch: number, roundDuration: number) {
    const now = Math.floor(Date.now() / 1000);
  
    if (epochs === 0) {
      return now;
    }
  
    const fullEpochs = (epochs - 1) * roundsPerEpoch * roundDuration;
    const lastEpoch = (roundsPerEpoch - roundsPassed) * roundDuration;
  
    // this.logger.log('expires', JSON.stringify({ epochs, roundsPassed, roundsPerEpoch, roundDuration }));
  
    return now + fullEpochs + lastEpoch;
  };

  async getNetworkConfig() {
    const [
      {
        config: { erd_round_duration, erd_rounds_per_epoch },
      },
      {
        status: { erd_rounds_passed_in_current_epoch },
      },
    ] = await Promise.all([
      this.gatewayService.get('network/config'),
      this.gatewayService.get('network/status/4294967295')
    ]);
  
    const roundsPassed = erd_rounds_passed_in_current_epoch;
    const roundsPerEpoch = erd_rounds_per_epoch;
    const roundDuration = erd_round_duration / 1000;
  
    return { roundsPassed, roundsPerEpoch, roundDuration };
  };

  async getAllTokens(): Promise<TokenDetailed[]> {
    return this.cachingService.getOrSetCache(
      'allTokens',
      async () => await this.getAllTokensRaw(),
      oneHour()
    );
  }

  async getAllTokensRaw(): Promise<TokenDetailed[]> {
    const {
      tokens: tokensIdentifiers,
    } = await this.gatewayService.get('network/esdt/fungible-tokens');

    let tokens = await this.cachingService.batchProcess(
      tokensIdentifiers,
      token => `tokenProperties:${token}`,
      async (token: string) => await this.getTokenProperties(token),
      oneDay()
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
      owner: bech32Encode(owner),
      minted,
      burnt,
      decimals: parseInt(decimals.split('-').pop() ?? '0'),
      isPaused: this.canBool(isPaused),
      canUpgrade: this.canBool(canUpgrade),
      canMint: this.canBool(canMint),
      canBurn: this.canBool(canBurn),
      canChangeOwner: this.canBool(canChangeOwner),
      canPause: this.canBool(canPause),
      canFreeze: this.canBool(canFreeze),
      canWipe: this.canBool(canWipe),
      canAddSpecialRoles: this.canBool(canAddSpecialRoles),
      canTransferNFTCreateRole: this.canBool(canTransferNFTCreateRole),
      NFTCreateStopped: this.canBool(NFTCreateStopped),
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

  canBool(string: string) {
    return string.split('-').pop() === 'true';
  };
}