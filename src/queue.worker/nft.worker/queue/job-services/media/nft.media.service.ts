import { CachingService } from "@elrondnetwork/nestjs-microservice-common";
import { BinaryUtils, Constants } from "@elrondnetwork/nestjs-microservice-common";
import { HttpStatus, Injectable, Logger } from "@nestjs/common";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { CacheInfo } from "src/common/caching/entities/cache.info";
import { ApiService } from "src/common/network/api.service";
import { PersistenceService } from "src/common/persistence/persistence.service";
import { MediaMimeTypeEnum } from "src/endpoints/nfts/entities/media.mime.type";
import { Nft } from "src/endpoints/nfts/entities/nft";
import { NftMedia } from "src/endpoints/nfts/entities/nft.media";
import { NftType } from "src/endpoints/nfts/entities/nft.type";
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
    private readonly persistenceService: PersistenceService,
  ) {
    this.logger = new Logger(NftMediaService.name);
    this.NFT_THUMBNAIL_PREFIX = this.apiConfigService.getExternalMediaUrl() + '/nfts/asset';
  }

  async getMedia(identifier: string): Promise<NftMedia[] | null> {
    return await this.cachingService.getOrSetCache(
      CacheInfo.NftMedia(identifier).key,
      async () => await this.persistenceService.getMedia(identifier),
      CacheInfo.NftMedia(identifier).ttl,
    );
  }

  async refreshMedia(nft: Nft): Promise<NftMedia[] | undefined> {
    const mediaRaw = await this.getMediaRaw(nft);
    if (!mediaRaw) {
      return undefined;
    }

    await this.persistenceService.setMedia(nft.identifier, mediaRaw);

    await this.cachingService.setCache(
      CacheInfo.NftMedia(nft.identifier).key,
      mediaRaw,
      CacheInfo.NftMedia(nft.identifier).ttl
    );

    return mediaRaw;
  }

  private async getMediaRaw(nft: Nft): Promise<NftMedia[] | null> {
    if (nft.type === NftType.MetaESDT) {
      return null;
    }

    if (!nft.uris) {
      return null;
    }

    const mediaArray: NftMedia[] = [];
    for (const uri of nft.uris) {
      if (!uri) {
        continue;
      }

      let fileProperties: { contentType: string, contentLength: number } | null = null;

      try {
        this.logger.log(`Started fetching media for nft with identifier '${nft.identifier}' and uri '${uri}'`);
        fileProperties = await this.getFileProperties(uri);
        this.logger.log(`Completed fetching media for nft with identifier '${nft.identifier}' and uri '${uri}'`);
      } catch (error) {
        this.logger.error(`Unexpected error when fetching media for nft with identifier '${nft.identifier}' and uri '${uri}'`);
        this.logger.error(error);
      }

      if (!fileProperties) {
        continue;
      }

      const nftMedia = new NftMedia();
      nftMedia.url = TokenUtils.computeNftUri(BinaryUtils.base64Decode(uri), this.NFT_THUMBNAIL_PREFIX);
      nftMedia.originalUrl = BinaryUtils.base64Decode(uri);
      nftMedia.thumbnailUrl = `${this.apiConfigService.getExternalMediaUrl()}/nfts/thumbnail/${nft.collection}-${TokenUtils.getUrlHash(nftMedia.url)}`;
      nftMedia.fileType = fileProperties.contentType;
      nftMedia.fileSize = fileProperties.contentLength;

      mediaArray.push(nftMedia);
    }

    return mediaArray;
  }

  private getUrl(nftUri: string, prefix: string): string {
    const url = BinaryUtils.base64Decode(nftUri);
    return TokenUtils.computeNftUri(url, prefix);
  }

  private async getFileProperties(uri: string): Promise<{ contentType: string, contentLength: number } | null> {
    return await this.cachingService.getOrSetCache(
      CacheInfo.NftMediaProperties(uri).key,
      async () => await this.getFilePropertiesRaw(uri),
      CacheInfo.NftMediaProperties(uri).ttl
    );
  }

  private async getFilePropertiesRaw(uri: string): Promise<{ contentType: string, contentLength: number } | null> {
    return await this.getFilePropertiesFromHeaders(uri, this.NFT_THUMBNAIL_PREFIX) ??
      await this.getFilePropertiesFromHeaders(uri, this.apiConfigService.getIpfsUrl());
  }

  private async getFilePropertiesFromHeaders(uri: string, prefix: string): Promise<{ contentType: string, contentLength: number } | null> {
    const url = this.getUrl(uri, prefix);
    if (url.endsWith('.json')) {
      return null;
    }

    const response = await this.apiService.head(url, { timeout: this.IPFS_REQUEST_TIMEOUT });

    if (response.status !== HttpStatus.OK) {
      this.logger.error(`Unexpected http status code '${response.status}' while fetching file properties from url '${url}'`);
      return null;
    }

    const { headers } = response;
    const contentType = headers['content-type'];
    const contentLength = Number(headers['content-length']);

    if (!this.isContentAccepted(contentType)) {
      return null;
    }

    return { contentType, contentLength };
  }

  private isContentAccepted(contentType: MediaMimeTypeEnum) {
    return Object.values(MediaMimeTypeEnum).includes(contentType);
  }
}
