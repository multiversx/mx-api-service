import { Injectable, Logger } from "@nestjs/common";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { QueryPagination } from "src/common/entities/query.pagination";
import { NftExtendedAttributesService } from "src/endpoints/nfts/nft.extendedattributes.service";
import { ApiUtils } from "src/utils/api.utils";
import { BinaryUtils } from "src/utils/binary.utils";
import { TokenUtils } from "src/utils/tokens.utils";
import { Nft } from "./entities/nft";
import { NftAccount } from "./entities/nft.account";
import { NftFilter } from "./entities/nft.filter";
import { NftOwner } from "./entities/nft.owner";
import { NftType } from "./entities/nft.type";
import { NftQueryOptions } from "./entities/nft.query.options";
import { GatewayService } from "src/common/gateway/gateway.service";
import { ElasticService } from "src/common/elastic/elastic.service";
import { EsdtService } from "../esdt/esdt.service";
import { TokenAssetService } from "../tokens/token.asset.service";
import { GatewayNft } from "./entities/gateway.nft";
import { ElasticQuery } from "src/common/elastic/entities/elastic.query";
import { QueryConditionOptions } from "src/common/elastic/entities/query.condition.options";
import { QueryType } from "src/common/elastic/entities/query.type";
import { QueryOperator } from "src/common/elastic/entities/query.operator";
import { CachingService } from "src/common/caching/caching.service";
import { Constants } from "src/utils/constants";
import { GatewayComponentRequest } from "src/common/gateway/entities/gateway.component.request";
import asyncPool from "tiny-async-pool";

@Injectable()
export class NftService {
  private readonly logger: Logger
  private readonly NFT_THUMBNAIL_PREFIX: string;

  constructor(
    private readonly gatewayService: GatewayService,
    private readonly apiConfigService: ApiConfigService,
    private readonly elasticService: ElasticService,
    private readonly nftExtendedAttributesService: NftExtendedAttributesService,
    private readonly esdtService: EsdtService,
    private readonly tokenAssetService: TokenAssetService,
    private readonly cachingService: CachingService,
  ) {
    this.logger = new Logger(NftService.name);
    this.NFT_THUMBNAIL_PREFIX = this.apiConfigService.getExternalMediaUrl() + '/nfts/asset';
  }

  async getNfts(queryPagination: QueryPagination, filter: NftFilter, queryOptions?: NftQueryOptions): Promise<Nft[]> {
    const { from, size } = queryPagination;

    let nfts =  await this.getNftsInternal(from, size, filter, undefined, queryOptions);

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

  private async applyNftOwner(nft: Nft): Promise<void> {
    if (nft.type === NftType.NonFungibleESDT) {
      let accountsEsdt = await this.elasticService.getAccountEsdtByIdentifier(nft.identifier);
      if (accountsEsdt.length > 0) {
        nft.owner = accountsEsdt[0].address;
      }
    }
  }

  async applyAssetsAndTicker(token: Nft) {
    token.assets = await this.tokenAssetService.getAssets(token.collection);

    if (token.assets) {
      token.ticker = token.collection.split('-')[0];
    } else {
      token.ticker = token.collection;
    }
  }

  async getSingleNft(identifier: string): Promise<Nft | undefined> {
    let nfts = await this.getNftsInternal(0, 1, new NftFilter(), identifier);
    if (nfts.length === 0) {
      return undefined;
    }

    let nft: Nft = ApiUtils.mergeObjects(new Nft(), nfts[0]);

    if (nft.identifier.toLowerCase() !== identifier.toLowerCase()) {
      return undefined;
    }

    nft.supply = await this.esdtService.getTokenSupply(nft.identifier);

    await this.applyNftOwner(nft);

    await this.applyAssetsAndTicker(nft);

    await this.applyNftMetadata(nft);

    return nft;
  }

  async applyNftMetadata(nft: Nft) {
    if (nft.attributes) {
      try {
        nft.metadata = await this.nftExtendedAttributesService.tryGetExtendedAttributesFromBase64EncodedAttributes(nft.attributes);
      } catch (error) {
        this.logger.error(error);
        this.logger.error(`Error when getting metadata for nft with identifier '${nft.identifier}'`);
      }
    }
  }

  async getNftOwners(identifier: string, pagination: QueryPagination): Promise<NftOwner[] | undefined> {
    let accountsEsdt = await this.elasticService.getAccountEsdtByIdentifier(identifier, pagination);
    
    return accountsEsdt.map((esdt: any) => {
      let owner = new NftOwner();
      owner.address = esdt.address;
      owner.balance = esdt.balance;

      return owner;
    });
  }

  async getNftsInternal(from: number, size: number, filter: NftFilter, identifier: string | undefined, queryOptions?: NftQueryOptions): Promise<Nft[]> {
    let elasticNfts = await this.elasticService.getNftTokens(from, size, filter, identifier);

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

        nft.isWhitelistedStorage = nft.url.startsWith(this.NFT_THUMBNAIL_PREFIX);

        if (elasticNftData.metadata) {
          nft.attributes = BinaryUtils.base64Encode(`metadata:${elasticNftData.metadata}`);
        } 
      }

      nfts.push(nft);
    }

