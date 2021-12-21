import { HttpStatus, Injectable, Logger } from "@nestjs/common";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { CachingService } from "src/common/caching/caching.service";
import { ApiService } from "src/common/network/api.service";
import { MediaMimeTypeEnum } from "src/endpoints/nfts/entities/media.mime.type";
import { Nft } from "src/endpoints/nfts/entities/nft";
import { NftMedia } from "src/endpoints/nfts/entities/nft.media";
import { NftType } from "src/endpoints/nfts/entities/nft.type";
import { BinaryUtils } from "src/utils/binary.utils";
import { Constants } from "src/utils/constants";
import { TokenUtils } from "src/utils/token.utils";


@Injectable()
export class NftMediaService {
  private readonly logger: Logger;
  private readonly IPFS_REQUEST_TIMEOUT = Constants.oneSecond() * 30 * 1000;
  private readonly NFT_THUMBNAIL_PREFIX;

  constructor(
    private readonly cachingService: CachingService,
    private readonly apiService: ApiService,
    private readonly apiConfigService: ApiConfigService,
  ) {
    this.logger = new Logger(NftMediaService.name);
    this.NFT_THUMBNAIL_PREFIX = this.apiConfigService.getExternalMediaUrl() + '/nfts/asset'
  }

  async fetchMedia(nft: Nft) {
    if (nft.type === NftType.MetaESDT) {
      return;
    }

    if (!nft.uris) {
      return;
    }

    const mediaArray: NftMedia[] = [];
    for (let uri of nft.uris) {
      if (!uri) {
        continue;
      }

      let fileProperties: { contentType: string, contentLength: number } | undefined = undefined;
        
      try {
        this.logger.log(`Started fetching media for nft with identifier '${nft.identifier}' and uri '${uri}'`);
        fileProperties = await this.getFilePropertiesFromIpfs(BinaryUtils.base64Decode(uri));
        this.logger.log(`Completed fetching media for nft with identifier '${nft.identifier}' and uri '${uri}'`);
      } catch (error) {
        this.logger.error(`Unexpected error when fetching media for nft with identifier '${nft.identifier}' and uri '${uri}'`);
        this.logger.error(error);
        throw error;
      }
      
      if (!fileProperties) {
        continue;
      }

      const nftMedia = new NftMedia();
      nftMedia.url = TokenUtils.computeNftUri(BinaryUtils.base64Decode(uri), this.NFT_THUMBNAIL_PREFIX);
      nftMedia.thumbnailUrl = `${this.apiConfigService.getExternalMediaUrl()}/nfts/thumbnail/${nft.collection}-${TokenUtils.getUrlHash(nftMedia.url)}`
      nftMedia.fileType = fileProperties.contentType;
      nftMedia.fileSize = fileProperties.contentLength;

      mediaArray.push(nftMedia);
    }

    await this.cachingService.setCache(
      `nftMedia:${nft.identifier}`,
      mediaArray,
      Constants.oneMonth() * 12,
    );

    nft.media = mediaArray;
  }

  private async getFilePropertiesFromIpfs(uri: string): Promise<{ contentType: string, contentLength: number } | undefined> {
    const response = await this.apiService.head(uri, this.IPFS_REQUEST_TIMEOUT);
    if (response.status !== HttpStatus.OK) {
      this.logger.error(`Unexpected http status code '${response.status}' while fetching file properties from uri '${uri}'`);
      return undefined;
    }

    const { headers } = response;
    const contentType = headers['content-type'];
    const contentLength = Number(headers['content-length']);

    if (!this.isContentAccepted(contentType)) {
      return undefined;
    }

    return { contentType, contentLength };
  }

  private isContentAccepted(contentType: MediaMimeTypeEnum) {
    return Object.values(MediaMimeTypeEnum).includes(contentType);
  }
}