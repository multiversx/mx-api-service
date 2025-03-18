import { OriginLogger } from "@multiversx/sdk-nestjs-common";
import { ApiService } from "@multiversx/sdk-nestjs-http";
import { BadRequestException, Injectable } from "@nestjs/common";
import { ApiConfigService } from "src/common/api-config/api.config.service";

@Injectable()
export class MediaService {
  private readonly logger = new OriginLogger(MediaService.name);

  private readonly fallbackThumbnail = 'nfts/thumbnail/default.png';

  constructor(
    private readonly apiConfigService: ApiConfigService,
    private readonly apiService: ApiService,
  ) { }

  public async getRedirectUrl(uri: string): Promise<string | undefined> {
    const isFeatureEnabled = this.apiConfigService.isMediaRedirectFeatureEnabled();
    if (!isFeatureEnabled) {
      throw new BadRequestException('Media redirect is not allowed');
    }

    // providers logos
    if (uri.startsWith('providers/asset/')) {
      const awsUri = uri.replace('providers/asset/', 'keybase_processed_uploads/');
      return `https://s3.amazonaws.com/${awsUri}`;
    }

    // esdts logos
    if (uri.startsWith('tokens/asset/')) {
      const network = this.apiConfigService.getNetwork();
      const tokenUri = network === 'mainnet'
        ? uri.replace('tokens/asset/', 'multiversx/mx-assets/master/tokens/')
        : uri.replace('tokens/asset/', `multiversx/mx-assets/master/${network}/tokens/`);
      return `https://raw.githubusercontent.com/${tokenUri}`;
    }

    const fileStorageUrls = this.apiConfigService.getMediaRedirectFileStorageUrls();
    for (const fileStorageUrl of fileStorageUrls) {
      try {
        const { status } = await this.apiService.head(`${fileStorageUrl}/${uri}`, {
          validateStatus: () => true,
        });
        if (200 <= status && status <= 300) {
          return `${fileStorageUrl}/${uri}`;
        }
      } catch {
        this.logger.error(`Could not fetch ${fileStorageUrl}/${uri}`);
        continue;
      }
    }

    // nfts assets' ipfs mirror
    if (uri.startsWith('nfts/asset/')) {
      const ipfsUri = uri.replace('nfts/asset/', 'ipfs/');
      return `https://ipfs.io/${ipfsUri}`;
    }

    // fallback for nft thumbnails
    if (uri.startsWith('nfts/thumbnail/') && uri !== this.fallbackThumbnail && fileStorageUrls.length > 0) {
      return `${fileStorageUrls[0]}/${this.fallbackThumbnail}`;
    }

    return undefined;
  }
}