    if (queryOptions && queryOptions.withMetadata) {
      await asyncPool(
        this.apiConfigService.getPoolLimit(), 
        nfts,
        async nft => await this.applyNftMetadata(nft)
      );
    }

    this.updateThumbnailUrlForNfts(nfts);


    for (let nft of nfts) {
      let collectionProperties = await this.esdtService.getEsdtTokenProperties(nft.collection);

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

  async getNftOwnersCount(identifier: string): Promise<number> {
    return this.cachingService.getOrSetCache(
      `nftOwnerCount:${identifier}`,
      async () => await this.getNftOwnersCountRaw(identifier),
      Constants.oneMinute()
    );
  }

  async getNftOwnersCountRaw(identifier: string): Promise<number> {
    const elasticQuery = ElasticQuery.create()
      .withCondition(QueryConditionOptions.must, [ QueryType.Match('identifier', identifier, QueryOperator.AND) ]);

    return await this.elasticService.getCount('accountsesdt', elasticQuery);
  }

  updateThumbnailUrlForNfts(nfts: Nft[]) {
    let mediaNfts = nfts.filter(nft => nft.type !== NftType.MetaESDT && nft.uris.filter(uri => uri).length > 0);
    for (let mediaNft of mediaNfts) {
      mediaNft.thumbnailUrl = `${this.apiConfigService.getExternalMediaUrl()}/nfts/thumbnail/${mediaNft.identifier}`;
    }
  }

  async getNftCount(filter: NftFilter): Promise<number> {
    return await this.elasticService.getNftTokensCount(filter);
  }

  async getNftsForAddress(address: string, queryPagination: QueryPagination, filter: NftFilter, queryOptions?: NftQueryOptions): Promise<NftAccount[]> {
    const { from, size } = queryPagination;

    let nfts = await this.getNftsForAddressInternal(address, filter, queryOptions);

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
      let types = filter.type;

      nfts = nfts.filter(x => types.includes(x.type));
    }

    if (filter.collection) {
      nfts = nfts.filter(x => x.collection === filter.collection);
    }

    if (filter.collections) {
      let collectionsArray = filter.collections;
      nfts = nfts.filter(x => collectionsArray.includes(x.collection));
    }

    if (filter.tags) {
      let tagsArray = filter.tags;
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
      let identifiers = filter.identifiers;
      if (identifiers.length === 1) {
        let identifier = identifiers[0];
        const collectionIdentifier = identifier.split('-').slice(0, 2).join('-');
        const nonce = parseInt(identifier.split('-')[2], 16);

        const { tokenData: gatewayNft } = await this.gatewayService.get(`address/${address}/nft/${collectionIdentifier}/nonce/${nonce}`, GatewayComponentRequest.addressNftByNonce);

        // normalizing tokenIdentifier since it doesn't contain the nonce in this particular scenario
        gatewayNft.tokenIdentifier = identifier;

        if (gatewayNft.balance === '0') {
          return [];
        }

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

  async getNftsForAddressInternal(address: string, filter: NftFilter, queryOptions?: NftQueryOptions): Promise<NftAccount[]> {
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
      nft.uris = gatewayNft.uris ? gatewayNft.uris.filter((x: any) => x) : [];
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

      nft.isWhitelistedStorage = nft.url.startsWith(this.NFT_THUMBNAIL_PREFIX);

      nft.attributes = gatewayNft.attributes;

      if (gatewayNft.attributes) {
        nft.tags = this.nftExtendedAttributesService.getTags(gatewayNft.attributes);
      }

      let collectionDetails = await this.esdtService.getEsdtTokenProperties(nft.collection);
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

    if (queryOptions && queryOptions.withMetadata) {
      await asyncPool(
        this.apiConfigService.getPoolLimit(), 
        nfts,
        async nft => await this.applyNftMetadata(nft)
      );
    }

    return nfts;
  }

  async getNftForAddress(address: string, identifier: string): Promise<NftAccount | undefined> {
    let filter = new NftFilter();
    filter.identifiers = [identifier];

    let nfts = await this.getNftsForAddressInternal(address, filter);
    if (nfts.length === 0) {
      return undefined;
    }

    let nft = nfts[0];

    if (nft.type === NftType.SemiFungibleESDT) {
      nft.supply = await this.esdtService.getTokenSupply(identifier);
    }

    nft.assets = await this.tokenAssetService.getAssets(nft.collection);

    await this.applyNftMetadata(nft);

    return nft;
  }

}