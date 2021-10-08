import { Injectable, Logger } from "@nestjs/common";
import { ApiConfigService } from "src/common/api.config.service";
import { CachingService } from "src/common/caching.service";
import { ElasticService } from "src/common/elastic.service";
import { QueryPagination } from "src/common/entities/query.pagination";
import { GatewayService } from "src/common/gateway.service";
import { NftExtendedAttributesService } from "src/common/nft.extendedattributes.service";
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
import { EsdtService } from "src/common/esdt.service";
import { NftQueryOptions } from "./entities/nft.query.options";

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
  ) {
    this.logger = new Logger(NftService.name);
    this.NFT_THUMBNAIL_PREFIX = this.apiConfigService.getExternalMediaUrl() + '/nfts/asset';
  }

  async getCollection(identifier: string): Promise<TokenProperties | undefined> {
    let properties = await this.cachingService.getOrSetCache(
      `nft:${identifier}`,
      async () => await this.esdtService.getEsdtTokenProperties(identifier),
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

  private async getSftSupply(identifier: string) {
    const { supply } = await this.gatewayService.get(`network/esdt/supply/${identifier}`);

    return supply;
  }

  async getNfts(queryPagination: QueryPagination, filter: NftFilter, queryOptions?: NftQueryOptions): Promise<Nft[] | NftDetailed[]> {
    const { from, size } = queryPagination;

    let nfts =  await this.getNftsInternal(from, size, filter, undefined);
    
    if (queryOptions && queryOptions.withOwner) {
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

    if (queryOptions && queryOptions.withSupply) {
      for (let nft of nfts) {
        if (nft.type === NftType.SemiFungibleESDT) {
          nft.supply = await this.cachingService.getOrSetCache(
            `tokenSupply:${nft.identifier}`,
            async () => await this.getSftSupply(nft.identifier),
            Constants.oneHour()
          );
        }
      }
    }
    
    return nfts;
  }
  
  private async getNftDistribution(identifier: string, nftDetailed: NftDetailed): Promise<NftDetailed> {
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

    nft = await this.getNftDistribution(nft.identifier, nft);

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
            nft.url = TokenUtils.computeNftUri(BinaryUtils.base64Decode(nft.uris[0]), this.NFT_THUMBNAIL_PREFIX);
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

    await this.updateThumbnailUrlForNfts(nfts);

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

  updateThumbnailUrlForNfts(nfts: Nft[]) {
    let mediaNfts = nfts.filter(nft => nft.uris.filter(uri => uri).length > 0);
    for (let mediaNft of mediaNfts) {
      mediaNft.thumbnailUrl = `${this.apiConfigService.getExternalMediaUrl()}/nfts/thumbnail/${mediaNft.identifier}`;
    }
  }


  async getNftCount(filter: NftFilter): Promise<number> {
    return await this.elasticService.getTokenCount(filter);
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

  async getNftsForAddress(address: string, queryPagination: QueryPagination, filter: NftFilter, queryOptions?: NftQueryOptions): Promise<NftAccount[]> {
    const { from, size }  = queryPagination;

    let nfts = await this.getNftsForAddressInternal(address, filter);

    nfts = nfts.splice(from, from + size);

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

    return nfts;
  }

  async getNftCountForAddress(address: string, filter: NftFilter): Promise<number> {
    let nfts = await this.getNftsForAddressInternal(address, filter);

    return nfts.length;
  }

  private async filterNfts(filter: NftFilter, nfts: NftAccount[]): Promise<NftAccount[]> {
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

    return nfts;
  }

  async getNftsForAddressInternal(address: string, filter: NftFilter): Promise<NftAccount[]> {
    let esdts = await this.esdtService.getAllEsdtsForAddress(address);

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

    await this.filterNfts(filter, nfts);

    await this.updateThumbnailUrlForNfts(nfts);

    return nfts;
  }

  async getNftForAddress(address: string, identifier: string): Promise<NftAccount | undefined> {
    let nfts = await this.getNftsForAddressInternal(address, new NftFilter());
    return nfts.find(x => x.identifier === identifier);
  }

}