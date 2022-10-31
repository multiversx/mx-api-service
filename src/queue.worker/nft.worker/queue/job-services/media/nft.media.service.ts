import { ApiService, CachingService } from "@elrondnetwork/erdnest";
import { BinaryUtils, Constants } from "@elrondnetwork/erdnest";
import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { CacheInfo } from "src/utils/cache.info";
import { PersistenceService } from "src/common/persistence/persistence.service";
import { MediaMimeTypeEnum } from "src/endpoints/nfts/entities/media.mime.type";
import { Nft } from "src/endpoints/nfts/entities/nft";
import { NftMedia } from "src/endpoints/nfts/entities/nft.media";
import { NftType } from "src/endpoints/nfts/entities/nft.type";
import { TokenHelpers } from "src/utils/token.helpers";
import { ClientProxy } from "@nestjs/microservices";
import { OriginLogger } from "@elrondnetwork/erdnest";
import { CachingUtils } from "src/utils/caching.utils";

@Injectable()
export class NftMediaService {
  private readonly logger = new OriginLogger(NftMediaService.name);
  private readonly IPFS_REQUEST_TIMEOUT = Constants.oneSecond() * 30 * 1000;
  private readonly NFT_THUMBNAIL_PREFIX;
  public static readonly NFT_THUMBNAIL_DEFAULT = 'https://media.elrond.com/nfts/thumbnail/default.png';

  constructor(
    private readonly cachingService: CachingService,
    private readonly apiService: ApiService,
    private readonly apiConfigService: ApiConfigService,
    private readonly persistenceService: PersistenceService,
    @Inject('PUBSUB_SERVICE') private clientProxy: ClientProxy,
  ) {
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

    await this.clientProxy.emit('refreshCacheKey', {
      key: CacheInfo.NftMedia(nft.identifier).key,
      ttl: CacheInfo.NftMedia(nft.identifier).ttl,
    });

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

      let fileProperties: { contentType: string, contentLength: number } | null | undefined = null;

      try {
        const cacheIdentifier = `${nft.identifier}-${TokenHelpers.getUrlHash(uri)}`;

        fileProperties = await CachingUtils.executeOptimistic({
          cachingService: this.cachingService,
          description: `Fetching media for nft with identifier '${nft.identifier}' and uri '${uri}'`,
          key: CacheInfo.PendingMediaGet(cacheIdentifier).key,
          ttl: CacheInfo.PendingMediaGet(cacheIdentifier).ttl,
          action: async () => await this.getFileProperties(uri),
        });
      } catch (error) {
        this.logger.error(`Unexpected error when fetching media for nft with identifier '${nft.identifier}' and uri '${uri}'`);
        this.logger.error(error);
      }

      if (!fileProperties) {
        this.logger.log(`Empty file properties for NFT with identifier '${nft.identifier}'`);
        continue;
      }

      if (!this.isContentTypeAccepted(fileProperties.contentType)) {
        this.logger.log(`Content type '${fileProperties.contentType}' not accepted for NFT with identifier '${nft.identifier}'`);
        continue;
      }

      const nftMedia = new NftMedia();
      nftMedia.url = TokenHelpers.computeNftUri(BinaryUtils.base64Decode(uri), this.NFT_THUMBNAIL_PREFIX);
      nftMedia.originalUrl = BinaryUtils.base64Decode(uri);

      // we generate thumbnail url only if file size is also accepted
      if (this.isFileSizeAccepted(fileProperties.contentLength)) {
        nftMedia.thumbnailUrl = `${this.apiConfigService.getExternalMediaUrl()}/nfts/thumbnail/${nft.collection}-${TokenHelpers.getUrlHash(nftMedia.url)}`;
      } else {
        this.logger.log(`File size '${fileProperties.contentLength}' not accepted for NFT with identifier '${nft.identifier}'`);
        nftMedia.thumbnailUrl = NftMediaService.NFT_THUMBNAIL_DEFAULT;
      }

      nftMedia.fileType = fileProperties.contentType;
      nftMedia.fileSize = fileProperties.contentLength;

      mediaArray.push(nftMedia);
    }

    return mediaArray;
  }

  private getUrl(nftUri: string, prefix: string): string {
    const url = BinaryUtils.base64Decode(nftUri);
    return TokenHelpers.computeNftUri(url, prefix);
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

    return { contentType, contentLength };
  }

  private isContentTypeAccepted(contentType: string): boolean {
    return Object.values(MediaMimeTypeEnum).includes(contentType as MediaMimeTypeEnum);
  }

  private isFileSizeAccepted(fileSize: number): boolean {
    return fileSize <= 64 * 1024 * 1024; // ~64MB
  }
}
