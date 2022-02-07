import { Injectable, Logger } from "@nestjs/common";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { GatewayComponentRequest } from "src/common/gateway/entities/gateway.component.request";
import { GatewayService } from "src/common/gateway/gateway.service";
import { BinaryUtils } from "src/utils/binary.utils";
import { TokenUtils } from "src/utils/token.utils";
import { EsdtDataSource } from "../esdt/entities/esdt.data.source";
import { EsdtService } from "../esdt/esdt.service";
import { GatewayNft } from "./entities/gateway.nft";
import { NftAccount } from "./entities/nft.account";
import { NftFilter } from "./entities/nft.filter";
import { NftType } from "./entities/nft.type";
import { NftExtendedAttributesService } from "./nft.extendedattributes.service";

@Injectable()
export class NftAccountService {
  private readonly logger: Logger;
  private readonly NFT_THUMBNAIL_PREFIX: string;

  constructor(
    private readonly gatewayService: GatewayService,
    private readonly apiConfigService: ApiConfigService,
    private readonly nftExtendedAttributesService: NftExtendedAttributesService,
    private readonly esdtService: EsdtService,
  ) {
    this.logger = new Logger(NftAccountService.name);
    this.NFT_THUMBNAIL_PREFIX = this.apiConfigService.getExternalMediaUrl() + '/nfts/asset';
  }

  async getNftsForAddressInternal(address: string, filter: NftFilter, source?: EsdtDataSource): Promise<NftAccount[]> {
    const accountNfts = await this.getAccountNfts(address, filter, source);

    accountNfts.sort((a: GatewayNft, b: GatewayNft) => a.tokenIdentifier.localeCompare(b.tokenIdentifier, 'en', { sensitivity: 'base' }));

    let nfts: NftAccount[] = [];

    for (const dataSourceNft of accountNfts) {
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
          nft.url = TokenUtils.computeNftUri(BinaryUtils.base64Decode(nft.uris[0]), this.NFT_THUMBNAIL_PREFIX);
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

      nfts.push(nft);
    }

    nfts = await this.filterNfts(filter, nfts);

    return nfts;
  }

  private async getAccountNfts(address: string, filter: NftFilter, source?: EsdtDataSource): Promise<GatewayNft[]> {
    if (filter.identifiers !== undefined) {
      const identifiers = filter.identifiers;
      if (identifiers.length === 1) {
        const identifier = identifiers[0];
        const collectionIdentifier = identifier.split('-').slice(0, 2).join('-');
        const nonce = parseInt(identifier.split('-')[2], 16);

        const { tokenData: gatewayNft } = await this.gatewayService.get(`address/${address}/nft/${collectionIdentifier}/nonce/${nonce}`, GatewayComponentRequest.addressNftByNonce);

        // normalizing tokenIdentifier since it doesn't contain the nonce in this particular scenario
        gatewayNft.tokenIdentifier = identifier;

        if (gatewayNft.balance === '0') {
          return [];
        }

        return [gatewayNft];
      }

      if (identifiers.length > 1) {
        const esdts = await this.esdtService.getAllEsdtsForAddress(address, source);
        return Object.values(esdts).map(x => x as any).filter(x => identifiers.includes(x.tokenIdentifier));
      }
    }

    const esdts = await this.esdtService.getAllEsdtsForAddress(address, source);
    return Object.values(esdts).map(x => x as any).filter(x => x.tokenIdentifier.split('-').length === 3);
  }

  private async filterNfts(filter: NftFilter, nfts: NftAccount[]): Promise<NftAccount[]> {
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();

      nfts = nfts.filter(x => x.name.toLowerCase().includes(searchLower) || x.identifier.toLowerCase().includes(searchLower));
    }

    if (filter.type) {
      const types = filter.type;

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

    return nfts;
  }
}
